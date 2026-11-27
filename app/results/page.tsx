"use client";
import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Calendar, Award, Eye, User, Bot, MessageSquare, Copy, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import TranslatedText from "@/components/TranslatedText";
import { useApi } from "@/hooks/useApi";
import { copyToClipboard } from "@/lib/sharedUtils";
import LoadingCard from "@/components/shared/LoadingCard";

interface TestResult {
  id: string;
  task_topic: string;
  created_date: string;
  audio_url?: string;
  teil_type?: 'teil1' | 'teil2' | 'teil3';
  scores: {
    fluency: number;
    vocabulary: number;
    grammar: number;
    pronunciation: number;
    task_completion: number;
    content_structure?: number;
    word_count?: number;
    word_count_adequacy?: number;
    wordCount?: number;
    overall: number;
  };
  passed: boolean;
  feedback: {
    strengths: string[];
    areas_for_improvement: string[];
    specific_feedback: string;
    recommendations?: string[];
  };
  // Additional fields for comprehensive test data
  conversation?: Array<{
    speaker: 'user' | 'ai';
    text: string;
    audioUrl?: string;
    timestamp: number;
  }>;
  grammarCorrections?: Array<{
    original: string;
    corrected: string;
    explanation: string;
  }>;
  betterExpressions?: Array<{
    original: string;
    improved: string;
    explanation: string;
  }>;
  redemittelUsed?: Array<{
    category: 'agreement' | 'disagreement' | 'conclusion';
    phrase: string;
    context: string;
  }>;
  modelAnswer?: string;
  modelAnswerExplanation?: string[];
  exampleConversation?: Array<{
    speaker: 'user' | 'ai';
    text: string;
  }>;
  // Teil 2 specific fields
  vorteile?: string[];
  nachteile?: string[];
  presentation?: string;
  conversationMetrics?: {
    durationMinutes: number;
    wordCount: number;
    minDurationRequired: number;
    minWordsRequired: number;
    targetDuration: number;
    targetWords: number;
  };
  // Teil 3 specific fields
  summary?: string;
  transcript?: string;
}

