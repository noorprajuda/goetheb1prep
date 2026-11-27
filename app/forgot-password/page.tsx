'use client';

import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import TranslatedText from '@/components/TranslatedText';
import Link from 'next/link';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const [isClient, setIsClient] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  // const router = useRouter();
  const { i18n } = useTranslation();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password reset link sent to your email! Please check your inbox.');
        setEmail(''); // Clear the email field
      } else {
        setError(data.error || 'Failed to send password reset email');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
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
            translationKey="forgot.forgot_password" 
            fallback="Forgot Password"
          />
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          <TranslatedText 
            translationKey="forgot.enter_email_reset" 
            fallback="Enter your email address and we'll send you a link to reset your password"
          />
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                <TranslatedText 
                  translationKey="forgot.email_address" 
                  fallback="Email Address"
                />
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            {message && (
              <div className="text-green-600 text-sm text-center">
                {message}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <TranslatedText 
                    translationKey="forgot.sending" 
                    fallback="Sending..."
                  />
                ) : (
                  <TranslatedText 
                    translationKey="forgot.send_reset_link" 
                    fallback="Send Reset Link"
                  />
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                <TranslatedText 
                  translationKey="forgot.remember_password" 
                  fallback="Remember your password?"
                />{' '}
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  <TranslatedText 
                    translationKey="forgot.back_to_login" 
                    fallback="Back to Login"
                  />
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Language Toggle - Below Forgot Password Card */}
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
