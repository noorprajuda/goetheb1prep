import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/lib/subscriptionService';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const user = await SubscriptionService.getUserSubscription(userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const subscriptionStatus = await SubscriptionService.getSubscriptionStatus(userId);
    
    return NextResponse.json({
      userId,
      hasAccess: subscriptionStatus.hasAccess,
      status: subscriptionStatus.status,
      subscription: user.subscription,
      payments: user.payments?.slice(0, 5), // Last 5 payments
      createdAt: user.createdAt,
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Status check failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