export default function Results() {
  const { t } = useTranslation();
  const { apiCall } = useApi();
  
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);
  const [hasSubscriptionAccess, setHasSubscriptionAccess] = useState(false);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [copiedModel, setCopiedModel] = useState(false);
  const [copiedConversation, setCopiedConversation] = useState(false);

  const checkSubscriptionAccess = async () => {
    if (subscriptionChecked) return; // Prevent multiple calls
    
    try {
      const response = await apiCall('/api/subscription/status');
      if (response.ok) {
        const data = await response.json();
        setHasSubscriptionAccess(data.hasAccess);
      }
    } catch (error) {
      console.error('Error checking subscription access:', error);
    } finally {
      setSubscriptionChecked(true);
    }
  };

  const loadTests = async () => {
    try {
      const response = await apiCall('/api/memos');
      if (response.ok) {
        const testResults = await response.json();
        setTests(testResults);
        console.log(`Loaded ${testResults.length} test results from database`);
      } else {
        console.error('Failed to load test results:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setTests([]);
      }
    } catch (error) {
      console.error('Error loading tests:', error);
      setTests([]);
    }
  };

  useEffect(() => {
    const initializePage = async () => {
      await Promise.all([
        checkSubscriptionAccess(),
        loadTests()
      ]);
      setIsLoading(false);
    };
    
    initializePage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount to prevent infinite API calls

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: "Sehr gut", color: "text-green-600", bgColor: "bg-green-100" };
    if (score >= 80) return { grade: "Gut", color: "text-green-600", bgColor: "bg-green-100" };
    if (score >= 70) return { grade: "Befriedigend", color: "text-blue-600", bgColor: "bg-blue-100" };
    if (score >= 60) return { grade: "Ausreichend", color: "text-orange-600", bgColor: "bg-orange-100" };
    return { grade: "Nicht bestanden", color: "text-red-600", bgColor: "bg-red-100" };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-orange-500";
    return "bg-red-500";
  };

  const calculateStats = () => {
    if (tests.length === 0) return { average: 0, passed: 0, improvement: 0 };
    
    const totalScore = tests.reduce((sum, test) => sum + (test.scores?.overall || 0), 0);
    const average = totalScore / tests.length;
    const passed = tests.filter(test => test.passed).length;
    
    // Calculate improvement (compare first 3 vs last 3 tests)
    let improvement = 0;
    if (tests.length >= 6) {
      const recent = tests.slice(0, 3);
      const older = tests.slice(-3);
      const recentAvg = recent.reduce((sum, test) => sum + (test.scores?.overall || 0), 0) / 3;
      const olderAvg = older.reduce((sum, test) => sum + (test.scores?.overall || 0), 0) / 3;
      improvement = recentAvg - olderAvg;
    }
    
    return { average, passed, improvement };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTopicName = (topic: string) => {
    const linkingWords = ['and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'the', 'a', 'an'];
    
    return topic
      .split('_')
      .map((word, index, array) => {
        const lowerWord = word.toLowerCase();
        
        // Always capitalize first and last words
        if (index === 0 || index === array.length - 1) {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        
        // Keep linking words lowercase
        if (linkingWords.includes(lowerWord)) {
          return lowerWord;
        }
        
        // Capitalize other words
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  };

  const handleCopyToClipboard = async (text: string, setCopied: (value: boolean) => void) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 lg:p-12 xl:p-16">
        <div className="max-w-7xl mx-auto h-full flex min-h-0">
          <div className="w-full h-full min-h-0 overflow-hidden">
            <LoadingCard type="processing" />
          </div>
        </div>
      </div>
    );
  }


  if (!hasSubscriptionAccess) {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-responsive">
      <div className="container-responsive mx-auto">
        <div className="text-center mb-12">
          <div className="mb-4 bg-purple-100 text-purple-800 px-4 py-2 rounded-full inline-flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            <TranslatedText 
              translationKey="results.progress_analytics" 
              fallback="Progress Analytics"
            />
          </div>
          <h1 className="text-responsive-2xl font-bold text-slate-900 mb-4">
            <TranslatedText 
              translationKey="results.your_progress" 
              fallback="Your Progress"
            />
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            <TranslatedText 
              translationKey="results.track_performance" 
              fallback="Track your speaking test performance and see how you're improving over time."
            />
          </p>
        </div>

        {tests.length === 0 ? (
          <div className="shadow-xl bg-white/90 backdrop-blur-sm text-center p-12 rounded-lg">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">
              <TranslatedText 
                translationKey="results.no_test_results" 
                fallback="No Test Results Yet"
              />
            </h3>
            <p className="text-slate-600 mb-8">
              <TranslatedText 
                translationKey="results.take_first_test" 
                fallback="Take your first speaking test to start tracking your progress."
              />
            </p>
            <a href="/speaking">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition-colors">
                <TranslatedText 
                  translationKey="results.take_first_test_button" 
                  fallback="Take Your First Test"
                />
              </button>
            </a>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-responsive mb-8 sm:mb-12">
              <div className="shadow-xl bg-white/90 backdrop-blur-sm rounded-lg">
                <div className="text-center pb-4 p-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    <TranslatedText 
                      translationKey="results.average_score" 
                      fallback="Average Score"
                    />
                  </h3>
                </div>
                <div className="text-center pb-6 px-6">
                  <div className={`text-3xl sm:text-4xl font-bold mb-2 ${Math.round(stats.average) >= 90 ? 'text-green-600' :
                    Math.round(stats.average) >= 80 ? 'text-blue-600' :
                      Math.round(stats.average) >= 70 ? 'text-yellow-600' :
                        Math.round(stats.average) >= 60 ? 'text-orange-600' :
                          'text-red-600'
                    }`}>
                    {Math.round(stats.average)}
                  </div>
                  <div className={`text-sm px-3 py-1 rounded-full font-medium mb-2 ${Math.round(stats.average) >= 90 ? 'bg-green-100 text-green-600' :
                    Math.round(stats.average) >= 80 ? 'bg-blue-100 text-blue-600' :
                      Math.round(stats.average) >= 70 ? 'bg-yellow-100 text-yellow-600' :
                        Math.round(stats.average) >= 60 ? 'bg-orange-100 text-orange-600' :
                          'bg-red-100 text-red-600'
                    }`}>
                    {Math.round(stats.average) >= 90 ? 'Sehr gut' :
                      Math.round(stats.average) >= 80 ? 'Gut' :
                        Math.round(stats.average) >= 70 ? 'Befriedigend' :
                          Math.round(stats.average) >= 60 ? 'Ausreichend' :
                            'Nicht bestanden'}
                  </div>
                  <p className="text-slate-600">
                    <TranslatedText 
                      translationKey="results.out_of_100" 
                      fallback="out of 100"
                    />
                  </p>
                </div>
              </div>

              <div className="shadow-xl bg-white/90 backdrop-blur-sm rounded-lg">
                <div className="text-center pb-4 p-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    <TranslatedText 
                      translationKey="results.tests_passed" 
                      fallback="Tests Passed"
                    />
                  </h3>
                </div>
                <div className="text-center pb-6 px-6">
                  <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-2">
                    {stats.passed}
                  </div>
                  <p className="text-slate-600">
                    {t('results.of_tests', { count: tests.length })}
                  </p>
                </div>
              </div>

              <div className="shadow-xl bg-white/90 backdrop-blur-sm rounded-lg">
                <div className="text-center pb-4 p-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    <TranslatedText 
                      translationKey="results.improvement" 
                      fallback="Improvement"
                    />
                  </h3>
                </div>
                <div className="text-center pb-6 px-6">
                  <div className={`text-3xl sm:text-4xl font-bold mb-2 ${stats.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.improvement >= 0 ? '+' : ''}{stats.improvement.toFixed(1)}
                  </div>
                  <p className="text-slate-600">
                    <TranslatedText 
                      translationKey="results.recent_trend" 
                      fallback="recent trend"
                    />
                  </p>
                </div>
              </div>
            </div>

            {/* Test History */}
            <div className="shadow-xl bg-white/90 backdrop-blur-sm rounded-lg">
              <div className="p-4 sm:p-6 border-b">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  <TranslatedText 
                    translationKey="results.test_history" 
                    fallback="Test History"
                  />
                </h2>
              </div>
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="space-y-4">
                  {tests.map((test) => (
                    <div key={test.id} className="border border-slate-200 rounded-xl p-responsive hover:shadow-lg transition-all duration-300">
                      <div className="flex flex-col mb-4">
                        {/* Header with topic, date, and score */}
                         <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-responsive-base font-semibold text-slate-900">{formatTopicName(test.task_topic)}</h3>
                            <p className="text-slate-600 text-sm">
                              {formatDate(test.created_date)}
                            </p>
                          </div>
                          
                          {/* Score - only visible on large screens */}
                          <div className="hidden lg:block text-right">
                            <div className={`text-4xl font-bold ${Math.round(test.scores?.overall || 0) >= 90 ? 'text-green-600' :
                              Math.round(test.scores?.overall || 0) >= 80 ? 'text-blue-600' :
                                Math.round(test.scores?.overall || 0) >= 70 ? 'text-yellow-600' :
                                  Math.round(test.scores?.overall || 0) >= 60 ? 'text-orange-600' :
                                    'text-red-600'
                              }`}>
                              {Math.round(test.scores?.overall || 0)}
                            </div>
                          </div>
                        </div>
                          {/* Badges and score for small screens */}
                         <div className="block lg:hidden text-center">
                             <div className={`text-4xl font-bold ${Math.round(test.scores?.overall || 0) >= 90 ? 'text-green-600' :
                               Math.round(test.scores?.overall || 0) >= 80 ? 'text-blue-600' :
                                 Math.round(test.scores?.overall || 0) >= 70 ? 'text-yellow-600' :
                                   Math.round(test.scores?.overall || 0) >= 60 ? 'text-orange-600' :
                                     'text-red-600'
                               }`}>
                               {Math.round(test.scores?.overall || 0)}
                             </div>
                           </div>

                        <div className="flex flex-col lg:hidden gap-4">
                          <div className="flex items-center justify-center gap-2">
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                              test.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {test.passed ? t('results.passed') : t('results.not_passed')}
                            </div>
                            <div className={`text-xs px-2 py-1 rounded-full font-medium ${Math.round(test.scores?.overall || 0) >= 90 ? 'bg-green-100 text-green-600' :
                              Math.round(test.scores?.overall || 0) >= 80 ? 'bg-blue-100 text-blue-600' :
                                Math.round(test.scores?.overall || 0) >= 70 ? 'bg-yellow-100 text-yellow-600' :
                                  Math.round(test.scores?.overall || 0) >= 60 ? 'bg-orange-100 text-orange-600' :
                                    'bg-red-100 text-red-600'
                              }`}>
                              {Math.round(test.scores?.overall || 0) >= 90 ? t('results.sehr_gut') :
                                Math.round(test.scores?.overall || 0) >= 80 ? t('results.gut') :
                                  Math.round(test.scores?.overall || 0) >= 70 ? t('results.befriedigend') :
                                    Math.round(test.scores?.overall || 0) >= 60 ? t('results.ausreichend') :
                                      t('results.nicht_bestanden')}
                            </div>
                          </div>
                         
                        </div>

                        {/* Badges for large screens */}
                        <div className="hidden lg:flex items-center justify-end gap-2">
                          <div className={`px-3 py-1 rounded-full text-base font-medium ${
                            test.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {test.passed ? t('results.passed') : t('results.not_passed')}
                          </div>
                          <div className={`text-base px-2 py-1 rounded-full font-medium ${Math.round(test.scores?.overall || 0) >= 90 ? 'bg-green-100 text-green-600' :
                            Math.round(test.scores?.overall || 0) >= 80 ? 'bg-blue-100 text-blue-600' :
                              Math.round(test.scores?.overall || 0) >= 70 ? 'bg-yellow-100 text-yellow-600' :
                                Math.round(test.scores?.overall || 0) >= 60 ? 'bg-orange-100 text-orange-600' :
                                  'bg-red-100 text-red-600'
                            }`}>
                            {Math.round(test.scores?.overall || 0) >= 90 ? t('results.sehr_gut') :
                              Math.round(test.scores?.overall || 0) >= 80 ? t('results.gut') :
                                Math.round(test.scores?.overall || 0) >= 70 ? t('results.befriedigend') :
                                  Math.round(test.scores?.overall || 0) >= 60 ? t('results.ausreichend') :
                                    t('results.nicht_bestanden')}
                          </div>
                        </div>
                      </div>

                      {/* Score Breakdown */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-responsive mb-4">
                        {test.scores && Object.entries(test.scores).filter(([key]) => key !== 'overall').map(([key, score]) => (
                          <div key={key} className="text-center">
                            <div className="text-sm text-black mb-1 capitalize">
                              {t(`results.${key}`, { 
                                fallback: key === 'content_structure' ? 'Struktur Konten' :
                                 key === 'word_count_adequacy' || key === 'word_count' || key === 'wordCount' ? 'Jumlah Kata' :
                                 key === 'fluency' ? 'Kelancaran' :
                                 key === 'vocabulary' ? 'Kosakata' :
                                 key === 'grammar' ? 'Tata Bahasa' :
                                 key === 'pronunciation' ? 'Pelafalan' :
                                 key === 'task_completion' ? 'Penyelesaian Tugas' :
                                 key === 'interaction_reaction' ? t('results.interaction_reaction') :
                                 key === 'language_appropriateness' ? t('results.language_appropriateness') :
                                 key.replace('_', ' ')
                              })}
                            </div>
                            <div className={`font-semibold ${getScoreColor(score)}`}>
                              {Math.round(score)}
                            </div>
                            <div className={`text-xs px-1 py-0.5 rounded-full font-medium mb-1 ${getScoreGrade(score).bgColor} ${getScoreGrade(score).color}`}>
                              {getScoreGrade(score).grade}
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                              <div 
                                className={`h-2 rounded-full ${getProgressColor(score)}`}
                                style={{ width: `${score}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-3">
                        <button 
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium shadow-sm hover:shadow-md"
                          onClick={() => setSelectedTest(selectedTest?.id === test.id ? null : test)}
                        >
                          <Eye className="w-4 h-4" />
                          {selectedTest?.id === test.id ? t('results.hide_details') : t('results.view_details')}
                        </button>
                      </div>

                      {/* Test Results Details */}
                      {selectedTest?.id === test.id && (
                        <div className="mt-6">
                          {/* Test Results and Status */}
                          <div className="text-center p-responsive-half mb-8">
                            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-900 mb-4">Test Results</h2>
                            <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm sm:text-base font-semibold ${test.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                              {test.passed ? (
                                <>
                                  <Award className="w-6 h-6" />
                                  <span>BESTANDEN</span>
                                </>
                              ) : (
                                <>
                                  <Award className="w-6 h-6" />
                                  <span>NICHT BESTANDEN</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Scores Section */}
                          <div className="bg-slate-50 p-4 sm:p-6 rounded-xl sm:mx-4 mb-4 lg:mb-8 lg:mx-8">
                            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-800 mb-4">
                              <TranslatedText
                                translationKey="results.scores"
                                fallback="Skor dan Penilaian Anda"
                              />
                            </h3>
                            <div className="bg-white p-4 rounded-lg border border-slate-200">
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-700 font-medium text-sm sm:text-base">
                                    Flüssigkeit:
                                  </span>
                                  <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(test.scores?.fluency || 0)}/100</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-700 font-medium text-sm sm:text-base">
                                    Wortschatz:
                                  </span>
                                  <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(test.scores?.vocabulary || 0)}/100</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-700 font-medium text-sm sm:text-base">
                                    Grammatik:
                                  </span>
                                  <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(test.scores?.grammar || 0)}/100</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-700 font-medium text-sm sm:text-base">
                                    Aussprache:
                                  </span>
                                  <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(test.scores?.pronunciation || 0)}/100</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-700 font-medium text-sm sm:text-base">
                                    Aufgabenbewältigung:
                                  </span>
                                  <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(test.scores?.task_completion || 0)}/100</span>
                                </div>

                                {/* Overall Score */}
                                <div className="border-t border-slate-300 pt-3 mt-4">
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-800 font-bold text-base sm:text-lg">
                                      Gesamt:
                                    </span>
                                    <span className={`font-bold text-lg sm:text-xl ${Math.round(test.scores?.overall || 0) >= 80 ? 'text-green-600' :
                                        Math.round(test.scores?.overall || 0) >= 60 ? 'text-yellow-600' :
                                          'text-red-600'
                                      }`}>{Math.round(test.scores?.overall || 0)}/100</span>
                                  </div>
                                  <div className="flex justify-between items-center mt-2">
                                    <span className="text-slate-800 font-bold text-base sm:text-lg">
                                      Prädikat:
                                    </span>
                                    <span className={`font-bold text-base sm:text-lg ${Math.round(test.scores?.overall || 0) >= 90 ? 'text-green-600' :
                                      Math.round(test.scores?.overall || 0) >= 80 ? 'text-blue-600' :
                                        Math.round(test.scores?.overall || 0) >= 70 ? 'text-yellow-600' :
                                          Math.round(test.scores?.overall || 0) >= 60 ? 'text-orange-600' :
                                            'text-red-600'
                                        }`}>
                                      {Math.round(test.scores?.overall || 0) >= 90 ? 'Sehr gut' :
                                        Math.round(test.scores?.overall || 0) >= 80 ? 'Gut' :
                                          Math.round(test.scores?.overall || 0) >= 70 ? 'Befriedigend' :
                                            Math.round(test.scores?.overall || 0) >= 60 ? 'Ausreichend' :
                                              'Nicht bestanden'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Feedback Section */}
                          <div className="bg-slate-50 p-4 sm:p-6 rounded-xl sm:mx-4 mb-4 lg:mb-8 lg:mx-8">
                            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-800 mb-4">
                              <TranslatedText
                                translationKey="results.detailed_feedback"
                                fallback="Penilaian Anda"
                              />
                            </h3>
                            <div className="bg-white p-4 rounded-lg border border-slate-200">
                              <div className="space-y-4">
                                {/* Strengths */}
                                <div>
                                  <h4 className="text-xs sm:text-sm lg:text-base font-medium text-green-700 mb-2">
                                    Stärken:
                                  </h4>
                                  <ul className="text-xs sm:text-sm lg:text-base text-slate-700 space-y-1">
                                    {test.feedback?.strengths && test.feedback.strengths.length > 0 ? (
                                      test.feedback.strengths.map((strength, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                          <span className="text-green-500">•</span>
                                          {strength}
                                        </li>
                                      ))
                                    ) : (
                                      <li className="text-slate-500 italic">No specific strengths identified.</li>
                                    )}
                                  </ul>
                                </div>

                                {/* Areas for Improvement */}
                                <div>
                                  <h4 className="text-xs sm:text-sm lg:text-base font-medium text-orange-700 mb-2">
                                    Verbesserungsbereiche:
                                  </h4>
                                  <ul className="text-xs sm:text-sm lg:text-base text-slate-700 space-y-1">
                                    {test.feedback?.areas_for_improvement && test.feedback.areas_for_improvement.length > 0 ? (
                                      test.feedback.areas_for_improvement.map((area, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                          <span className="text-orange-500">•</span>
                                          {area}
                                        </li>
                                      ))
                                    ) : (
                                      <li className="text-slate-500 italic">No specific areas for improvement identified.</li>
                                    )}
                                  </ul>
                                </div>

                                {/* Recommendations */}
                                {test.feedback?.recommendations && test.feedback.recommendations.length > 0 && (
                                  <div>
                                    <h4 className="text-xs sm:text-sm lg:text-base font-medium text-purple-700 mb-2">
                                      Empfehlungen:
                                    </h4>
                                    <ul className="text-xs sm:text-sm lg:text-base text-slate-700 space-y-1">
                                      {test.feedback.recommendations.map((recommendation, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                          <span className="text-purple-500">•</span>
                                          {recommendation}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Detailed Assessment */}
                          {test.feedback?.specific_feedback && (
                            <div className="bg-slate-50 p-4 sm:p-6 rounded-xl sm:mx-4 mb-4 lg:mb-8 lg:mx-8">
                              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-800 mb-4">
                                <TranslatedText translationKey="sections.detailed_evaluation" fallback="Detaillierte Bewertung" />
                            </h3>
                              <div className="bg-white p-4 rounded-lg border border-slate-200">
                                <p className="text-xs sm:text-sm lg:text-base text-slate-700 leading-relaxed">
                                  {test.feedback.specific_feedback}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Conversation Transcript */}
                          {test.conversation && test.conversation.length > 0 && (
                            <div className="bg-indigo-50 p-4 sm:p-6 rounded-xl sm:mx-4 mb-4 lg:mb-8 lg:mx-8">
                              <div className="mb-4">
                                <h3 className="font-semibold text-indigo-800 flex items-center gap-2">
                                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                                  <TranslatedText translationKey="sections.your_conversation" fallback="Your Conversation" />
                                </h3>
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-indigo-200">
                                <div className="flex justify-end mb-4">
                                  <button
                                    onClick={() => {
                                      const conversationText = test.conversation?.map(turn =>
                                        `${turn.speaker === 'user' ? 'Sie' : 'KI-Partner'}: ${turn.text}`
                                      ).join('\n') || '';
                                      handleCopyToClipboard(conversationText, setCopiedConversation);
                                    }}
                                    className="relative group"
                                    title="Copy text"
                                  >
                                    <div className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center transition-colors">
                                      {copiedConversation ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                                    </div>
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                      Copy text
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                                    </div>
                                  </button>
                                </div>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                  {test.conversation.map((turn, index) => (
                                    <div key={index} className={`flex gap-4 ${turn.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                                      <div className={`max-w-md p-4 rounded-lg ${turn.speaker === 'user'
                                          ? 'bg-indigo-100 text-indigo-900'
                                          : 'bg-gray-100 text-gray-900'
                                        }`}>
                                        <div className={`flex items-center gap-2 mb-2 ${turn.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                                          {turn.speaker === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                          <span className="font-semibold">
                                            {turn.speaker === 'user' ? 'Sie' : 'KI-Partner'}
                                          </span>
                                        </div>
                                        <p className={`text-sm md:text-base ${turn.speaker === 'user' ? 'text-right' : 'text-left'}`}>{turn.text}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Your Recording (Original) - User dialogues only */}
             {test.conversation && test.conversation.filter(turn => turn.speaker === 'user').length > 0 && (
               <div className="bg-red-50 p-4 sm:p-6 rounded-xl sm:mx-4 mb-4 lg:mb-8 lg:mx-8">
                 <div className="mb-4">
                   <h3 className="font-semibold text-red-800">
                     <TranslatedText translationKey="sections.your_recording_original" fallback="Your Recording (Original)" />
                   </h3>
                 </div>
                 <div className="bg-white p-4 rounded-lg border border-red-200">
                   <div className="space-y-3">
                     {test.conversation
                       .filter(turn => turn.speaker === 'user')
                       .map((turn, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <span className="text-red-500 font-bold">🎤</span>
                        <div className="flex-1 flex items-start gap-3">
                          <p className="text-slate-700 italic flex-1 text-sm md:text-base">&quot;{turn.text}&quot;</p>
                          {index === 0 && (
                            <button
                              onClick={() => {
                                const originalText = test.conversation
                                  ?.filter(turn => turn.speaker === 'user')
                                  .map(turn => turn.text)
                                  .join('\n') || '';
                                navigator.clipboard.writeText(originalText);
                              }}
                              className="relative group flex-shrink-0"
                              title="Copy text"
                            >
                              <div className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors">
                                <Copy className="w-4 h-4 text-white" />
                              </div>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                Copy text
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                              </div>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

             {/* Corrected Version - User dialogues with corrections */}
             {test.grammarCorrections && test.grammarCorrections.length > 0 && test.conversation && (
               <div className="bg-green-50 p-4 sm:p-6 rounded-xl sm:mx-4 mb-4 lg:mb-8 lg:mx-8">
                 <div className="mb-4">
                   <h3 className="font-semibold text-green-800">
                     <TranslatedText translationKey="sections.corrected_version" fallback="Corrected Version" />
                   </h3>
                 </div>
                 <div className="bg-white p-4 rounded-lg border border-green-200">
                   <div className="space-y-3">
                     {test.conversation
                       .filter(turn => turn.speaker === 'user')
                       .map((turn, index) => {
                         // Find corrections for this user turn
                         const corrections = test.grammarCorrections?.filter(correction =>
                           turn.text.includes(correction.original)
                         ) || [];

                        let correctedText = turn.text;
                        corrections.forEach(correction => {
                          correctedText = correctedText.replace(correction.original, correction.corrected);
                        });

                        return (
                          <div key={index} className="flex items-start gap-3">
                            <span className="text-green-500 font-bold">✓</span>
                            <div className="flex-1 flex items-start gap-3">
                              <p className="text-slate-700 italic flex-1 text-sm md:text-base">&quot;{correctedText}&quot;</p>
                              {index === 0 && (
                                <button
                                  onClick={() => {
                                    const correctedText = test.conversation
                                      ?.filter(turn => turn.speaker === 'user')
                                      .map(turn => {
                                        const corrections = test.grammarCorrections?.filter(correction =>
                                          turn.text.includes(correction.original)
                                        ) || [];
                                        let correctedText = turn.text;
                                        corrections.forEach(correction => {
                                          correctedText = correctedText.replace(correction.original, correction.corrected);
                                        });
                                        return correctedText;
                                      }).join('\n') || '';
                                    navigator.clipboard.writeText(correctedText);
                                  }}
                                  className="relative group flex-shrink-0"
                                  title="Copy text"
                                >
                                  <div className="w-10 h-10 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center transition-colors">
                                    <Copy className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    Copy text
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                                  </div>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                </div>
              </div>
            )}

                          {/* Grammar Corrections */}
                         

{test.grammarCorrections && test.grammarCorrections.length > 0 && (
              <div className="bg-orange-50 p-4 sm:p-6 rounded-xl sm:mx-4 mb-4 lg:mb-8 lg:mx-8">
                <div className="mb-4">
                  <h3 className="font-semibold text-orange-800">
                    <TranslatedText translationKey="sections.grammar_corrections" fallback="Grammar Corrections" />
                  </h3>
                </div>
                <div className="space-y-3">
                  {test.grammarCorrections.map((correction, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-orange-200">
                      <div className="flex items-start gap-3">
                        <span className="text-red-500 font-bold">✗</span>
                        <div className="flex-1">
                          <p className="text-slate-700 mb-1 text-sm md:text-base"><strong>Original:</strong> {correction.original}</p>
                          <p className="text-green-700 mb-1 text-sm md:text-base"><strong>Corrected:</strong> {correction.corrected}</p>
                          <p className="text-slate-600 text-xs md:text-sm">{correction.explanation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
                            

                          {/* Speaking Ideas Section */}
                          <div className="bg-purple-50 p-4 sm:p-6 rounded-xl sm:mx-4 mb-4 lg:mb-8 lg:mx-8">
                            <div className="mb-4">
                              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-purple-800">
                                <TranslatedText translationKey="sections.speaking_ideas" fallback="💡 Speaking Ideas" />
                              </h3>
                            </div>
                            
                              <div className="mb-0">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                                  {/* Zustimmen (Agreement) */}
                                  <div className="bg-green-50 sm:mb-0 mb-4 p-2 sm:p-4 md:p-6 rounded-lg border border-green-200 flex flex-col">
                                    <div className="flex items-center gap-2 mb-4">
                                      <span className="text-green-600 font-bold text-base sm:text-sm lg:text-xl">✓</span>
                                      <h5 className="font-bold text-green-800 text-base sm:text-sm lg:text-lg">Zustimmen</h5>
                                    </div>
                                    <ul className="text-xs sm:text-sm lg:text-base text-slate-700 space-y-2 flex-grow">
                                      <li>• Das ist eine gute Idee!</li>
                                      <li>• Ich stimme Ihnen zu.</li>
                                      <li>• Das finde ich auch.</li>
                                      <li>• Genau, das denke ich auch.</li>
                                      <li>• Das ist richtig.</li>
                                    </ul>
                                  </div>

                                  {/* Ablehnen (Disagreement) */}
                                  <div className="bg-red-50 sm:mb-0 mb-4 p-2 sm:p-4 md:p-6 rounded-lg border border-red-200 flex flex-col">
                                    <div className="flex items-center gap-2 mb-4">
                                      <span className="text-red-600 font-bold text-base sm:text-sm lg:text-xl">✗</span>
                                      <h5 className="font-bold text-red-800 text-base sm:text-sm lg:text-lg">Ablehnen</h5>
                                    </div>
                                    <ul className="text-xs sm:text-sm lg:text-base text-slate-700 space-y-2 flex-grow">
                                      <li>• Das finde ich nicht so gut.</li>
                                      <li>• Ich bin anderer Meinung.</li>
                                      <li>• Das sehe ich anders.</li>
                                      <li>• Ich denke, das ist nicht richtig.</li>
                                      <li>• Das halte ich für problematisch.</li>
                                    </ul>
                                  </div>
                                </div>

                                {/* Additional Conversation Functions */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 sm:mt-3 md:mt-4 gap-x-4 gap-y-4 mb-4">
                                  {/* SITUATION NENNEN */}
                                  <div className="bg-orange-50 p-2 sm:p-4 md:p-6 rounded-lg border border-orange-200 flex flex-col">
                                    <div className="flex items-center gap-2 mb-4">
                                      <span className="text-orange-600 font-bold text-base sm:text-sm lg:text-xl">ℹ️</span>
                                      <h5 className="font-bold text-orange-800 text-base sm:text-sm lg:text-lg">Situation nennen</h5>
                                    </div>
                                    <ul className="text-xs sm:text-sm lg:text-base text-slate-700 space-y-2 flex-grow">
                                      <li>• In meinem Heimatland...</li>
                                      <li>• Bei uns ist es so, dass...</li>
                                      <li>• Ich kenne das Problem...</li>
                                    </ul>
                                  </div>

                                  {/* VORSCHLÄGE MACHEN */}
                                  <div className="bg-blue-50 p-2 sm:p-4 md:p-6 rounded-lg border border-blue-200 flex flex-col">
                                    <div className="flex items-center gap-2 mb-4">
                                      <span className="text-blue-600 font-bold text-base sm:text-sm lg:text-xl">💡</span>
                                      <h5 className="font-bold text-blue-800 text-base sm:text-sm lg:text-lg">Vorschläge machen</h5>
                                    </div>
                                    <ul className="text-xs sm:text-sm lg:text-base text-slate-700 space-y-2 flex-grow">
                                      <li>• Wie wäre es, wenn...?</li>
                                      <li>• Wir könnten...</li>
                                      <li>• Ich schlage vor...</li>
                                    </ul>
                                  </div>

                                  {/* MEINUNG AUßERN */}
                                  <div className="bg-purple-50 p-2 sm:p-4 md:p-6 rounded-lg border border-purple-200 flex flex-col">
                                    <div className="flex items-center gap-2 mb-4">
                                      <span className="text-purple-600 font-bold text-base sm:text-sm lg:text-xl">🗣️</span>
                                      <h5 className="font-bold text-purple-800 text-base sm:text-sm lg:text-lg">Meinung äußern</h5>
                                    </div>
                                    <ul className="text-xs sm:text-sm lg:text-base text-slate-700 space-y-2 flex-grow">
                                      <li>• Ich denke, dass...</li>
                                      <li>• Meiner Meinung nach...</li>
                                      <li>• Ich finde, dass...</li>
                                    </ul>
                                  </div>

                                  {/* EINIGUNG */}
                                  <div className="bg-teal-50 p-2 sm:p-4 md:p-6 rounded-lg border border-teal-200 flex flex-col">
                                    <div className="flex items-center gap-2 mb-4">
                                      <span className="text-teal-600 font-bold text-base sm:text-sm lg:text-xl">🤝</span>
                                      <h5 className="font-bold text-teal-800 text-base sm:text-sm lg:text-lg">Einigung</h5>
                                    </div>
                                    <ul className="text-xs sm:text-sm lg:text-base text-slate-700 space-y-2 flex-grow">
                                      <li>• Dann machen wir das so.</li>
                                      <li>• Das ist eine gute Lösung.</li>
                                      <li>• Einverstanden!</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>

                              {/* Example Conversation for Teil 1 */}
                              {test.teil_type === 'teil1' && (
                                <div className="bg-white p-6 rounded-lg border border-purple-200 mb-6">
                                  <div className="flex justify-end items-center mb-4">
                                   
                                    {test.exampleConversation && test.exampleConversation.length > 0 && (
                                      <button
                                        onClick={() => {
                                          const conversationText = test.exampleConversation?.map(turn => 
                                            `${turn.speaker === 'user' ? 'Sie' : 'KI'}: ${turn.text}`
                                          ).join('\n') || '';
                                          handleCopyToClipboard(conversationText, setCopiedConversation);
                                        }}
                                        className="relative group"
                                        title="Copy example conversation"
                                      >
                                        <div className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center transition-colors">
                                          {copiedConversation ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                                        </div>
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                          Copy conversation
                                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                                        </div>
                                      </button>
                                    )}
                                  </div>
                                  {test.exampleConversation && test.exampleConversation.length > 0 ? (
                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                      {test.exampleConversation.map((turn, index) => (
                                        <div key={index} className={`flex gap-4 ${turn.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                                          <div className={`max-w-md p-4 rounded-lg ${turn.speaker === 'user'
                                              ? 'bg-blue-100 text-blue-900'
                                              : 'bg-gray-100 text-gray-900'
                                            }`}>
                                            <div className={`flex items-center gap-2 mb-2 ${turn.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                                              {turn.speaker === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                              <span className="font-semibold">
                                                {turn.speaker === 'user' ? 'Sie' : 'KI'}
                                              </span>
                                            </div>
                                            <p className={`italic text-sm md:text-base ${turn.speaker === 'user' ? 'text-right' : 'text-left'}`}>&ldquo;{turn.text}&rdquo;</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center text-gray-500 py-8">
                                      <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                      <p>
                                        <TranslatedText 
                                          translationKey="results.no_example_conversation" 
                                          fallback="Anda tidak memiliki contoh percakapan..." 
                                        />
                                      </p>
                                    </div>
                                  ) 
                            
                              
                              }
                                </div>
                              )}

                              {/* Generated Conversation Example for other parts */}
                              {test.teil_type !== 'teil1' && (
                                <div className="bg-white p-4 rounded-lg border border-purple-200 mb-4 relative">
                                  <div className="absolute top-2 right-2 group">
                                   <button
                   onClick={() => handleCopyToClipboard(test.modelAnswer || '', setCopiedModel)}
                   className={`flex items-center justify-center rounded-full w-8 h-8 sm:w-10 sm:h-10 gap-1 text-white transition-colors text-sm bg-purple-600 hover:bg-purple-700`}
                 >
                   {copiedModel ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : <Copy className="w-3 h-3 sm:w-4 sm:h-4" />}
                 </button>
                                  </div>
                                  <p className="text-xs sm:text-sm lg:text-base text-slate-700 italic mb-4 pr-6 sm:pr-16">&quot;{test.modelAnswer}&quot;</p>
                                </div>
                              )}

                              {/* B1 Goethe Criteria Explanation */}
                              <div className="bg-white p-2 sm:p-4 md:p-6 rounded-lg border border-purple-200 mb-6">
                                <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2 text-base sm:text-sm lg:text-lg">
                                  <span className="text-purple-600 text-base sm:text-sm lg:text-xl">📋</span>
                                  Warum dies den B1 Goethe Zertifikat Kriterien entspricht:
                                </h4>
                                <div className="space-y-2 text-xs sm:text-sm lg:text-base text-slate-700">
                                  {test.modelAnswerExplanation && test.modelAnswerExplanation.map((explanation: string, index: number) => (
                                    <div key={index} className="flex items-start gap-2">
                                      <span className="text-purple-500 font-bold">✓</span>
                                      <span>{explanation}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                             
                            
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}