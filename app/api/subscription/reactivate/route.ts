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
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    const stripeSubscriptionId = subscriptionStatus.subscription.stripeSubscriptionId;
    let stripeResult = null;

    // Reactivate subscription in Stripe if it exists
    if (stripeSubscriptionId && stripeSubscriptionId.startsWith('sub_')) {
      try {
        stripeResult = await StripeService.reactivateSubscription(stripeSubscriptionId);
        console.log('Stripe subscription reactivated:', stripeResult);
      } catch (stripeError) {
        console.warn('Failed to reactivate Stripe subscription (may not exist):', stripeError);
        // Continue with database reactivation even if Stripe fails
      }
    } else {
      console.log('No Stripe subscription to reactivate (one-time payment or test session)');
    }
    
    // Update subscription in our database using the embedded structure
    const reactivated = await SubscriptionService.updateSubscription(userId, {
      cancelAtPeriodEnd: false,
      cancelled: false,
      cancelledAt: undefined,
      autoRenew: true,
      status: 'active'
    });

    if (!reactivated) {
      return NextResponse.json({ error: 'Failed to reactivate subscription in database' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription reactivated successfully',
      subscription: {
        id: subscriptionStatus.subscription.id,
        plan: subscriptionStatus.subscription.plan,
        status: 'active',
        currentPeriodEnd: subscriptionStatus.subscription.currentPeriodEnd,
        cancelled: false,
        cancelAtPeriodEnd: false,
        autoRenew: true
      },
      stripeResult
    });

  } catch (error) {
    console.error('Error reactivating subscription:', error);
    return NextResponse.json({ 
      error: 'Failed to reactivate subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
