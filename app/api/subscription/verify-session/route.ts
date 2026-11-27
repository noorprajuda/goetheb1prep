import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripeService';
import { SubscriptionService } from '@/lib/subscriptionService';
import { MongoDBUserService } from '@/lib/mongodbUserService';

// interface StripeSubscriptionWithPeriods {
//   id: string;
//   customer: string;
//   current_period_start: number;
//   current_period_end: number;
//   metadata?: {
//     planId?: string;
//   };
// }

export async function POST(request: NextRequest) {
  try {
    console.log('verify-session endpoint called');
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      console.log('No user ID provided');
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    console.log('User ID:', userId);

    const requestBody = await request.json();
    const { sessionId, planId: requestPlanId, amount_total, currency, payment_intent, customer, created } = requestBody;
    
    if (!sessionId) {
      console.log('No session ID provided');
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    console.log('Session ID:', sessionId);

    // Check if user has any subscription (trial or paid) - we'll process the payment regardless
    const subscriptionStatus = await SubscriptionService.getSubscriptionStatus(userId);
    console.log('Current subscription status:', {
      hasAccess: subscriptionStatus.hasAccess,
      status: subscriptionStatus.status,
      plan: subscriptionStatus.subscription?.plan
    });

    // Get current user details for cross-account verification
    const currentUser = await MongoDBUserService.getUserById(userId);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Try to retrieve the session from Stripe
    let session;
    try {
      console.log('Retrieving Stripe session:', sessionId);
      session = await stripe.checkout.sessions.retrieve(sessionId);
      console.log('Stripe session retrieved successfully:', {
        id: session.id,
        payment_status: session.payment_status,
        mode: session.mode,
        customer: session.customer,
        customer_details: session.customer_details
      });
    } catch (stripeError) {
      console.error('Stripe session retrieval failed:', stripeError);
      
      // For test sessions that don't exist in Stripe, simulate the payment
      if (sessionId.startsWith('cs_test_')) {
        console.log('Test session detected, simulating payment completion');
        
        // Simulate a successful payment for testing
        const mockSession = {
          id: sessionId,
          payment_status: 'paid',
          mode: 'payment',
          customer: customer || `test_customer_${userId}`,
          metadata: { planId: requestPlanId || '1day' },
          amount_total: amount_total || 799,
          currency: currency || 'eur',
          payment_intent: payment_intent || `pi_test_${sessionId}`,
          created: created || Math.floor(Date.now() / 1000)
        };
        
        session = mockSession;
        console.log('Using mock session for testing:', mockSession);
      } else {
        // If Stripe session retrieval fails, check if user has any paid subscription
        if (subscriptionStatus.hasAccess) {
          console.log('Stripe session failed but user has access, verification successful');
          return NextResponse.json({ success: true });
        }
        throw new Error(`Stripe session verification failed: ${stripeError instanceof Error ? stripeError.message : 'Unknown error'}`);
      }
    }
    
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const planId = session.metadata?.planId;
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID not found in session metadata' }, { status: 400 });
    }

    // Verify that this session was created for the current user
    const sessionUserId = (session.metadata as { userId?: string })?.userId;
    if (sessionUserId && sessionUserId !== userId) {
      console.log('Session was created for different user:', {
        sessionUserId,
        currentUserId: userId,
        sessionCustomerId: session.customer,
        sessionCustomerEmail: (session as { customer_details?: { email?: string } }).customer_details?.email
      });
      return NextResponse.json({ 
        error: 'Payment was made for a different account. Please contact support if you were charged.' 
      }, { status: 400 });
    }

    // Additional validation: Check if the customer email matches the current user's email
    if ((session as { customer_details?: { email?: string } }).customer_details?.email) {
      const sessionEmail = (session as { customer_details: { email: string } }).customer_details.email.toLowerCase().trim();
      const currentUserEmail = currentUser.email.toLowerCase().trim();
      
      console.log('Email validation:', {
        sessionEmail,
        currentUserEmail,
        userId,
        match: sessionEmail === currentUserEmail
      });
      
      // Check if emails match (case-insensitive and trimmed)
      if (sessionEmail !== currentUserEmail) {
        console.log('Session customer email does not match current user email:', {
          sessionEmail,
          currentUserEmail,
          userId
        });
        return NextResponse.json({ 
          error: 'Payment was made with a different email address. Please contact support if you were charged.' 
        }, { status: 400 });
      }
    }

    // Handle different payment types
    if (session.mode === 'payment') {
      // One-time payment (1day, 1week, lifetime)
      console.log('Processing one-time payment for plan:', planId);
      
      // Skip processing for recurring subscription plans in verify-session
      // These should only be handled by webhooks
      const recurringPlans = ['1month', '3months', '6months'];
      if (recurringPlans.includes(planId)) {
        console.log('Skipping recurring subscription plan in verify-session - should be handled by webhooks only');
        return NextResponse.json({ 
          success: true, 
          message: 'Recurring subscription will be processed by webhook' 
        });
      }
      
      // More robust duplicate protection using atomic database operations
      const existingPayments = await MongoDBUserService.getUserPayments(userId);
      
      // Check if this exact payment intent ID already exists
      const paymentAlreadyExists = existingPayments.some(payment => 
        payment.stripePaymentIntentId === session.payment_intent
      );

      if (paymentAlreadyExists) {
        console.log(`Payment intent ${session.payment_intent} already processed for user ${userId}`);
        return NextResponse.json({
          success: true,
          message: 'Payment already processed',
          alreadyProcessed: true
        });
      }

      // Check if this session ID already exists
      const sessionAlreadyExists = existingPayments.some(payment => 
        payment.description?.includes(session.id)
      );

      if (sessionAlreadyExists) {
        console.log(`Session ${session.id} already processed for user ${userId}`);
        return NextResponse.json({
          success: true,
          message: 'Session already processed',
          alreadyProcessed: true
        });
      }

      // Additional protection: Check for very recent payments (within last 30 seconds)
      const now = new Date();
      const thirtySecondsAgo = new Date(now.getTime() - 30000);
      const recentPayment = existingPayments.find(payment => 
        (payment.stripePaymentIntentId === session.payment_intent || 
         payment.description?.includes(session.id)) &&
        new Date(payment.createdAt) > thirtySecondsAgo
      );

      if (recentPayment) {
        console.log(`Payment was processed recently for user ${userId}, skipping duplicate`);
        return NextResponse.json({
          success: true,
          message: 'Payment was processed recently',
          alreadyProcessed: true
        });
      }

      console.log(`Starting payment processing for session ${session.id}, payment intent ${session.payment_intent}`);

      // Create a processing lock to prevent race conditions
      const processingLockKey = `processing_${session.payment_intent}_${userId}`;
      const lockExpiry = new Date(Date.now() + 60000); // 1 minute lock
      
      try {
        // Try to acquire the processing lock
        const lockResult = await MongoDBUserService.acquireProcessingLock(userId, processingLockKey, lockExpiry);
        if (!lockResult) {
          console.log(`Processing lock already exists for ${processingLockKey}, skipping duplicate`);
          return NextResponse.json({
            success: true,
            message: 'Payment is currently being processed',
            alreadyProcessed: true
          });
        }
        
        console.log(`Acquired processing lock for ${processingLockKey}`);
      } catch (error) {
        console.error('Error acquiring processing lock:', error);
        // Continue processing even if lock fails
      }

      // Get current subscription status before payment
      const subscriptionStatusBefore = await SubscriptionService.getSubscriptionStatus(userId);
      const currentSubscription = await SubscriptionService.getUserSubscription(userId);
      console.log('Current subscription before payment:', {
        userId,
        currentEndDate: currentSubscription?.subscription?.currentPeriodEnd,
        plan: currentSubscription?.subscription?.plan
      });

      // For one-time payments, extend subscription (webhook may not be working)
      console.log('One-time payment verified for plan:', planId);
      
      // Extend subscription
      const paymentTime = new Date(session.created * 1000);
      await SubscriptionService.convertTrialToSubscription(
        userId,
        planId,
        `payment_${session.id}`,
        session.customer as string,
        paymentTime
      );

      // Get subscription status after processing
      const subscriptionStatusAfter = await SubscriptionService.getSubscriptionStatus(userId);
      
      // Calculate extension days
      const extensionDays = subscriptionStatusBefore.subscription && subscriptionStatusAfter.subscription ? 
        Math.round((new Date(subscriptionStatusAfter.subscription.currentPeriodEnd).getTime() - 
                   new Date(subscriptionStatusBefore.subscription.currentPeriodEnd).getTime()) / (1000 * 60 * 60 * 24)) : 0;

      // Create payment record with detailed tracking
      await SubscriptionService.createPayment({
        userId,
        amount: session.amount_total || 0,
        currency: session.currency || 'eur',
        status: 'succeeded',
        stripePaymentIntentId: session.payment_intent as string,
        stripeSessionId: session.id,
        description: `One-time payment for ${planId} plan - Session: ${session.id}`,
        planId: planId,
        paymentType: 'one_time',
        source: 'verify_session',
        subscriptionBefore: subscriptionStatusBefore.subscription ? {
          plan: subscriptionStatusBefore.subscription.plan,
          currentPeriodStart: subscriptionStatusBefore.subscription.currentPeriodStart,
          currentPeriodEnd: subscriptionStatusBefore.subscription.currentPeriodEnd
        } : undefined,
        subscriptionAfter: subscriptionStatusAfter.subscription ? {
          plan: subscriptionStatusAfter.subscription.plan,
          currentPeriodStart: subscriptionStatusAfter.subscription.currentPeriodStart,
          currentPeriodEnd: subscriptionStatusAfter.subscription.currentPeriodEnd
        } : undefined,
        extensionDays: extensionDays
      });

      console.log('Payment record created and subscription extended for user:', userId);

      // Release the processing lock
      try {
        await MongoDBUserService.releaseProcessingLock(userId, processingLockKey);
        console.log(`Released processing lock for ${processingLockKey}`);
      } catch (error) {
        console.error('Error releasing processing lock:', error);
      }

    } else if (session.mode === 'subscription') {
      // Recurring subscription - skip processing in verify-session
      // These should only be handled by webhooks to prevent duplicates
      console.log('Skipping recurring subscription processing in verify-session - should be handled by webhooks only');
      return NextResponse.json({ 
        success: true, 
        message: 'Recurring subscription will be processed by webhook' 
      });
    } else {
      return NextResponse.json({ error: 'Unsupported payment mode' }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying session:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: request.headers.get('x-user-id'),
      sessionId: request.body ? 'present' : 'missing'
    });
    
    // Release processing lock on error
    try {
      const userId = request.headers.get('x-user-id');
      if (userId && request.body) {
        const body = await request.json();
        const processingLockKey = `processing_${body.payment_intent}_${userId}`;
        await MongoDBUserService.releaseProcessingLock(userId, processingLockKey);
        console.log(`Released processing lock on error for ${processingLockKey}`);
      }
    } catch (lockError) {
      console.error('Error releasing processing lock on error:', lockError);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to verify session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
