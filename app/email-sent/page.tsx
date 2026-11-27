'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import TranslatedText from '@/components/TranslatedText';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';

export default function EmailSentPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [isResending, setIsResending] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { i18n } = useTranslation();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Get email from URL params
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    setEmail(emailParam || '');
  }, []);

  const handleResendEmail = async () => {
    if (!email) return;
    
    setIsResending(true);
    try {
      const response = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        alert('✅ Confirmation email has been resent successfully! Please check your inbox.');
      } else {
        alert('❌ Failed to resend email. Please try again later or contact support at goetheb1preparation@gmail.com');
      }
    } catch {
      alert('❌ Failed to resend email. Please try again later or contact support at goetheb1preparation@gmail.com');
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-3">
            <Image 
              src="/favicon.ico" 
              alt="Goethe B1 Prep Logo" 
              className="h-12 w-auto" 
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
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Email Icon */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              <TranslatedText 
                translationKey="email_sent.title" 
                fallback="Check Your Email"
              />
            </h2>
            <p className="text-gray-600 text-sm">
              <TranslatedText 
                translationKey="email_sent.subtitle" 
                fallback="We've sent a confirmation email to:"
              />
            </p>
            <p className="text-blue-600 font-medium mt-1 break-all">
              {email || 'your-email@example.com'}
            </p>
          </div>

          {/* Main Message */}
          <div className="text-center mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800 text-sm font-medium mb-2">
                <TranslatedText 
                  translationKey="email_sent.instructions" 
                  fallback="Please check your email and click the verification link to activate your account. If you don't see the email, please check your spam folder."
                />
              </p>
            </div>
            <p className="text-gray-600 text-xs">
              <TranslatedText 
                translationKey="email_sent.need_help" 
                fallback="Need help? Contact our support team at goetheb1preparation@gmail.com"
              />
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  <TranslatedText 
                    translationKey="email_sent.sending" 
                    fallback="Sending..."
                  />
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  <TranslatedText 
                    translationKey="email_sent.resend_email" 
                    fallback="Resend Email"
                  />
                </>
              )}
            </button>

            <button
              onClick={handleBackToLogin}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <TranslatedText 
                translationKey="email_sent.back_to_login" 
                fallback="Back to Login"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Language Toggle - Below Email Sent Card */}
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

