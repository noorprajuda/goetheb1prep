"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Clock, Target, CheckCircle } from "lucide-react";
import TranslatedText from "@/components/TranslatedText";
import LoadingCard from "@/components/shared/LoadingCard";
import { useAuth } from "@/contexts/AuthContext";

export default function LesenPage() {
  const { user } = useAuth();
  const [hasSubscriptionAccess, setHasSubscriptionAccess] = useState<boolean | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);

  // Check subscription access - only run once per user change
  useEffect(() => {
    if (!user || subscriptionChecked) return; // Exit early if no user or already checked
    
    const checkSubscriptionAccess = async () => {
      try {
        const response = await fetch('/api/subscription/status', {
          headers: {
            'x-user-id': user.id,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setHasSubscriptionAccess(data.hasAccess);
        }
      } catch (error) {
        console.error('Error checking subscription access:', error);
        setHasSubscriptionAccess(false);
      } finally {
        setSubscriptionLoading(false);
        setSubscriptionChecked(true);
      }
    };

    checkSubscriptionAccess();
  }, [user?.id, subscriptionChecked, user]); // Include all dependencies

  // Show loading while checking subscription
  if (subscriptionLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 lg:p-12 xl:p-16">
        <div className="max-w-7xl mx-auto h-full flex min-h-0">
          <div className="w-full h-full min-h-0 overflow-hidden">
            <LoadingCard type="subscription" />
          </div>
        </div>
      </div>
    );
  }

  // Show subscription gate if user doesn't have access
  if (user && hasSubscriptionAccess === false) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 lg:p-12 xl:p-16">
        <div className="max-w-7xl mx-auto h-full flex min-h-0">
          <div className="w-full h-full min-h-0 overflow-hidden">
            <LoadingCard type="access_denied" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            <TranslatedText 
              translationKey="lesen.main_title" 
              fallback="Goethe B1 Lesen Test"
            />
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            <TranslatedText 
              translationKey="lesen.main_description" 
              fallback="Berlatih keterampilan membaca bahasa Jerman Anda dengan tes B1 otentik. Dapatkan skor instan dan penjelasan detail untuk setiap jawaban."
            />
          </p>
        </div>

        {/* Test Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Model Test 1 Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                <TranslatedText 
                  translationKey="lesen.model_test_1_title" 
                  fallback="Model Test 1"
                />
              </h2>
              <p className="text-gray-600 mb-6">
                <TranslatedText 
                  translationKey="lesen.model_test_1_description" 
                  fallback="Tes membaca lengkap dengan 3 bagian: Teil 1 (10 menit), Teil 3 (20 menit), dan Teil 5 (10 menit). Total 12 soal pilihan ganda."
                />
              </p>
              
              {/* Features */}
              <div className="space-y-3 mb-8 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    <TranslatedText 
                      translationKey="lesen.model_test_1_feature1" 
                      fallback="3 bagian tes (Teil 1, 3, 5)"
                    />
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    <TranslatedText 
                      translationKey="lesen.model_test_1_feature2" 
                      fallback="Total 40 menit"
                    />
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    <TranslatedText 
                      translationKey="lesen.model_test_1_feature3" 
                      fallback="12 soal pilihan ganda"
                    />
                  </span>
                </div>
              </div>

              <Link 
                href="/lesen/model-test-1"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                <TranslatedText 
                  translationKey="lesen.start_model_test_1" 
                  fallback="Mulai Model Test 1"
                />
              </Link>
            </div>
          </div>

          {/* Model Test 2 Card - Placeholder for future */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 opacity-60">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                <TranslatedText 
                  translationKey="lesen.model_test_2_title" 
                  fallback="Model Test 2"
                />
              </h2>
              <p className="text-gray-600 mb-6">
                <TranslatedText 
                  translationKey="lesen.model_test_2_description" 
                  fallback="Segera hadir - Model test tambahan untuk latihan lebih lanjut."
                />
              </p>
              
              <div className="inline-flex items-center justify-center px-6 py-3 bg-gray-400 text-white font-semibold rounded-lg cursor-not-allowed">
                <TranslatedText 
                  translationKey="lesen.coming_soon" 
                  fallback="Segera Hadir"
                />
              </div>
            </div>
          </div>

          {/* Model Test 3 Card - Placeholder for future */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 opacity-60">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                <TranslatedText 
                  translationKey="lesen.model_test_3_title" 
                  fallback="Model Test 3"
                />
              </h2>
              <p className="text-gray-600 mb-6">
                <TranslatedText 
                  translationKey="lesen.model_test_3_description" 
                  fallback="Segera hadir - Model test tambahan untuk latihan lebih lanjut."
                />
              </p>
              
              <div className="inline-flex items-center justify-center px-6 py-3 bg-gray-400 text-white font-semibold rounded-lg cursor-not-allowed">
                <TranslatedText 
                  translationKey="lesen.coming_soon" 
                  fallback="Segera Hadir"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
