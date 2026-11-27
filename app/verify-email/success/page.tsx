'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import TranslatedText from '@/components/TranslatedText';
import Link from 'next/link';
import Image from 'next/image';

export default function VerifyEmailSuccessPage() {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { i18n } = useTranslation();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleGoToLogin = () => {
    router.push('/login?message=Email verified successfully! Please log in.');
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
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
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              <TranslatedText 
                translationKey="verify_success.email_verified" 
                fallback="Email Verified Successfully!"
              />
            </h2>
            
            <p className="text-sm text-gray-600 mb-6">
              <TranslatedText 
                translationKey="verify_success.verification_complete" 
                fallback="Your email has been successfully verified. You can now access all features of Goethe B1 Prep."
              />
            </p>

            <div className="space-y-3">
              <button
                onClick={handleGoToLogin}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <TranslatedText 
                  translationKey="verify_success.go_to_login" 
                  fallback="Go to Login"
                />
              </button>

              <button
                onClick={handleGoToDashboard}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <TranslatedText 
                  translationKey="verify_success.go_to_dashboard" 
                  fallback="Go to Dashboard"
                />
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                <TranslatedText 
                  translationKey="verify_success.need_help" 
                  fallback="Need help?"
                />{' '}
                <Link href="/contact" className="font-medium text-blue-600 hover:text-blue-500">
                  <TranslatedText 
                    translationKey="verify_success.contact_support" 
                    fallback="Contact Support"
                  />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Language Toggle - Below Success Card */}
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
