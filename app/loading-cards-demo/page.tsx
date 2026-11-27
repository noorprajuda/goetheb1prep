'use client';

import { useState } from 'react';
import Lottie from 'lottie-react';
import Image from 'next/image';
import TranslatedText from '@/components/TranslatedText';

// Import animations
import owlReadingAnimation from '@/public/images/loading/owl-reading.json';

export default function LoadingCardsDemo() {
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const loadingCards = [
    {
      id: 'results-loading',
      title: 'Results Page Loading',
      description: 'Loading test results...',
      component: (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 2xl:p-12">
          <div className="max-w-xs xs:max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl 3xl:max-w-8xl mx-auto">
            <div className="shadow-xl bg-white/90 backdrop-blur-sm rounded-lg p-12 text-center">
              <div className="flex items-center justify-center mx-auto mb-6">
                <Lottie 
                  animationData={owlReadingAnimation}
                  loop={true}
                  autoplay={true}
                  style={{ width: 200, height: 200 }}
                />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4">
                <TranslatedText 
                  translationKey="results.loading_data" 
                  fallback="Loading test results..."
                />
              </h3>
              <p className="text-slate-600 mb-6">
                <TranslatedText 
                  translationKey="results.loading_subtitle" 
                  fallback="Please wait while we fetch your test history..."
                />
              </p>
              <div className="space-y-2 text-left max-w-md mx-auto">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-700">
                    <TranslatedText 
                      translationKey="results.loading_features" 
                      fallback="Loading available features"
                    />
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-700">
                    <TranslatedText 
                      translationKey="results.loading_analytics" 
                      fallback="Preparing analytics dashboard"
                    />
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-700">
                    <TranslatedText 
                      translationKey="results.loading_history" 
                      fallback="Loading test history"
                    />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'subscription-loading',
      title: 'Subscription Loading',
      description: 'Loading subscription status...',
      component: (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="shadow-xl bg-white/90 backdrop-blur-sm rounded-lg p-12 text-center">
              <div className="flex items-center justify-center mx-auto mb-6">
                <Lottie 
                  animationData={owlReadingAnimation}
                  loop={true}
                  autoplay={true}
                  style={{ width: 320, height: 320 }}
                />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-4">
                <TranslatedText 
                  translationKey="subscription.loading_status" 
                  fallback="Loading subscription status..."
                />
              </h3>
              <p className="text-slate-600 mb-6">
                <TranslatedText 
                  translationKey="subscription.loading_subtitle" 
                  fallback="Please wait while we fetch your subscription details..."
                />
              </p>
              <div className="space-y-2 text-left max-w-md mx-auto">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-700">
                    <TranslatedText 
                      translationKey="subscription.loading_features" 
                      fallback="Loading subscription features"
                    />
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-700">
                    <TranslatedText 
                      translationKey="subscription.loading_plans" 
                      fallback="Loading available plans"
                    />
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-700">
                    <TranslatedText 
                      translationKey="subscription.loading_payment" 
                      fallback="Preparing payment options"
                    />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'speaking-subscription-loading',
      title: 'Speaking Page Subscription Loading',
      description: 'Checking subscription access...',
      component: (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-responsive">
          <div className="container-responsive mx-auto">
            <div className="shadow-xl bg-white/90 backdrop-blur-sm rounded-lg p-12 text-center">
              <div className="w-32 h-32 mx-auto mb-6">
                <Image 
                  src="/images/loading/owl-loading.svg" 
                  alt="Loading owl" 
                  className="w-full h-full"
                  width={128}
                  height={128}
                />
              </div>
              <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-slate-900 mb-4">
                <TranslatedText 
                  translationKey="speaking.checking_subscription" 
                  fallback="Checking subscription access..."
                />
              </h3>
              <p className="text-xs sm:text-sm lg:text-base text-slate-600 mb-6">
                <TranslatedText 
                  translationKey="speaking.subscription_loading_subtitle" 
                  fallback="Please wait while we verify your access..."
                />
              </p>
              <div className="space-y-2 text-left max-w-md mx-auto">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-xs sm:text-sm lg:text-base text-slate-700">
                    <TranslatedText 
                      translationKey="speaking.loading_features" 
                      fallback="Loading available features"
                    />
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs sm:text-sm lg:text-base text-slate-700">
                    <TranslatedText 
                      translationKey="speaking.loading_topics" 
                      fallback="Loading speaking topics"
                    />
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-xs sm:text-sm lg:text-base text-slate-700">
                    <TranslatedText 
                      translationKey="speaking.loading_analysis" 
                      fallback="Preparing AI analysis tools"
                    />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'teil3-audio-loading',
      title: 'Teil 3 Audio System Loading',
      description: 'Memuat sistem audio...',
      component: (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
          <div className="container-responsive mx-auto">
            <div className="shadow-xl bg-white/90 backdrop-blur-sm rounded-lg p-12 text-center">
              <div className="w-32 h-32 mx-auto mb-6">
                <Image 
                  src="/images/loading/owl-loading.svg" 
                  alt="Loading owl" 
                  className="w-full h-full"
                  width={128}
                  height={128}
                />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-4">
                <TranslatedText 
                  translationKey="teil3.audio_loading" 
                  fallback="Memuat sistem audio..."
                />
              </h3>
              <p className="text-slate-600 mb-6">
                <TranslatedText 
                  translationKey="teil3.audio_loading_subtitle" 
                  fallback="Harap tunggu sebentar..."
                />
              </p>
              <div className="space-y-2 text-left max-w-md mx-auto">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-700">
                    <TranslatedText 
                      translationKey="teil3.audio_loading_features" 
                      fallback="Loading audio features"
                    />
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-700">
                    <TranslatedText 
                      translationKey="teil3.audio_loading_system" 
                      fallback="Initializing audio system"
                    />
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-700">
                    <TranslatedText 
                      translationKey="teil3.audio_loading_ready" 
                      fallback="Preparing recording tools"
                    />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'teil3-presentation-loading',
      title: 'Teil 3 Presentation Loading',
      description: 'Memuat presentasi...',
      component: (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
          <div className="container-responsive mx-auto">
            <div className="shadow-xl bg-white/90 backdrop-blur-sm rounded-lg p-12 text-center">
              <div className="w-32 h-32 mx-auto mb-6">
                <Image 
                  src="/images/loading/owl-loading.svg" 
                  alt="Loading owl" 
                  className="w-full h-full"
                  width={128}
                  height={128}
                />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-4">
                <TranslatedText 
                  translationKey="teil3.presentation_loading" 
                  fallback="Memuat presentasi..."
                />
              </h3>
              <p className="text-slate-600 mb-6">
                <TranslatedText 
                  translationKey="teil3.presentation_loading_subtitle" 
                  fallback="Harap tunggu, partner AI sedang menyiapkan presentasi..."
                />
              </p>
              <div className="space-y-2 text-left max-w-md mx-auto">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-700">
                    <TranslatedText 
                      translationKey="teil3.presentation_loading_ai" 
                      fallback="AI partner is preparing presentation"
                    />
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-700">
                    <TranslatedText 
                      translationKey="teil3.presentation_loading_content" 
                      fallback="Generating presentation content"
                    />
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-700">
                    <TranslatedText 
                      translationKey="teil3.presentation_loading_ready" 
                      fallback="Preparing for recording"
                    />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'speaking-processing',
      title: 'Speaking Test Processing',
      description: 'Menganalisis performa...',
      component: (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-responsive">
          <div className="container-responsive mx-auto">
            <div className="shadow-xl bg-white/90 backdrop-blur-sm rounded-lg p-12 text-center">
              <div className="w-32 h-32 mx-auto mb-6">
                <Image 
                  src="/images/loading/owl-loading.svg" 
                  alt="Loading owl" 
                  className="w-full h-full"
                  width={128}
                  height={128}
                />
              </div>
              <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-slate-900 mb-4">
                <TranslatedText 
                  translationKey="speaking.analyzing_performance" 
                  fallback="Menganalisis performa..."
                />
              </h3>
              <p className="text-xs sm:text-sm lg:text-base text-slate-600 mb-6">
                <TranslatedText 
                  translationKey="speaking.analyzing_subtitle" 
                  fallback="Harap tunggu sementara kami menganalisis performa Anda..."
                />
              </p>
              <div className="space-y-2 text-left max-w-md mx-auto">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-xs sm:text-sm lg:text-base text-slate-700">
                    <TranslatedText 
                      translationKey="speaking.analyzing_audio" 
                      fallback="Analyzing audio quality"
                    />
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs sm:text-sm lg:text-base text-slate-700">
                    <TranslatedText 
                      translationKey="speaking.analyzing_grammar" 
                      fallback="Checking grammar and vocabulary"
                    />
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-xs sm:text-sm lg:text-base text-slate-700">
                    <TranslatedText 
                      translationKey="speaking.analyzing_fluency" 
                      fallback="Evaluating fluency and pronunciation"
                    />
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-xs sm:text-sm lg:text-base text-slate-700">
                    <TranslatedText 
                      translationKey="speaking.analyzing_feedback" 
                      fallback="Generating personalized feedback"
                    />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Loading Cards Investigation
          </h1>
          <p className="text-lg text-gray-600">
            All loading cards used throughout the application
          </p>
        </div>

        {/* Loading Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {loadingCards.map((card) => (
            <div
              key={card.id}
              className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => setActiveCard(activeCard === card.id ? null : card.id)}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {card.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {card.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Click to {activeCard === card.id ? 'hide' : 'preview'}
                  </span>
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Active Card Preview */}
        {activeCard && (
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {loadingCards.find(card => card.id === activeCard)?.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {loadingCards.find(card => card.id === activeCard)?.description}
              </p>
            </div>
            <div className="relative">
              {loadingCards.find(card => card.id === activeCard)?.component}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="mt-8 bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Loading Cards Summary
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Card Types:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Results page loading</li>
                <li>• Subscription status loading</li>
                <li>• Speaking test subscription loading</li>
                <li>• Teil 3 audio system loading</li>
                <li>• Teil 3 presentation loading</li>
                <li>• Speaking test processing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Common Features:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Owl loading animation (SVG or Lottie)</li>
                <li>• Responsive font sizes</li>
                <li>• Progress indicators with dots</li>
                <li>• Backdrop blur effects</li>
                <li>• Consistent styling</li>
                <li>• Internationalization support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
