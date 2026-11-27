import { NextRequest, NextResponse } from 'next/server';
import { MongoDBUserService } from '@/lib/mongodbUserService';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`Fetching payment history for user ${userId}`);

    // Get all payments for the user
    const payments = await MongoDBUserService.getUserPayments(userId);
    
    // Get current subscription status
    const subscription = await MongoDBUserService.getUserSubscription(userId);
    
    return NextResponse.json({
      success: true,
      userId,
      paymentCount: payments.length,
      payments: payments.map((payment, index) => ({
        id: `payment-${index}`,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        description: payment.description,
        createdAt: payment.createdAt,
        stripePaymentIntentId: payment.stripePaymentIntentId
      })),
      currentSubscription: subscription?.subscription ? {
        plan: subscription.subscription.plan,
        status: subscription.subscription.status,
        currentPeriodStart: subscription.subscription.currentPeriodStart,
        currentPeriodEnd: subscription.subscription.currentPeriodEnd,
        createdAt: subscription.subscription.createdAt,
        updatedAt: subscription.subscription.updatedAt
      } : null
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json({
      error: 'Failed to fetch payment history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
