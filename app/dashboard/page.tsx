"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Star, Target, Trophy } from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState<{ full_name?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading user data
    setTimeout(() => {
      setUser({ full_name: "Test User" });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full transform translate-x-24 -translate-y-24"></div>
            <div className="relative z-10">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Willkommen zurück, {user?.full_name?.split(' ')[0] || 'Lerner'}! 👋
              </h1>
              <p className="text-blue-100 text-lg">
                Bereit, heute etwas Neues zu lernen?
              </p>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold">0</div>
                  <div className="text-blue-200 text-sm">Tests abgeschlossen</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">0%</div>
                  <div className="text-blue-200 text-sm">Durchschnittsnote</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">1</div>
                  <div className="text-blue-200 text-sm">Level erreicht</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Link href="/speakingtest" className="group">
            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-blue-100 shadow-sm group-hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                    Speaking Test
                  </h3>
                  <p className="text-sm text-gray-600">B1 Goethe Zertifikat</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/practice" className="group">
            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-blue-100 shadow-sm group-hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                    Practice Mode
                  </h3>
                  <p className="text-sm text-gray-600">Übung macht den Meister</p>
                </div>
              </div>
            </div>
          </Link>

          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-blue-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  Heute lernen
                </h3>
                <p className="text-sm text-gray-600">Empfohlen: 20 min</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Authentic Tasks Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-blue-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Authentic Tasks</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Practice with real B1 speaking tasks including presentations and discussions, just like the actual exam.
            </p>
            <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              Part 1 &amp; Part 2
            </span>
          </div>

          {/* AI Feedback Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-blue-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">AI Feedback</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Get detailed feedback on fluency, vocabulary, grammar, pronunciation, and task completion.
            </p>
            <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              Smart Analysis
            </span>
          </div>

          {/* Track Progress Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-blue-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Track Progress</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Monitor your improvement over time with detailed analytics and performance insights.
            </p>
            <span className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
              Performance Data
            </span>
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Getting Started</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold text-sm">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Take a Speaking Test</h3>
                <p className="text-gray-600 text-sm">Complete a B1 Goethe Zertifikat speaking test and get detailed feedback on your performance.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold text-sm">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Practice Regularly</h3>
                <p className="text-gray-600 text-sm">Use practice mode to improve your German speaking skills with guided exercises.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}