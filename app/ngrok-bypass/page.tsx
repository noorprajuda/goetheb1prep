"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function NgrokBypassPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // This page is specifically designed to bypass the ngrok warning
    // It will automatically click through the warning and redirect to the actual success page
    
    const handleNgrokWarning = () => {
      // Look for the "Visit Site" button on the ngrok warning page
      const visitSiteButton = document.querySelector('a[href*="ngrok"]') as HTMLAnchorElement;
      
      if (visitSiteButton) {
        console.log('Ngrok warning detected - auto-clicking through...');
        // Click the button to bypass the warning
        visitSiteButton.click();
        return true;
      }
      
      // Also look for any link that might be the "Visit Site" button
      const allLinks = document.querySelectorAll('a');
      for (const link of allLinks) {
        const href = link.getAttribute('href');
        if (href && href.includes('ngrok') && !href.includes('ngrok-free.app')) {
          console.log('Found ngrok bypass link - clicking...');
          link.click();
          return true;
        }
      }
      
      return false;
    };

    // Check immediately
    if (handleNgrokWarning()) {
      return;
    }

    // If not found immediately, check periodically
    const interval = setInterval(() => {
      if (handleNgrokWarning()) {
        clearInterval(interval);
      }
    }, 100);

    // Stop checking after 3 seconds
    setTimeout(() => {
      clearInterval(interval);
      
      // If we still haven't found the ngrok warning, redirect to success page
      const sessionId = searchParams.get('session_id');
      if (sessionId) {
        console.log('No ngrok warning found - redirecting to success page');
        router.push(`/subscription/success?session_id=${sessionId}`);
      } else {
        router.push('/subscription');
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Processing payment...</p>
        <p className="mt-2 text-sm text-gray-500">Please wait while we complete your subscription.</p>
      </div>
    </div>
  );
}
