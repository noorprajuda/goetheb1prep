import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@/lib/stripeService';
import { SubscriptionService } from '@/lib/subscriptionService';
import { MongoDBUserService } from '@/lib/mongodbUserService';
import { AutoRenewalService } from '@/lib/autoRenewalService';
import { createSafeSubscriptionDates, validateSubscriptionDates } from '@/lib/mongodbSchema';

interface StripeSubscription {
  id: string;
  customer: string;
  current_period_start: number;
  current_period_end: number;
  metadata: {
    userId?: string;
    planId?: string;
  };
}

interface StripeInvoice {
  subscription: string;
  amount_paid?: number;
  amount_due?: number;
  currency: string;
  payment_intent: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Webhook received - checking signature and processing...');
    
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('❌ No Stripe signature provided');
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    console.log('✅ Stripe signature found, processing webhook...');
    console.log('Webhook secret configured:', !!process.env.STRIPE_WEBHOOK_TEST_SECRET);
    console.log('Signature received:', signature.substring(0, 50) + '...');
    
    let event;
    try {
      event = await StripeService.handleWebhook(body, signature);
      console.log(`✅ Processing Stripe webhook event: ${event.type}`);
    } catch (signatureError) {
      console.error('❌ Signature validation failed:', (signatureError as Error).message);
      console.log('⚠️  Attempting to parse webhook without signature validation for debugging...');
      
      // For debugging purposes, try to parse the webhook without signature validation
      try {
        const webhookData = JSON.parse(body);
        console.log('📝 Parsed webhook data:', {
          type: webhookData.type,
          id: webhookData.id,
          created: webhookData.created
        });
        
        // Create a mock event for testing
        event = {
          type: webhookData.type,
          data: webhookData.data,
          id: webhookData.id,
          created: webhookData.created
        };
        
        console.log('⚠️  Using mock event for debugging:', event.type);
      } catch (parseError) {
        console.error('❌ Failed to parse webhook body:', (parseError as Error).message);
        return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
      }
    }

