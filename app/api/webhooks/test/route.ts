import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Webhook endpoint is working',
    timestamp: new Date().toISOString(),
    environment: {
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_TEST_SECRET,
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      baseUrl: process.env.BASE_URL
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    console.log('🧪 Test webhook called with:', {
      hasBody: !!body,
      hasSignature: !!signature,
      bodyLength: body.length,
      signature: signature ? signature.substring(0, 20) + '...' : 'none'
    });
    
    return NextResponse.json({
      message: 'Test webhook received',
      timestamp: new Date().toISOString(),
      received: {
        hasBody: !!body,
        hasSignature: !!signature,
        bodyLength: body.length
      }
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json(
      { error: 'Test webhook failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}