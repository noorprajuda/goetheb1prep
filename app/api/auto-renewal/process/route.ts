import { NextResponse } from 'next/server';
import { AutoRenewalService } from '@/lib/autoRenewalService';

export async function POST() {
  try {
    console.log('🔄 Manual auto-renewal process triggered');
    
    const result = await AutoRenewalService.processAutoRenewals();
    
    return NextResponse.json({
      success: true,
      message: 'Auto-renewal process completed',
      result
    });
  } catch (error) {
    console.error('Error in manual auto-renewal process:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Auto-renewal process failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get expiring subscriptions for debugging
    const { MongoDBUserService } = await import('@/lib/mongodbUserService');
    const expiringSubscriptions = await MongoDBUserService.getUsersWithExpiringShortTermSubscriptions();
    
    return NextResponse.json({
      success: true,
      expiringSubscriptions: expiringSubscriptions.map(({ subscription, user }: { subscription: { plan: string; currentPeriodEnd: Date; autoRenew: boolean; cancelled: boolean }; user: { _id: string; email: string } }) => ({
        userId: user._id,
        email: user.email,
        plan: subscription.plan,
        currentPeriodEnd: subscription.currentPeriodEnd,
        autoRenew: subscription.autoRenew,
        cancelled: subscription.cancelled
      }))
    });
  } catch (error) {
    console.error('Error fetching expiring subscriptions:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch expiring subscriptions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
