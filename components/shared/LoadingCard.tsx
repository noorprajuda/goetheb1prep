"use client";

import React from 'react';
import Link from 'next/link';
import TranslatedText from '@/components/TranslatedText';
import Lottie from "lottie-react";
import owlReadingAnimation from "@/public/images/loading/owl-reading.json";
import { Lock, CheckCircle } from 'lucide-react';

interface LoadingCardProps {
  type: 'subscription' | 'processing' | 'audio' | 'access_denied' | 'payment' | 'success';
  fullScreen?: boolean;
}

const LoadingCard: React.FC<LoadingCardProps> = ({ type, fullScreen = false }) => {
  const isSubscription = type === 'subscription';
  const isAudio = type === 'audio';
  const isAccessDenied = type === 'access_denied';
  const isPayment = type === 'payment';
  const isSuccess = type === 'success';
  
  return (
    <div className={`bg-white ${fullScreen ? 'rounded-none shadow-none border-0' : 'rounded-lg shadow-sm border'} p-6 h-full w-full overflow-hidden`}>
      <div className="text-center h-full flex flex-col justify-center items-center min-h-0">
        <div className="flex items-center justify-center mx-auto mb-6">
          {isAccessDenied ? (
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
          ) : isSuccess ? (
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          ) : (
            <Lottie
              animationData={owlReadingAnimation}
              loop={true}
              autoplay={true}
              className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-32 xl:h-32 2xl:w-40 2xl:h-40"
            />
          )}
        </div>
        <h3 className="text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-semibold text-gray-900 mb-3">
          <TranslatedText 
            translationKey={
              isSubscription
                ? "speaking.checking_subscription"
                : isAudio
                  ? "teil3.audio_loading"
                  : isAccessDenied
                    ? "subscription.access_required"
                    : isPayment
                      ? "subscription.processing_payment"
                      : isSuccess
                        ? "subscription.success_title"
                        : "analysis.analyzing_text"
            }
            fallback={
              isSubscription
                ? "Checking subscription access..."
                : isAudio
                  ? "Loading audio system..."
                  : isAccessDenied
                    ? "Subscription Access Required"
                    : isPayment
                      ? "Processing Payment..."
                      : isSuccess
                        ? "Subscription Successful!"
                        : "Analyzing Your Text"
            }
          />
        </h3>
        <p className="text-gray-600 mb-6 lg:text-lg xl:text-xl 2xl:text-2xl">
          <TranslatedText 
            translationKey={
              isSubscription
                ? "speaking.subscription_loading_subtitle"
                : isAudio
                  ? "teil3.audio_loading_subtitle"
                  : isAccessDenied
                    ? "subscription.access_message"
                    : isPayment
                      ? "subscription.payment_processing_subtitle"
                      : isSuccess
                        ? "subscription.success_subtitle"
                        : "analysis.ai_evaluating_text"
            }
            fallback={
              isSubscription
                ? "Please wait while we verify your access..."
                : isAudio
                  ? "Please wait a moment..."
                : isAccessDenied
                  ? "You need a subscription to access this feature. Please choose a plan that suits your needs."
                  : isPayment
                    ? "Please wait while we process your payment securely..."
                    : isSuccess
                      ? "Your subscription has been activated successfully. You now have full access to all features!"
                      : "Our AI is evaluating your writing based on B1 criteria..."
            }
          />
        </p>
        <div className="space-y-3 text-left max-w-md mx-auto">
          {isSuccess ? (
            // Success action buttons
            <>
              <div className="flex flex-col gap-3">
                <a
                  href="/speaking"
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors text-center"
                >
                  <TranslatedText 
                    translationKey="subscription.start_speaking" 
                    fallback="Start Speaking Test"
                  />
                </a>
                <a
                  href="/dashboard"
                  className="w-full text-green-600 hover:text-green-700 font-medium text-center"
                >
                  <TranslatedText 
                    translationKey="subscription.view_dashboard" 
                    fallback="View Dashboard"
                  />
                </a>
              </div>
            </>
          ) : isAccessDenied ? (
            // Access denied action buttons
            <>
              <div className="flex flex-col gap-3">
                <a
                  href="/subscription"
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
                >
                  <TranslatedText 
                    translationKey="subscription.view_plans" 
                    fallback="View Subscription Plans"
                  />
                </a>
                <Link
                  href="/"
                  className="w-full text-blue-600 hover:text-blue-700 font-medium text-center"
                >
                  <TranslatedText 
                    translationKey="common.back_to_home" 
                    fallback="Back to Home"
                  />
                </Link>
              </div>
            </>
          ) : isSubscription ? (
            // Subscription loading progress indicators
            <>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span className="text-sm lg:text-base xl:text-lg 2xl:text-xl text-gray-700">
                  <TranslatedText 
                    translationKey="speaking.verifying_account" 
                    fallback="Verifying account status"
                  />
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-100"></div>
                <span className="text-sm lg:text-base xl:text-lg 2xl:text-xl text-gray-700">
                  <TranslatedText 
                    translationKey="speaking.checking_permissions" 
                    fallback="Checking permissions"
                  />
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-200"></div>
                <span className="text-sm lg:text-base xl:text-lg 2xl:text-xl text-gray-700">
                  <TranslatedText 
                    translationKey="speaking.loading_features" 
                    fallback="Loading available features"
                  />
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-300"></div>
                <span className="text-sm lg:text-base xl:text-lg 2xl:text-xl text-gray-700">
                  <TranslatedText 
                    translationKey="speaking.preparing_interface" 
                    fallback="Preparing interface"
                  />
                </span>
              </div>
            </>
          ) : isPayment ? (
            // Payment processing progress indicators
            <>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span className="text-sm lg:text-base xl:text-lg 2xl:text-xl text-gray-700">
                  <TranslatedText 
                    translationKey="subscription.validating_payment"
                    fallback="Validating payment details"
                  />
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-100"></div>
                <span className="text-sm lg:text-base xl:text-lg 2xl:text-xl text-gray-700">
                  <TranslatedText 
                    translationKey="subscription.processing_transaction"
                    fallback="Processing transaction securely"
                  />
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-200"></div>
                <span className="text-sm lg:text-base xl:text-lg 2xl:text-xl text-gray-700">
                  <TranslatedText 
                    translationKey="subscription.updating_subscription"
                    fallback="Updating your subscription"
                  />
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-300"></div>
                <span className="text-sm lg:text-base xl:text-lg 2xl:text-xl text-gray-700">
                  <TranslatedText 
                    translationKey="subscription.finalizing_access"
                    fallback="Finalizing your access"
                  />
                </span>
              </div>
            </>
          ) : (
            // Non-subscription: audio-specific or processing progress indicators
            <>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm lg:text-base xl:text-lg 2xl:text-xl text-gray-700">
                  <TranslatedText 
                    translationKey={isAudio ? "teil3.initializing_audio" : "analysis.reading_text"}
                    fallback={isAudio ? "Initializing audio" : "Reading your text"}
                  />
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-100"></div>
                <span className="text-xs sm:text-sm lg:text-base xl:text-lg 2xl:text-xl text-gray-700">
                  <TranslatedText 
                    translationKey={isAudio ? "teil3.requesting_microphone" : "analysis.analyzing_structure"}
                    fallback={isAudio ? "Requesting microphone permission" : "Analyzing structure and organization"}
                  />
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-200"></div>
                <span className="text-xs sm:text-sm lg:text-base xl:text-lg 2xl:text-xl text-gray-700">
                  <TranslatedText 
                    translationKey={isAudio ? "teil3.preparing_recorder" : "analysis.evaluating_content"}
                    fallback={isAudio ? "Preparing recorder" : "Evaluating content and relevance"}
                  />
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-300"></div>
                <span className="text-xs sm:text-sm lg:text-base xl:text-lg 2xl:text-xl text-gray-700">
                  <TranslatedText 
                    translationKey={isAudio ? "teil3.preparing_interface" : "analysis.generating_feedback"}
                    fallback={isAudio ? "Preparing interface" : "Generating personalized feedback"}
                  />
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingCard;
