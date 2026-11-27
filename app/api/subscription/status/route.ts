import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/lib/subscriptionService';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // Max 30 requests per minute per user

// Simple in-memory cache for subscription status
const statusCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds cache

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false; // Rate limit exceeded
  }
  
  userLimit.count++;
  return true;
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Check cache first
    const now = Date.now();
    const cached = statusCache.get(userId);
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('Returning cached subscription status for user:', userId);
      const response = NextResponse.json(cached.data);
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    // Check rate limit only for non-cached requests
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const status = await SubscriptionService.getSubscriptionStatus(userId);
    
    // Cache the result
    statusCache.set(userId, { data: status, timestamp: now });
    
    // Add cache-busting headers to prevent browser caching
    const response = NextResponse.json(status);
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('X-Cache', 'MISS');
    
    return response;
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}
