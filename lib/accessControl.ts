import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from './subscriptionService';

export async function checkSubscriptionAccess(userId: string): Promise<boolean> {
  try {
    return await SubscriptionService.canAccessPremium(userId);
  } catch (error) {
    console.error('Error checking subscription access:', error);
    return false;
  }
}

export function withSubscriptionAccess(handler: (request: NextRequest, context: unknown) => Promise<NextResponse>) {
  return async (request: NextRequest, context: unknown) => {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const hasAccess = await checkSubscriptionAccess(userId);
    
    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'Subscription required',
        message: 'You need an active subscription to access this feature',
        redirectTo: '/subscription'
      }, { status: 403 });
    }

    return handler(request, context);
  };
}
