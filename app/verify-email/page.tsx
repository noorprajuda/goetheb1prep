'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import TranslatedText from '@/components/TranslatedText';
import Link from 'next/link';
import Image from 'next/image';

function VerifyEmailContent() {
  const [isClient, setIsClient] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { i18n } = useTranslation();

  const verifyEmail = useCallback(async (token: string) => {
    // Prevent multiple simultaneous requests
    if (isProcessing) {
      console.log('🔍 Verification already in progress, skipping...');
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await fetch(`/api/auth/verify-email?token=${token}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Verification successful:', data.message);
        // Small delay to prevent race conditions
        setTimeout(() => {
          router.push('/email-verification-success');
        }, 100);
      } else {
        console.log('❌ Verification failed:', data.error);
        // Redirect to error page or show error
        router.push('/verify-email?error=invalid_token');
      }
    } catch (error) {
      console.error('Verification error:', error);
      // Redirect to error page
      router.push('/verify-email?error=verification_failed');
    } finally {
      setIsProcessing(false);
    }
  }, [router, isProcessing]);

  useEffect(() => {
    setIsClient(true);
    
    // Check if there's an error parameter
    const error = searchParams.get('error');
    
    if (error) {
      // Show error state
      setIsVerifying(false);
      return;
    }
    
    // Get token from URL parameters
    const token = searchParams.get('token');
    
    if (!token) {
      // Redirect to error state
      router.push('/verify-email?error=invalid_link');
      return;
    }

    // Process verification
    verifyEmail(token);
  }, [searchParams, verifyEmail, router]);

  // No need for resend code function since we use link-based verification

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-3">
            <Image 
              className="h-12 w-12" 
              src="/favicon.ico" 
              alt="Goethe B1 Prep"
              width={48}
              height={48}
            />
            <div>
              <h1 className="text-xl font-bold text-blue-600">
                <TranslatedText 
                  translationKey="sidebar.goethe_b1_prep" 
                  fallback="Goethe B1 Prep"
                />
              </h1>
              <p className="text-sm text-gray-500">
                <TranslatedText 
                  translationKey="sidebar.speaking_test_simulator" 
                  fallback="Speaking Test Simulator"
                />
              </p>
            </div>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isVerifying ? (
            <TranslatedText 
              translationKey="verify.verifying_email" 
              fallback="Verifying your email..."
            />
          ) : (
            <span className="text-red-600">
              <TranslatedText 
                translationKey="verify.verification_failed" 
                fallback="Verification Failed"
              />
            </span>
          )}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {isVerifying ? (
              <>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                <p className="mt-6 text-sm text-gray-600">
                  <TranslatedText 
                    translationKey="verify.verifying_email" 
                    fallback="Verifying your email..."
                  />
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  <TranslatedText 
                    translationKey="verify.please_wait" 
                    fallback="This may take a few moments..."
                  />
                </p>
              </>
            ) : (
              <>
                <div className="rounded-full h-16 w-16 bg-red-100 mx-auto flex items-center justify-center">
                  <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-red-600">
                  <TranslatedText 
                    translationKey="verify.verification_failed" 
                    fallback="Verification Failed"
                  />
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  <TranslatedText 
                    translationKey="verify.verification_failed_help" 
                    fallback="Please check your email for a valid verification link or contact support if the problem persists."
                  />
                </p>
                <div className="mt-6 space-y-3">
                  <div className="flex justify-center space-x-4">
                    <Link 
                      href="/" 
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      <TranslatedText 
                        translationKey="verify.back_to_home" 
                        fallback="Back to Home"
                      />
                    </Link>
                    <Link 
                      href="/register" 
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      <TranslatedText 
                        translationKey="verify.try_register_again" 
                        fallback="Try Registering Again"
                      />
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Language Toggle - Below Verification Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center gap-3 bg-gray-50/80 backdrop-blur-sm rounded-lg px-4 py-2">
          {/* ID Label */}
          <span className={`text-xs font-semibold transition-colors duration-300 ${
            isClient && i18n.language === 'id' ? 'text-slate-900' : 'text-gray-400'
          }`}>
            ID
          </span>
          
          {/* Toggle Button */}
          <button
            onClick={() => i18n.changeLanguage(i18n.language === 'id' ? 'en' : 'id')}
            className="relative flex items-center bg-gray-200 rounded-full p-0.5 transition-all duration-300 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {/* Toggle Track */}
            <div className="relative w-12 h-4 bg-gray-200 rounded-full transition-colors duration-300">
              {/* Sliding Circle */}
              <div
                className={`absolute top-0 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out ${
                  isClient && i18n.language === 'en' ? 'translate-x-8' : 'translate-x-0'
                }`}
              />
            </div>
          </button>
          
          {/* EN Label */}
          <span className={`text-xs font-semibold transition-colors duration-300 ${
            isClient && i18n.language === 'en' ? 'text-slate-900' : 'text-gray-400'
          }`}>
            EN
          </span>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
