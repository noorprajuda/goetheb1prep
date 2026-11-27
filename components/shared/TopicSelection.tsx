"use client";
import React from "react";
// import { useTranslation } from "react-i18next";
import TranslatedText from "@/components/TranslatedText";

interface Topic {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  [key: string]: string | number | boolean | string[] | undefined; // Allow additional properties
}

interface TopicSelectionProps {
  topics: Topic[];
  selectedTopic: Topic | null;
  onTopicSelect: (topic: Topic) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onContinue: () => void;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  continueButtonText: React.ReactNode;
  disabledButtonText: React.ReactNode;
}

export default function TopicSelection({
  topics,
  selectedTopic,
  onTopicSelect,
  currentPage,
  totalPages,
  onPageChange,
  onContinue,
  title,
  subtitle,
  continueButtonText,
  // disabledButtonText
}: TopicSelectionProps) {
  // const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mb-2">
              {title}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mb-2">
              {subtitle}
            </p>
            <p className="text-xs sm:text-sm text-slate-500">
              <TranslatedText 
                translationKey="common.page_of" 
                fallback={`Halaman ${currentPage} dari ${totalPages}`}
                values={{ current: currentPage, total: totalPages }}
              />
            </p>
          </div>

          <div className="grid gap-4">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedTopic?.id === topic.id
                    ? 'border-blue-500 bg-white'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
                onClick={() => onTopicSelect(topic)}
              >
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">{topic.title}</h3>
                <p className="text-sm sm:text-base text-slate-600 mb-3">{topic.description}</p>
                <div className="flex flex-wrap gap-2">
                  {topic.keywords.map((keyword) => (
                    <span key={keyword} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs sm:text-sm">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Main Action Button */}
          <div className="mt-8">
            <div className="relative group">
              <button
                onClick={onContinue}
                disabled={!selectedTopic}
                className={`w-full py-3 sm:py-4 px-6 sm:px-8 rounded-xl font-semibold text-sm sm:text-lg transition-all duration-300 ${
                  selectedTopic
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
              >
                {selectedTopic ? continueButtonText : 'Pilih'}
              </button>
              {selectedTopic ? (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  <TranslatedText 
                    translationKey="topic_selection.continue_tooltip" 
                    fallback="Klicken Sie, um fortzufahren"
                  />
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                </div>
              ) : (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-red-600 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Pilih topik dulu
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-600"></div>
                </div>
              )}
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center items-center gap-1 sm:gap-2 mt-6">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-600 font-medium rounded-md transition-colors"
            >
              ← <TranslatedText 
                translationKey="common.previous" 
                fallback="Kembali"
              />
            </button>

            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full transition-colors text-xs sm:text-sm font-medium ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-600 font-medium rounded-md transition-colors"
            >
              <TranslatedText 
                translationKey="common.next" 
                fallback="Selanjutnya"
              /> →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
