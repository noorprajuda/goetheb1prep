'use client';

import React, { useState, useEffect } from 'react';
// import { useTranslation } from 'react-i18next';
import { Trash2, RefreshCw, AlertTriangle, CheckCircle, Clock, HardDrive } from 'lucide-react';

interface CleanupStats {
  totalFiles: number;
  audioFiles: number;
  oldestFile: string | null;
  newestFile: string | null;
  totalSize: number;
}

interface CleanupResult {
  oldFiles: number;
  excessFiles: number;
  totalCleaned: number;
}

export default function AudioCleanupPage() {
  // const { t } = useTranslation();
  const [stats, setStats] = useState<CleanupStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<CleanupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/audio-cleanup?action=stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to fetch stats');
      }
    } catch {
      setError('Failed to fetch cleanup stats');
    } finally {
      setLoading(false);
    }
  };

  const performCleanup = async (action: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/audio-cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setLastCleanup(data.result);
        await fetchStats(); // Refresh stats
      } else {
        setError(data.error || 'Cleanup failed');
      }
    } catch {
      setError('Failed to perform cleanup');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Audio File Cleanup
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage and clean up audio files in the uploads directory
                </p>
              </div>
              <button
                onClick={fetchStats}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {lastCleanup && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Cleanup Completed</h3>
                    <div className="mt-2 text-sm text-green-700">
                      Removed {lastCleanup.totalCleaned} files ({lastCleanup.oldFiles} old files, {lastCleanup.excessFiles} excess files)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <HardDrive className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-600">Total Files</p>
                      <p className="text-2xl font-bold text-blue-900">{stats.totalFiles}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-600">Audio Files</p>
                      <p className="text-2xl font-bold text-green-900">{stats.audioFiles}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <HardDrive className="h-8 w-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-yellow-600">Total Size</p>
                      <p className="text-2xl font-bold text-yellow-900">{formatBytes(stats.totalSize)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-purple-600">Oldest File</p>
                      <p className="text-sm font-bold text-purple-900">{formatDate(stats.oldestFile)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Cleanup Actions</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => performCleanup('full-cleanup')}
                  disabled={loading}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Full Cleanup
                </button>

                <button
                  onClick={() => performCleanup('cleanup-old')}
                  disabled={loading}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Clean Old Files
                </button>

                <button
                  onClick={() => performCleanup('cleanup-excess')}
                  disabled={loading}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                >
                  <HardDrive className="h-4 w-4 mr-2" />
                  Clean Excess Files
                </button>

                <button
                  onClick={fetchStats}
                  disabled={loading}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Stats
                </button>
              </div>
            </div>

            {stats && (
              <div className="mt-8 bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">File Details</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Total Files:</strong> {stats.totalFiles}</p>
                  <p><strong>Audio Files:</strong> {stats.audioFiles}</p>
                  <p><strong>Total Size:</strong> {formatBytes(stats.totalSize)}</p>
                  <p><strong>Oldest File:</strong> {formatDate(stats.oldestFile)}</p>
                  <p><strong>Newest File:</strong> {formatDate(stats.newestFile)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
