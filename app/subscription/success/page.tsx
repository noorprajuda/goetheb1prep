"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/hooks/useApi';
// import Image from 'next/image';
import LoadingCard from "@/components/shared/LoadingCard";

function SubscriptionSuccessContent() {
  const searchParams = useSearchParams();
  // const router = useRouter();
  const { user } = useAuth();
  const { apiCall } = useApi();
  const [loading, setLoading] = useState(true);
  // const [success, setSuccess] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const verificationStartedRef = useRef(false);

  const verifySession = useCallback(async (sessionId: string) => {
    try {
      console.log('Verifying session:', sessionId, 'for user:', user?.id);
      
      if (!user?.id) {
        console.error('No user ID available for verification');
        setLoading(false);
        return;
      }
      
      const response = await apiCall('/api/subscription/verify-session', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      });

      console.log('Verification response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Verification result:', result);
        // setSuccess(true);
        
        // Don't auto-redirect - let users stay on success page and choose where to go
      } else {
        const error = await response.json();
        console.error('Verification failed:', error);
        
        // If the error is about user not found, try to handle it gracefully
        if (error.error === 'User not found' && retryCount < 3) {
          console.log('User not found error - retrying verification in 2 seconds...', retryCount + 1);
          setRetryCount(prev => prev + 1);
          // Retry verification after a delay
          setTimeout(() => {
            verifySession(sessionId);
          }, 2000);
        } else {
          console.log('Verification failed after retries or other error:', error);
          // setSuccess(false);
        }
      }
    } catch (error) {
      console.error('Error verifying session:', error);
      // setSuccess(false);
    } finally {
      setLoading(false);
    }
  }, [apiCall, user, retryCount]);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const skipNgrokWarning = searchParams.get('ngrok_skip_warning');
    
    console.log('Success page useEffect:', {
      sessionId,
      skipNgrokWarning,
      user: user ? { id: user.id, email: user.email } : null,
      hasSessionId: !!sessionId,
      hasUser: !!user,
      verificationStarted: verificationStartedRef.current
    });

    // Handle ngrok warning bypass
    if (skipNgrokWarning === 'true') {
      console.log('Ngrok warning bypass detected - checking for warning page...');
      
      // Check if we're on the ngrok warning page
      const checkForNgrokWarning = () => {
        const ngrokWarningElement = document.querySelector('a[href*="ngrok"]');
        if (ngrokWarningElement) {
          console.log('Ngrok warning page detected - auto-clicking through...');
          (ngrokWarningElement as HTMLAnchorElement).click();
          return true;
        }
        return false;
      };

      // Check immediately and then every 100ms for up to 2 seconds
      let attempts = 0;
      const maxAttempts = 20;
      const interval = setInterval(() => {
        attempts++;
        if (checkForNgrokWarning() || attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }, 100);

      // Clean up interval after 2 seconds
      setTimeout(() => clearInterval(interval), 2000);
    }
    
    if (sessionId && user && user.id) {
      // Prevent multiple verification calls using ref
      if (verificationStartedRef.current) {
        console.log('Verification already started, skipping duplicate call');
        return;
      }
      
      // Verify the session with Stripe (only when user is authenticated)
      console.log('Starting session verification...');
      verificationStartedRef.current = true;
      
      // Call verifySession directly
      verifySession(sessionId);
    } else if (!sessionId) {
      console.log('No session ID found');
      setLoading(false);
    } else if (sessionId && !user) {
      console.log('Session ID found but no user - waiting for authentication...');
      // If we have a session ID but no user, wait a bit for auth to load
      const timeout = setTimeout(() => {
        if (!user) {
          console.error('User authentication timeout - cannot verify session');
          setLoading(false);
          // setSuccess(false);
        }
      }, 10000); // 10 second timeout to give more time for authentication
      
      return () => clearTimeout(timeout);
    }
    
    // Cleanup function to reset verification flag
    return () => {
      verificationStartedRef.current = false;
    };
  }, [searchParams, user, verifySession]);

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 lg:p-12 xl:p-16">
        <div className="max-w-7xl mx-auto h-full flex min-h-0">
          <div className="w-full h-full min-h-0 overflow-hidden">
            <LoadingCard type="success" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 lg:p-12 xl:p-16">
      <div className="max-w-7xl mx-auto h-full flex min-h-0">
        <div className="w-full h-full min-h-0 overflow-hidden">
          <LoadingCard type="success" />
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 lg:p-12 xl:p-16">
        <div className="max-w-7xl mx-auto h-full flex min-h-0">
          <div className="w-full h-full min-h-0 overflow-hidden">
            <LoadingCard type="success" />
          </div>
        </div>
      </div>
    }>
      <SubscriptionSuccessContent />
    </Suspense>
  );
}
