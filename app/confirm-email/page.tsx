'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import TranslatedText from '@/components/TranslatedText';
import Link from 'next/link';
import Image from 'next/image';

function ConfirmEmailContent() {
  const [isClient, setIsClient] = useState(false);
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  // const router = useRouter();
  const searchParams = useSearchParams();
  const { i18n } = useTranslation();

  useEffect(() => {
    setIsClient(true);
    // Get email from URL parameters
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleResendConfirmation = async () => {
    if (!email) return;
    
    setIsResending(true);
    setResendMessage('');
    
    try {
      const response = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendMessage('Confirmation email sent successfully!');
      } else {
        setResendMessage(data.error || 'Failed to send confirmation email');
      }
    } catch {
      setResendMessage('An error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

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
          <TranslatedText 
            translationKey="confirm.check_your_email" 
            fallback="Check Your Email"
          />
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          <TranslatedText 
            translationKey="confirm.verification_sent" 
            fallback="We've sent a verification link to your email address"
          />
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {/* Email Icon */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <h3 className="mt-4 text-lg font-medium text-gray-900">
              <TranslatedText 
                translationKey="confirm.verify_email" 
                fallback="Verify Your Email Address"
              />
            </h3>
            
            <p className="mt-2 text-sm text-gray-600">
              <TranslatedText 
                translationKey="confirm.check_inbox" 
                fallback="Please check your email inbox and click the verification link to activate your account."
              />
            </p>

            {email && (
              <p className="mt-2 text-sm font-medium text-gray-900">
                <TranslatedText 
                  translationKey="confirm.sent_to" 
                  fallback="Email sent to:"
                /> {email}
              </p>
            )}

            <div className="mt-6">
              <button
                onClick={handleResendConfirmation}
                disabled={isResending || !email}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  <TranslatedText 
                    translationKey="confirm.sending" 
                    fallback="Sending..."
                  />
                ) : (
                  <TranslatedText 
                    translationKey="confirm.resend_email" 
                    fallback="Resend Verification Email"
                  />
                )}
              </button>
            </div>

            {resendMessage && (
              <div className={`mt-4 text-sm text-center ${
                resendMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'
              }`}>
                {resendMessage}
              </div>
            )}

            <div className="mt-6">
              <p className="text-sm text-gray-600">
                <TranslatedText 
                  translationKey="confirm.already_verified" 
                  fallback="Already verified your email?"
                />{' '}
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  <TranslatedText 
                    translationKey="confirm.sign_in" 
                    fallback="Sign in"
                  />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Language Toggle - Below Confirmation Card */}
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

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmEmailContent />
    </Suspense>
  );
}
