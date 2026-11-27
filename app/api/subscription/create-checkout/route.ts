import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@/lib/stripeService';
import { MongoDBUserService } from '@/lib/mongodbUserService';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { plan } = await request.json();
    
    console.log('Create checkout request received:', { plan, userId });
    
    if (!plan || !['1day', '1week', '1month', '3months', '6months', 'lifetime'].includes(plan)) {
      console.error('Invalid plan ID:', plan);
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    // Get user details to pass email to Stripe
    const user = await MongoDBUserService.getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const baseUrl = process.env.BASE_URL || 
                   process.env.APP_URL || 
                   process.env.NEXT_PUBLIC_APP_URL || 
                   (process.env.NODE_ENV === 'production' ? 'https://www.goetheb1prep.com' : 'http://localhost:3000');
    
    const session = await StripeService.createCheckoutSession({
      userId,
      planId: plan,
      successUrl: `${baseUrl}/ngrok-bypass?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/subscription`,
      customerEmail: user.email, // Pass user's email to create fresh customer
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      plan: request.body ? 'present' : 'missing'
    });
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
