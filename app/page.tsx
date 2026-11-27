'use client';

import Link from "next/link";
import { Target, Trophy, Star, Mic } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import TranslatedText from "@/components/TranslatedText";

export default function Home() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-8 lg:p-12 xl:p-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            <TranslatedText 
              translationKey="main.master_speaking_skills" 
              fallback="Master German B1 Speaking Skills with AI-Powered Practice"
            />
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            <TranslatedText 
              translationKey="main.practice_description" 
              fallback="Practice with authentic Goethe B1 speaking tasks, get instant AI-powered feedback on pronunciation and fluency, and build confidence for your Goethe Zertifikat B1 exam. Free trial available!"
            />
          </p>
          
          
          <div className="flex justify-center">
            <Link 
              href={user ? "/speaking" : "/login"}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors flex items-center gap-2"
            >
              <Mic className="w-5 h-5" />
              <TranslatedText 
                translationKey="main.start_sprechen_test" 
                fallback="Start Sprechen Test"
              />
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 mt-16">
          {/* Authentic Tasks Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-blue-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                <TranslatedText 
                  translationKey="main.authentic_tasks" 
                  fallback="Authentic Tasks"
                />
              </h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              <TranslatedText 
                translationKey="main.authentic_tasks_desc" 
                fallback="Practice with real B1 speaking scenarios and tasks"
              />
            </p>
            <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              <TranslatedText 
                translationKey="main.parts_label" 
                fallback="Part 1, 2, & 3"
              />
            </span>
          </div>

          {/* AI Feedback Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-blue-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                <TranslatedText 
                  translationKey="main.ai_feedback" 
                  fallback="AI Feedback"
                />
              </h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              <TranslatedText 
                translationKey="main.ai_feedback_desc" 
                fallback="Get instant, detailed feedback on your speaking performance"
              />
            </p>
            <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              <TranslatedText 
                translationKey="main.smart_analysis" 
                fallback="AI Integration"
              />
            </span>
          </div>

          {/* Track Progress Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-blue-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                <TranslatedText 
                  translationKey="main.track_progress" 
                  fallback="Track Progress"
                />
              </h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              <TranslatedText 
                translationKey="main.track_progress_desc" 
                fallback="Monitor your improvement with detailed analytics and scores"
              />
            </p>
            <span className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
              <TranslatedText 
                translationKey="main.performance_data" 
                fallback="Test History"
              />
            </span>
          </div>
        </div>

        {/* SEO-optimized content section */}
        <div className="mt-20 mb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
              <TranslatedText 
                translationKey="main.why_choose_title" 
                fallback="Why Choose Goethe B1 Prep for Your German Speaking Practice?"
              />
            </h2>
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  <TranslatedText 
                    translationKey="main.learning_buddy_title" 
                    fallback="🎯 Your Always-Available Learning Companion"
                  />
                </h3>
                <p className="text-gray-600">
                  <TranslatedText 
                    translationKey="main.learning_buddy_desc" 
                    fallback="After studying B1 theory, it's time to practice and implement your knowledge. Unfortunately, it's challenging to find good partners to correct your grammar and natural expressions like native speakers. Your teacher might provide feedback, but they need time, or perhaps you don't have time to jot down what your teacher corrects. Goethe B1 Prep comes as a solution as your learning buddy - you can easily copy your original speech, the corrections provided, even model answers that native speakers would say. Give it a try!"
                  />
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  <TranslatedText 
                    translationKey="main.instant_feedback_title" 
                    fallback="⚡ Instant & Copyable Feedback"
                  />
                </h3>
                <p className="text-gray-600">
                  <TranslatedText 
                    translationKey="main.instant_feedback_desc" 
                    fallback="Get instant corrections for grammar, vocabulary, and natural expressions. Every improvement suggestion can be directly copied and saved for your learning reference. No need to wait or manually note down - everything is automatically saved."
                  />
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  <TranslatedText 
                    translationKey="main.native_quality_title" 
                    fallback="🗣️ Native Speaker Quality"
                  />
                </h3>
                <p className="text-gray-600">
                  <TranslatedText 
                    translationKey="main.native_quality_desc" 
                    fallback="Learn expressions and phrases that are actually used by native German speakers. Get model answer examples that are natural and meet Goethe B1 standards, complete with context explanations for their usage."
                  />
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  <TranslatedText 
                    translationKey="main.available_247_title" 
                    fallback="🕐 Available 24/7, Whenever You Need It"
                  />
                </h3>
                <p className="text-gray-600">
                  <TranslatedText 
                    translationKey="main.available_247_desc" 
                    fallback="Practice anytime without time constraints. No need to wait for teacher schedules or find practice partners. Goethe B1 Prep is always ready to help you improve your German speaking skills."
                  />
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action for Non-logged-in Users */}
        {!user && (
          <div className="text-center mt-16">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-blue-100 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                <TranslatedText 
                  translationKey="main.ready_to_start" 
                  fallback="Ready to Master German B1 Speaking?"
                />
              </h2>
              <p className="text-gray-600 mb-6">
                <TranslatedText 
                  translationKey="main.signup_encouragement" 
                  fallback="Join thousands of students preparing for their Goethe B1 exam with our AI-powered speaking practice platform. Start your free trial today!"
                />
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/login"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <TranslatedText 
                    translationKey="main.get_started" 
                    fallback="Start Free Trial"
                  />
                </Link>
                <Link 
                  href="/subscription"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <TranslatedText 
                    translationKey="main.view_pricing" 
                    fallback="View Pricing Plans"
                  />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
