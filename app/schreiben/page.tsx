"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, PenTool, CheckCircle, Target, MessageSquare } from "lucide-react";
import TranslatedText from "@/components/TranslatedText";
import LoadingCard from "@/components/shared/LoadingCard";
import { useAuth } from "@/contexts/AuthContext";

export default function SchreibenPage() {
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            <TranslatedText 
              translationKey="schreiben.main_title" 
              fallback="Goethe B1 Schreiben Test"
            />
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            <TranslatedText 
              translationKey="schreiben.main_description" 
              fallback="Üben Sie Ihre deutschen Schreibfähigkeiten mit authentischen B1-Aufgaben. Erhalten Sie sofortiges AI-Feedback zu Grammatik, Wortschatz und Struktur."
            />
          </p>
        </div>

        {/* Test Options */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Teil 1 Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                <PenTool className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                <TranslatedText 
                  translationKey="schreiben.teil1_title" 
                  fallback="Schreiben Teil 1"
                />
              </h2>
              <p className="text-gray-600 mb-6">
                <TranslatedText 
                  translationKey="schreiben.teil1_description" 
                  fallback="Schreiben Sie einen Text über ein vorgegebenes Thema. Mindestens 80 Wörter mit klarer Struktur und Argumentation."
                />
              </p>
              
              {/* Features */}
              <div className="space-y-3 mb-8 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    <TranslatedText 
                      translationKey="schreiben.teil1_feature1" 
                      fallback="Mindestens 80 Wörter"
                    />
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    <TranslatedText 
                      translationKey="schreiben.teil1_feature2" 
                      fallback="Grammatik- und Wortschatz-Feedback"
                    />
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    <TranslatedText 
                      translationKey="schreiben.teil1_feature3" 
                      fallback="Korrigierte Version mit Erklärungen"
                    />
                  </span>
                </div>
              </div>

              <Link
                href="/schreiben/teil1"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                <FileText className="w-5 h-5" />
                <TranslatedText 
                  translationKey="schreiben.start_teil1" 
                  fallback="Teil 1 starten"
                />
              </Link>
            </div>
          </div>

          {/* Teil 2 Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-green-100 hover:shadow-xl transition-all duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                <TranslatedText 
                  translationKey="schreiben.teil2_title" 
                  fallback="Schreiben Teil 2"
                />
              </h2>
              <p className="text-gray-600 mb-6">
                <TranslatedText 
                  translationKey="schreiben.teil2_description" 
                  fallback="Schreiben Sie einen ausführlicheren Text über ein Thema. Mindestens 80 Wörter mit detaillierter Argumentation und Beispielen."
                />
              </p>
              
              {/* Features */}
              <div className="space-y-3 mb-8 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    <TranslatedText 
                      translationKey="schreiben.teil2_feature1" 
                      fallback="Mindestens 80 Wörter"
                    />
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    <TranslatedText 
                      translationKey="schreiben.teil2_feature2" 
                      fallback="Detaillierte Struktur-Bewertung"
                    />
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    <TranslatedText 
                      translationKey="schreiben.teil2_feature3" 
                      fallback="Verbesserungsvorschläge für Ausdruck"
                    />
                  </span>
                </div>
              </div>

              <Link
                href="/schreiben/teil2"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                <FileText className="w-5 h-5" />
                <TranslatedText 
                  translationKey="schreiben.start_teil2" 
                  fallback="Teil 2 starten"
                />
              </Link>
            </div>
          </div>

          {/* Teil 3 Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                <TranslatedText 
                  translationKey="schreiben.teil3_title" 
                  fallback="Schreiben Teil 3"
                />
              </h2>
              <p className="text-gray-600 mb-6">
                <TranslatedText 
                  translationKey="schreiben.teil3_description" 
                  fallback="Pilih topik dan tulis teks terstruktur. Minimal 40 kata dengan argumen yang jelas dan dukungan contoh."
                />
              </p>
              <div className="space-y-3 mb-8 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    <TranslatedText 
                      translationKey="schreiben.teil3_feature1" 
                      fallback="Minimal 40 kata"
                    />
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    <TranslatedText 
                      translationKey="schreiben.teil3_feature2" 
                      fallback="Argumen terstruktur"
                    />
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    <TranslatedText 
                      translationKey="schreiben.teil3_feature3" 
                      fallback="Kohärensi dan kohesi"
                    />
                  </span>
                </div>
              </div>

              <Link
                href="/schreiben/teil3"
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                <FileText className="w-5 h-5" />
                <TranslatedText 
                  translationKey="schreiben.start_teil3" 
                  fallback="Mulai Teil 3"
                />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

