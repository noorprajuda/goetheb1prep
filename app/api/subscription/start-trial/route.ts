import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/lib/subscriptionService';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Check if user already has access
    const hasAccess = await SubscriptionService.hasActiveSubscription(userId);
    if (hasAccess) {
      return NextResponse.json({ error: 'User already has active subscription' }, { status: 400 });
    }

    await SubscriptionService.startTrial(userId);
    
    return NextResponse.json({ success: true, message: 'Trial started successfully' });
  } catch (error) {
    console.error('Error starting trial:', error);
    return NextResponse.json(
      { error: 'Failed to start trial' },
      { status: 500 }
    );
  }
}
