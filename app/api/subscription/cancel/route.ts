import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@/lib/stripeService';
import { SubscriptionService } from '@/lib/subscriptionService';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Get user's subscription to find Stripe subscription ID
    const subscriptionStatus = await SubscriptionService.getSubscriptionStatus(userId);
    
    if (!subscriptionStatus.subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const stripeSubscriptionId = subscriptionStatus.subscription.stripeSubscriptionId;
    let stripeResult = null;

    // Cancel subscription in Stripe if it exists
    if (stripeSubscriptionId && stripeSubscriptionId.startsWith('sub_')) {
      try {
        stripeResult = await StripeService.cancelSubscription(stripeSubscriptionId);
        console.log('Stripe subscription cancelled:', stripeResult);
      } catch (stripeError) {
        console.warn('Failed to cancel Stripe subscription (may not exist):', stripeError);
        // Continue with database cancellation even if Stripe fails
      }
    } else {
      console.log('No Stripe subscription to cancel (one-time payment or test session)');
    }
    
    // Update subscription in our database using the embedded structure
    const cancelled = await SubscriptionService.cancelSubscription(userId);

    if (!cancelled) {
      return NextResponse.json({ error: 'Failed to cancel subscription in database' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription cancelled successfully',
      subscription: {
        id: subscriptionStatus.subscription.id,
        plan: subscriptionStatus.subscription.plan,
        status: 'cancelled',
        currentPeriodEnd: subscriptionStatus.subscription.currentPeriodEnd,
        cancelled: true,
        cancelledAt: new Date().toISOString(),
        cancelAtPeriodEnd: true
      },
      stripeResult
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json({ 
      error: 'Failed to cancel subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
