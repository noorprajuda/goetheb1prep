'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Play, Pause, RefreshCw, BarChart3, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface CrawlResult {
  url: string;
  title: string;
  description: string;
  seoScore: number;
  loadTime: number;
  wordCount: number;
  linksCount: number;
  imagesCount: number;
  timestamp: string;
}

interface CrawlStats {
  totalPages: number;
  avgLoadTime: number;
  avgSeoScore: number;
  totalLinks: number;
  totalImages: number;
  isRunning: boolean;
}

interface Schedule {
  id: string;
  name: string;
  type: 'sitemap' | 'custom';
  cron: string;
  maxPages: number;
  delay: number;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

export default function CrawlerDashboard() {
  const [stats, setStats] = useState<CrawlStats | null>(null);
  const [results, setResults] = useState<CrawlResult[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch crawler data
  const fetchCrawlerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch recent crawl results
      const crawlResponse = await fetch('/api/crawler?type=sitemap&maxPages=10');
      const crawlData = await crawlResponse.json();

      if (crawlData.success) {
        setStats(crawlData.stats);
        setResults(crawlData.results);
      }

      // Fetch schedules
      const scheduleResponse = await fetch('/api/crawler/schedule');
      const scheduleData = await scheduleResponse.json();

      if (scheduleData.success) {
        setSchedules(scheduleData.schedules);
      }

    } catch (err) {
      console.error('Error fetching crawler data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Start manual crawl
  const startCrawl = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/crawler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'sitemap',
          maxPages: 20,
          delay: 1000,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
        setResults(data.results);
      } else {
        setError(data.error || 'Crawl failed');
      }
    } catch (err) {
      console.error('Error starting crawl:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Toggle schedule
  const toggleSchedule = async (scheduleId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/crawler/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          schedule: { id: scheduleId, enabled },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSchedules(prev => 
          prev.map(schedule => 
            schedule.id === scheduleId 
              ? { ...schedule, enabled }
              : schedule
          )
        );
      } else {
        setError(data.error || 'Failed to update schedule');
      }
    } catch (err) {
      console.error('Error toggling schedule:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Start/stop scheduled crawler
  const toggleScheduledCrawler = async (start: boolean) => {
    try {
      const response = await fetch('/api/crawler/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: start ? 'start' : 'stop',
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchCrawlerData(); // Refresh data
      } else {
        setError(data.error || `Failed to ${start ? 'start' : 'stop'} scheduled crawler`);
      }
    } catch (err) {
      console.error(`Error ${start ? 'starting' : 'stopping'} scheduled crawler:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  useEffect(() => {
    fetchCrawlerData();
  }, []);

  const getSeoScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getLoadTimeColor = (time: number) => {
    if (time <= 1000) return 'text-green-600';
    if (time <= 3000) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Bot className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Robot Crawler Dashboard</h1>
          </div>
          <p className="text-gray-600">
            Monitor and manage your website crawling for SEO optimization and Google Analytics data collection.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">Error:</span>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-8 flex flex-wrap gap-4">
          <button
            onClick={startCrawl}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Crawling...' : 'Start Manual Crawl'}
          </button>

          <button
            onClick={() => fetchCrawlerData()}
            disabled={loading}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Pages Crawled</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPages}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Avg Load Time</p>
                  <p className={`text-2xl font-bold ${getLoadTimeColor(stats.avgLoadTime)}`}>
                    {stats.avgLoadTime}ms
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Avg SEO Score</p>
                  <p className={`text-2xl font-bold ${getSeoScoreColor(stats.avgSeoScore)}`}>
                    {stats.avgSeoScore}/100
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center gap-3">
                <Bot className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Links</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalLinks}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedules */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Crawl Schedules</h2>
            <div className="flex gap-2">
              <button
                onClick={() => toggleScheduledCrawler(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
              >
                <Play className="w-4 h-4" />
                Start All
              </button>
              <button
                onClick={() => toggleScheduledCrawler(false)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
              >
                <Pause className="w-4 h-4" />
                Stop All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{schedule.name}</h3>
                  <button
                    onClick={() => toggleSchedule(schedule.id, !schedule.enabled)}
                    className={`px-2 py-1 rounded text-xs ${
                      schedule.enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {schedule.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Type: {schedule.type}</p>
                  <p>Cron: {schedule.cron}</p>
                  <p>Max Pages: {schedule.maxPages}</p>
                  {schedule.lastRun && (
                    <p>Last Run: {new Date(schedule.lastRun).toLocaleString()}</p>
                  )}
                  {schedule.nextRun && (
                    <p>Next Run: {new Date(schedule.nextRun).toLocaleString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Results */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Crawl Results</h2>
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      URL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SEO Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Load Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Words
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Links
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                        <a href={result.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {result.url.replace('https://www.goetheb1prep.com', '') || '/'}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {result.title || 'No title'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-medium ${getSeoScoreColor(result.seoScore)}`}>
                          {result.seoScore}/100
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-medium ${getLoadTimeColor(result.loadTime)}`}>
                          {result.loadTime}ms
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.wordCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.linksCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
