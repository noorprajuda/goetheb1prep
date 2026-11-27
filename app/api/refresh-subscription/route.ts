import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/lib/subscriptionService';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Force refresh subscription status from MongoDB
    const subscriptionStatus = await SubscriptionService.getSubscriptionStatus(userId);
    
    console.log('Refreshed subscription status:', {
      userId,
      hasAccess: subscriptionStatus.hasAccess,
      status: subscriptionStatus.status,
      currentPeriodEnd: subscriptionStatus.currentPeriodEnd,
      subscription: subscriptionStatus.subscription
    });
    
    return NextResponse.json({
      message: 'Subscription status refreshed',
      subscriptionStatus
    });
    
  } catch (error) {
    console.error('Error refreshing subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to refresh subscription status' },
      { status: 500 }
    );
  }
}
