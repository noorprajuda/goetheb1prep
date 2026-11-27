'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import TranslatedText from '@/components/TranslatedText';
import Link from 'next/link';
import Image from 'next/image';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailConsent, setEmailConsent] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { i18n } = useTranslation();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim()) {
      setError(i18n.language === 'id' 
        ? 'Nama depan diperlukan' 
        : 'First name is required');
      return;
    }

    // Auto-fill last name with first name if last name is empty
    const finalLastName = lastName.trim() || firstName.trim();

    if (password !== confirmPassword) {
      setError(i18n.language === 'id' 
        ? 'Kata sandi tidak cocok' 
        : 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError(i18n.language === 'id' 
        ? 'Kata sandi harus minimal 6 karakter' 
        : 'Password must be at least 6 characters long');
      return;
    }

    if (!emailConsent) {
      setError(i18n.language === 'id' 
        ? 'Silakan terima komunikasi email kami untuk melanjutkan' 
        : 'Please accept our email communications to continue');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          firstName: firstName || undefined,
          lastName: finalLastName || undefined,
          emailConsent
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Registration successful, redirect to email sent page
      router.push(`/email-sent?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (i18n.language === 'id' 
        ? 'Pendaftaran gagal. Silakan coba lagi.' 
        : 'Registration failed. Please try again.'));
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
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          <TranslatedText translationKey="register.create_account" fallback="Create Account" />
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          <TranslatedText 
            translationKey="register.join_platform" 
            fallback="Join our platform to start practicing German speaking skills"
          />
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                <TranslatedText translationKey="register.first_name" fallback="First Name" />
              </label>
              <div className="mt-1">
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                <TranslatedText translationKey="register.last_name" fallback="Last Name" />
              </label>
              <div className="mt-1">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                  />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                <TranslatedText translationKey="register.email_address" fallback="Email Address" />
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
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                <TranslatedText translationKey="register.password" fallback="Password" />
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                <TranslatedText translationKey="register.confirm_password" fallback="Confirm Password" />
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Email Consent Checkbox */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="emailConsent"
                  name="emailConsent"
                  type="checkbox"
                  checked={emailConsent}
                  onChange={(e) => setEmailConsent(e.target.checked)}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="emailConsent" className="text-gray-700">
                  <TranslatedText 
                    translationKey="register.email_consent" 
                    fallback="I agree to receive emails from Goethe B1 Prep including learning tips, updates, and promotional content. I can unsubscribe at any time."
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  <TranslatedText 
                    translationKey="register.privacy_policy_text" 
                    fallback="By checking this box, you agree to our"
                  />
                  {' '}
                  <Link 
                    href="/privacy-policy" 
                    target="_blank"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    <TranslatedText 
                      translationKey="privacy.title" 
                      fallback="Privacy Policy"
                    />
                  </Link>
                </p>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <TranslatedText translationKey="register.creating_account" fallback="Creating Account..." />
                ) : (
                  <TranslatedText translationKey="register.create_account" fallback="Create Account" />
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  <TranslatedText translationKey="register.already_have_account" fallback="Already have an account?" />
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/login"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <TranslatedText translationKey="register.sign_in" fallback="Sign In" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Language Toggle - Below Registration Card */}
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