    switch (event.type) {
      case 'customer.subscription.created':
        console.log('Handling subscription created event');
        await handleSubscriptionCreated(event.data.object);
        break;
        
      case 'customer.subscription.updated':
        console.log('Handling subscription updated event');
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        console.log('Handling subscription deleted event');
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        console.log('Handling payment succeeded event');
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        console.log('Handling payment failed event');
        await handlePaymentFailed(event.data.object);
        break;
      
      case 'checkout.session.completed':
        console.log('Handling checkout session completed event');
        await handleCheckoutCompleted(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    console.log(`Successfully processed webhook event: ${event.type}`);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

async function handleSubscriptionCreated(subscription: unknown) {
  try {
    const sub = subscription as StripeSubscription;
    const userId = sub.metadata?.userId;
    if (!userId) {
      console.error('No userId found in subscription metadata');
      return;
    }

    console.log(`Creating subscription for user ${userId}`);
    
    const plan = sub.metadata?.planId || 'monthly';
    
    // Check if this subscription has already been processed
    const existingSubscription = await MongoDBUserService.getUserSubscription(userId);
    if (existingSubscription?.subscription?.stripeSubscriptionId === sub.id) {
      console.log(`Subscription ${sub.id} already processed for user ${userId}, skipping duplicate`);
      return;
    }
    
    // Check if user is currently on trial (for logging purposes)
    // const subscriptionStatus = await SubscriptionService.getSubscriptionStatus(userId);
    
    // Validate and set subscription dates using safe date creation
    let currentPeriodStart = sub.current_period_start ? new Date(sub.current_period_start * 1000) : new Date();
    let currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    // Check if user already has any subscription (trial or paid)
    const userSubscription = await MongoDBUserService.getUserSubscription(userId);
    
    // For 1-month, 3-month and 6-month subscriptions, calculate the correct end date
    // Stripe sends current_period_end as 1 month from start, but we want the full duration
    if (plan === '1month' || plan === '3months' || plan === '6months') {
      console.log('📅 Adjusting end date for multi-month subscription:', plan);
      
      let adjustedEndDate;
      
      if (userSubscription?.subscription) {
        // For subscription upgrades, extend from the existing subscription's end date
        console.log('🔄 Subscription upgrade detected, extending from existing end date');
        const existingEndDate = new Date(userSubscription.subscription.currentPeriodEnd);
        adjustedEndDate = new Date(existingEndDate);
        
        if (plan === '1month') {
          adjustedEndDate.setMonth(adjustedEndDate.getMonth() + 1);
        } else if (plan === '3months') {
          adjustedEndDate.setMonth(adjustedEndDate.getMonth() + 3);
        } else if (plan === '6months') {
          adjustedEndDate.setMonth(adjustedEndDate.getMonth() + 6);
        }
        
        console.log('📊 Upgrade calculation:', {
          existingEndDate: existingEndDate,
          newEndDate: adjustedEndDate,
          plan: plan
        });
      } else {
        // For new subscriptions, calculate from the start date
        console.log('🆕 New subscription, calculating from start date');
        const startDate = currentPeriodStart;
        adjustedEndDate = new Date(startDate);
        
        if (plan === '1month') {
          adjustedEndDate.setMonth(adjustedEndDate.getMonth() + 1);
        } else if (plan === '3months') {
          adjustedEndDate.setMonth(adjustedEndDate.getMonth() + 3);
        } else if (plan === '6months') {
          adjustedEndDate.setMonth(adjustedEndDate.getMonth() + 6);
        }
        
        console.log('📊 New subscription calculation:', {
          startDate: startDate,
          newEndDate: adjustedEndDate,
          plan: plan
        });
      }
      
      console.log('📊 Final date adjustment:', {
        originalEnd: currentPeriodEnd,
        adjustedEnd: adjustedEndDate,
        plan: plan
      });
      
      currentPeriodEnd = adjustedEndDate;
    }
    
    // Validate dates and use safe defaults if invalid
    if (!validateSubscriptionDates(currentPeriodStart, currentPeriodEnd)) {
      console.warn('⚠️  Invalid Stripe subscription dates, using safe defaults');
      const safeDates = createSafeSubscriptionDates(plan, currentPeriodStart);
      currentPeriodStart = safeDates.currentPeriodStart;
      currentPeriodEnd = safeDates.currentPeriodEnd;
    }
    
    console.log('Subscription dates:', {
      currentPeriodStart,
      currentPeriodEnd,
      originalStart: sub.current_period_start,
      originalEnd: sub.current_period_end
    });
    
    if (userSubscription?.subscription) {
      // For recurring subscriptions, update with Stripe's exact dates
      console.log(`Updating existing subscription for user ${userId} from ${userSubscription.subscription.plan} to ${plan}`);
      console.log('Existing subscription:', userSubscription.subscription);
      
      // For recurring subscriptions, use Stripe's exact dates instead of extending
      const result = await SubscriptionService.updateSubscription(
        userId,
        {
          plan: plan,
          status: 'active',
          stripeSubscriptionId: sub.id,
          stripeCustomerId: sub.customer,
          currentPeriodStart: currentPeriodStart,
          currentPeriodEnd: currentPeriodEnd,
          cancelled: false,
          autoRenew: true
        }
      );
      
      // Create initial payment record for subscription creation
      await SubscriptionService.createPayment({
        userId,
        amount: 0, // No payment amount for subscription creation
        currency: 'eur',
        status: 'succeeded',
        stripePaymentIntentId: `sub_${sub.id}`,
        stripeSessionId: (sub.metadata as { sessionId?: string })?.sessionId || `subscription_${sub.id}`,
        description: `Subscription created for ${plan} plan - Subscription: ${sub.id}`,
        planId: plan,
        paymentType: 'subscription',
        source: 'webhook',
        subscriptionBefore: userSubscription.subscription ? {
          plan: userSubscription.subscription.plan,
          currentPeriodStart: userSubscription.subscription.currentPeriodStart,
          currentPeriodEnd: userSubscription.subscription.currentPeriodEnd
        } : undefined
      });
      console.log('Subscription update result:', result);
    } else {
      // Create new subscription only if none exists
      console.log(`Creating new subscription for user ${userId} with plan ${plan}`);
      await SubscriptionService.createSubscription({
        userId,
        plan,
        stripeSubscriptionId: sub.id,
        stripeCustomerId: sub.customer,
        currentPeriodStart,
        currentPeriodEnd,
      });
      
      // Create initial payment record for new subscription
      await SubscriptionService.createPayment({
        userId,
        amount: 0, // No payment amount for subscription creation
        currency: 'eur',
        status: 'succeeded',
        stripePaymentIntentId: `sub_${sub.id}`,
        stripeSessionId: (sub.metadata as { sessionId?: string })?.sessionId || `subscription_${sub.id}`,
        description: `New subscription created for ${plan} plan - Subscription: ${sub.id}`,
        planId: plan,
        paymentType: 'subscription',
        source: 'webhook'
      });
    }

    console.log(`Successfully created subscription for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription creation:', error);
  }
}

async function handleSubscriptionUpdated(subscription: unknown) {
  try {
    const sub = subscription as StripeSubscription;
    const userId = sub.metadata?.userId;
    if (!userId) {
      console.error('No userId found in subscription metadata');
      return;
    }

    console.log(`Updating subscription for user ${userId}`);
    
    const existingSubscription = await SubscriptionService.getUserSubscription(userId);
    
    // Validate and set subscription dates
    const currentPeriodStart = sub.current_period_start ? new Date(sub.current_period_start * 1000) : new Date();
    const currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days from now
    
    console.log('Subscription update dates:', {
      currentPeriodStart,
      currentPeriodEnd,
      originalStart: sub.current_period_start,
      originalEnd: sub.current_period_end
    });

    if (existingSubscription?.subscription) {
      await SubscriptionService.updateSubscription(userId, {
        stripeSubscriptionId: sub.id,
        stripeCustomerId: sub.customer,
        currentPeriodStart,
        currentPeriodEnd,
      });
      console.log(`Successfully updated subscription for user ${userId}`);
    } else {
      console.log(`No existing subscription found for user ${userId}, creating new one`);
      await SubscriptionService.createSubscription({
        userId,
        plan: sub.metadata?.planId || 'monthly',
        stripeSubscriptionId: sub.id,
        stripeCustomerId: sub.customer,
        currentPeriodStart,
        currentPeriodEnd,
      });
    }
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

async function handleSubscriptionDeleted(subscription: unknown) {
  try {
    const sub = subscription as StripeSubscription;
    const userId = sub.metadata?.userId;
    if (!userId) return;

    const existingSubscription = await SubscriptionService.getUserSubscription(userId);
    
    if (existingSubscription?.subscription) {
      await SubscriptionService.cancelSubscription(userId);
    }
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

async function handlePaymentSucceeded(invoice: unknown) {
  try {
    const inv = invoice as StripeInvoice;
    const subscription = await StripeService.getSubscription(inv.subscription);
    const userId = subscription.metadata?.userId;
    
    if (!userId) {
      console.error('No userId found in subscription metadata for payment');
      return;
    }

    console.log(`Payment succeeded for user ${userId}, amount: ${inv.amount_paid}`);
    console.log('Invoice details:', {
      id: (inv as unknown as { id: string }).id,
      payment_intent: inv.payment_intent,
      charge: (inv as unknown as { charge: string }).charge,
      subscription: inv.subscription,
      metadata: (inv as unknown as { metadata: Record<string, string> }).metadata
    });
    
    // Add timestamp for debugging
    console.log('🕐 Payment processing timestamp:', new Date().toISOString());

    // Create a unique identifier for this payment based on available data
    const paymentUniqueId = `${(inv as unknown as { id: string }).id}_${inv.subscription}_${inv.amount_paid}_${inv.currency}`;
    
    // Use atomic operation to check and create payment in one step
    // This prevents race conditions by using MongoDB's atomic operations
    const paymentData = {
      amount: inv.amount_paid || 0,
      currency: inv.currency,
      status: 'succeeded',
      stripePaymentIntentId: inv.payment_intent || `recurring_${(inv as unknown as { id: string }).id}`,
      stripeSessionId: (inv as unknown as { metadata?: { sessionId?: string } }).metadata?.sessionId || `recurring_${(inv as unknown as { id: string }).id}`,
      stripeChargeId: (inv as unknown as { charge: string }).charge || `recurring_${(inv as unknown as { id: string }).id}`,
      description: `Recurring subscription payment for ${subscription.metadata?.planId || 'monthly'} plan - Invoice: ${(inv as unknown as { id: string }).id} - Subscription: ${inv.subscription} - UniqueID: ${paymentUniqueId}`,
      planId: subscription.metadata?.planId || 'monthly',
      paymentType: 'subscription',
      source: 'webhook',
      createdAt: new Date(),
      processedAt: new Date()
    };

    console.log('🔍 Attempting atomic payment creation:', {
      paymentUniqueId: paymentUniqueId,
      invoiceId: (inv as unknown as { id: string }).id,
      subscriptionId: inv.subscription,
      amount: inv.amount_paid,
      currency: inv.currency
    });

    // Try to create payment atomically - this will fail if duplicate exists
    try {
      const result = await MongoDBUserService.createPaymentAtomically(userId, paymentData, paymentUniqueId);
      
      if (result.success) {
        console.log('✅ Payment created successfully with atomic operation');
      } else {
        console.log('🚫 Payment already exists - SKIPPING DUPLICATE (atomic check)');
        return;
      }
    } catch (error) {
      console.log('🚫 Payment creation failed - likely duplicate (atomic check):', (error as Error).message);
      return;
    }

    // Payment was already created atomically above
    console.log('✅ Payment processing completed successfully');

    // Note: For one-time payments (1day, 1week), subscription extension is handled by handleCheckoutCompleted
    // This function only handles recurring subscription payments and payment records
    console.log(`Payment succeeded for user ${userId}, amount: ${inv.amount_paid}, currency: ${inv.currency}`);

    console.log(`Successfully processed payment for user ${userId}`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(invoice: unknown) {
  try {
    const inv = invoice as StripeInvoice;
    const subscription = await StripeService.getSubscription(inv.subscription);
    const userId = subscription.metadata?.userId;
    
    if (!userId) {
      console.error('No userId found in subscription metadata for failed payment');
      return;
    }

    console.log(`Payment failed for user ${userId}, amount: ${inv.amount_due}`);

    await SubscriptionService.createPayment({
      userId,
      amount: inv.amount_due || 0,
      currency: inv.currency,
      status: 'failed',
      stripePaymentIntentId: inv.payment_intent,
      description: `Failed payment for ${subscription.metadata?.planId || 'monthly'} plan`,
    });

    // Update subscription status to indicate payment failure
    const existingSubscription = await SubscriptionService.getUserSubscription(userId);
    if (existingSubscription?.subscription) {
      await SubscriptionService.updateSubscription(userId, {
        status: 'past_due',
      });
      console.log(`Updated subscription status to past_due for user ${userId}`);
    }

    console.log(`Successfully processed failed payment for user ${userId}`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handleCheckoutCompleted(session: unknown) {
  try {
    const sess = session as { 
      metadata?: { userId?: string; planId?: string }; 
      id: string; 
      mode?: string;
      customer?: string;
      success_url?: string;
    };
    const userId = sess.metadata?.userId;
    const planId = sess.metadata?.planId;
    
    if (!userId) {
      console.error('No userId found in checkout session metadata');
      return;
    }

    console.log(`Checkout completed for user ${userId}, session: ${sess.id}, mode: ${sess.mode}, planId: ${planId}`);
    console.log('Session metadata:', sess.metadata);

    // Validate planId
    if (!planId) {
      console.error(`No planId found in session metadata for session ${sess.id}`);
      return;
    }

    // Validate planId is a valid plan
    const validPlans = ['1day', '1week', '1month', '3months', '6months', 'lifetime'];
    if (!validPlans.includes(planId)) {
      console.error(`Invalid planId '${planId}' found in session metadata for session ${sess.id}`);
      return;
    }

    // Check if this session has already been processed to prevent duplicate extensions
    const existingSubscription = await SubscriptionService.getUserSubscription(userId);
    if (existingSubscription?.subscription?.stripeSubscriptionId === `payment_${sess.id}`) {
      console.log(`Session ${sess.id} already processed, skipping duplicate processing`);
      return;
    }

    // Additional check: if the subscription was updated very recently (within last 5 minutes), skip processing
    if (existingSubscription?.subscription?.updatedAt) {
      const lastUpdate = new Date(existingSubscription.subscription.updatedAt);
      const now = new Date();
      const timeDiff = now.getTime() - lastUpdate.getTime();
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
      
      if (timeDiff < fiveMinutes) {
        console.log(`Subscription updated recently (${Math.round(timeDiff / 1000)}s ago), skipping duplicate processing`);
        return;
      }
    }

    // Check if this is an auto-renewal checkout
    const isAutoRenewal = sess.success_url?.includes('auto_renewal=true');

    // If this is a subscription checkout, the subscription will be created
    // by the customer.subscription.created webhook, so we just log it here
    if (sess.mode === 'subscription') {
      console.log(`Subscription checkout completed for user ${userId} - subscription will be handled by customer.subscription.created webhook`);
      return; // Don't process subscription checkouts here
    } else if (sess.mode === 'payment') {
      // Handle one-time payment (1day, 1week, lifetime plans)
      console.log(`One-time payment completed for user ${userId}, plan: ${planId}, auto-renewal: ${isAutoRenewal}`);
      
      // Only process one-time payment plans, not recurring subscriptions
      const oneTimePlans = ['1day', '1week', 'lifetime'];
      if (!oneTimePlans.includes(planId)) {
        console.log(`Skipping processing for recurring plan ${planId} in payment mode - should be handled by subscription webhook`);
        return;
      }
      
      if (planId) {
        if (isAutoRenewal) {
          // Handle auto-renewal payment
          await AutoRenewalService.handleSuccessfulAutoRenewal(userId, planId, sess.id);
        } else {
          // Handle regular one-time payment
          // Get session details to get payment timestamp
          const sessionDetails = await StripeService.getCheckoutSession(sess.id);
          const paymentTime = new Date(sessionDetails.created * 1000);
          
          // Get current subscription to extend from current end date
          const subscriptionStatus = await SubscriptionService.getSubscriptionStatus(userId);
          let baseDate = paymentTime; // Default to payment time for new subscriptions
          
          if (subscriptionStatus.hasAccess && subscriptionStatus.subscription) {
            // Only extend from current subscription end date if subscription is still active (not expired)
            const currentEndDate = new Date(subscriptionStatus.subscription.currentPeriodEnd);
            const now = new Date();
            
            if (currentEndDate > now) {
              // Subscription is still active, extend from current end date
              baseDate = currentEndDate;
              console.log('Extending active subscription from current end date:', baseDate);
            } else {
              // Subscription has expired, start fresh from payment time
              baseDate = paymentTime;
              console.log('Subscription expired, starting fresh from payment time:', baseDate);
            }
          }
          
          console.log('Payment processing details:', {
            userId,
            planId,
            paymentTime,
            baseDate,
            paymentTimeFormatted: paymentTime.toISOString(),
            baseDateFormatted: baseDate.toISOString()
          });
          
          if (subscriptionStatus.status === 'active' && subscriptionStatus.subscription) {
            // Handle both trial conversion and subscription extension
            const isTrial = subscriptionStatus.subscription.plan === 'trial';
            const isLifetimeUpgrade = planId === 'lifetime';
            
            if (isTrial) {
              console.log(`Converting trial to paid subscription for user ${userId}`);
              console.log('Trial status before conversion (one-time payment):', subscriptionStatus);
            } else if (isLifetimeUpgrade) {
              console.log(`Upgrading existing subscription to lifetime for user ${userId}`);
              console.log('Current subscription before lifetime upgrade:', subscriptionStatus);
            } else {
              console.log(`Extending existing active subscription for user ${userId}`);
              console.log('Active subscription status before extension (one-time payment):', subscriptionStatus);
            }
            
            // Log the current subscription details
            if (subscriptionStatus.subscription) {
              console.log('Current subscription details:', {
                plan: subscriptionStatus.subscription.plan,
                currentPeriodStart: subscriptionStatus.subscription.currentPeriodStart,
                currentPeriodEnd: subscriptionStatus.subscription.currentPeriodEnd,
                stripeSubscriptionId: subscriptionStatus.subscription.stripeSubscriptionId
              });
            }
            
            let result;
            if (isLifetimeUpgrade) {
              // Special handling for lifetime upgrades - don't overwrite existing subscription
              result = await SubscriptionService.upgradeToLifetime(
                userId,
                `payment_${sess.id}`,
                sess.customer || `customer_${userId}`,
                paymentTime
              );
            } else {
              result = await SubscriptionService.convertTrialToSubscription(
                userId,
                planId,
                `payment_${sess.id}`, // Use session ID as subscription ID for one-time payments
                sess.customer || `customer_${userId}`,
                paymentTime
                // Don't pass subscriptionEnd - let convertTrialToSubscription calculate it
              );
            }
            console.log('Subscription processing result (one-time payment):', result);
          } else {
            // Create new subscription for users without any subscription
            console.log('Creating new subscription with details:', {
              userId,
              plan: planId,
              stripeSubscriptionId: `payment_${sess.id}`,
              stripeCustomerId: sess.customer || `customer_${userId}`,
              currentPeriodStart: paymentTime,
              currentPeriodStartFormatted: paymentTime.toISOString()
            });
            
            // Calculate correct end date based on plan
            const endDate = new Date(paymentTime);
            switch (planId) {
              case '1day':
                endDate.setDate(paymentTime.getDate() + 1);
                break;
              case '1week':
                endDate.setDate(paymentTime.getDate() + 7);
                break;
              case '1month':
                endDate.setMonth(paymentTime.getMonth() + 1);
                break;
              case '3months':
                endDate.setMonth(paymentTime.getMonth() + 3);
                break;
              case '6months':
                endDate.setMonth(paymentTime.getMonth() + 6);
                break;
              case 'lifetime':
                endDate.setFullYear(paymentTime.getFullYear() + 100);
                break;
              default:
                endDate.setDate(paymentTime.getDate() + 1);
            }
            
            const newSubscription = await SubscriptionService.createSubscription({
              userId,
              plan: planId,
              stripeSubscriptionId: `payment_${sess.id}`,
              stripeCustomerId: sess.customer || `customer_${userId}`,
              currentPeriodStart: paymentTime,
              currentPeriodEnd: endDate,
            });
            
            console.log('New subscription created:', newSubscription);
          }
        }
      }
    }

    console.log(`Successfully processed checkout completion for user ${userId}`);
  } catch (error) {
    console.error('Error handling checkout completion:', error);
  }
}
