"use client";
import React, { useState } from "react";
import { CheckCircle, AlertCircle, Target, BookOpen, Lightbulb } from "lucide-react";
import CopyButton from "./CopyButton";
import AudioPlayer from "./AudioPlayer";

interface Score {
  fluency: number;
  vocabulary: number;
  grammar: number;
  pronunciation: number;
  task_completion: number;
  content_structure: number;
  word_count_adequacy: number;
  overall: number;
}

interface Feedback {
  strengths: string[];
  areas_for_improvement: string[];
  specific_feedback: string;
  recommendations: string[];
}

interface Correction {
  original: string;
  corrected: string;
  explanation: string;
}

interface ResultsSectionProps {
  scores: Score;
  feedback: Feedback;
  correctedText: string;
  corrections: Correction[];
  originalText?: string;
  modelAnswer?: string;
  vorteile?: string[];
  nachteile?: string[];
  originalAudioUrl?: string;
  correctedAudioBlob?: Blob;
  onPlayOriginal?: () => void;
  onPlayCorrected?: () => void;
  onDownloadOriginal?: () => void;
  onDownloadCorrected?: () => void;
  isPlayingOriginal?: boolean;
  isPlayingCorrected?: boolean;
  isDownloadingOriginal?: boolean;
  isDownloadingCorrected?: boolean;
  showModelAnswer?: boolean;
  showVorteileNachteile?: boolean;
}

export default function ResultsSection({
  scores,
  feedback,
  correctedText,
  corrections,
  originalText,
  modelAnswer,
  vorteile,
  nachteile,
  originalAudioUrl,
  correctedAudioBlob,
  onPlayOriginal,
  onPlayCorrected,
  onDownloadOriginal,
  onDownloadCorrected,
  isPlayingOriginal = false,
  isPlayingCorrected = false,
  isDownloadingOriginal = false,
  isDownloadingCorrected = false,
  showModelAnswer = true,
  showVorteileNachteile = true
}: ResultsSectionProps) {
  const [, setCopiedCorrected] = useState(false);
  const [, setCopiedOriginal] = useState(false);
  const [, setCopiedModel] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Sehr gut";
    if (score >= 80) return "Gut";
    if (score >= 70) return "Befriedigend";
    if (score >= 60) return "Ausreichend";
    return "Nicht bestanden";
  };

  return (
    <div className="space-y-8">
      {/* Overall Score */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Test Results</h2>
        <div className="inline-flex items-center gap-4 bg-white rounded-lg p-6 shadow-lg">
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(scores.overall)}`}>
              {Math.round(scores.overall)}
            </div>
            <div className="text-sm text-slate-600">Overall Score</div>
          </div>
          <div className="text-center">
            <span className={`font-bold text-lg ${getScoreColor(scores.overall)}`}>
              {getScoreLabel(scores.overall)}
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(scores).filter(([key]) => key !== 'overall').map(([key, value]) => (
          <div key={key} className="bg-white rounded-lg p-4 text-center shadow">
            <div className={`text-2xl font-bold ${getScoreColor(value)}`}>
              {Math.round(value)}
            </div>
            <div className="text-sm text-slate-600 capitalize">
              {key.replace('_', ' ')}
            </div>
          </div>
        ))}
      </div>

      {/* Feedback */}
      <div className="bg-white rounded-lg p-6 shadow">
        <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          Feedback
        </h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-green-700 mb-2">Stärken:</h4>
            <ul className="list-disc list-inside space-y-1">
              {feedback.strengths.map((strength, index) => (
                <li key={index} className="text-slate-700">{strength}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-red-700 mb-2">Verbesserungsbereiche:</h4>
            <ul className="list-disc list-inside space-y-1">
              {feedback.areas_for_improvement.map((area, index) => (
                <li key={index} className="text-slate-700">{area}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-700 mb-2">Specific Feedback:</h4>
            <p className="text-slate-700">{feedback.specific_feedback}</p>
          </div>

          <div>
            <h4 className="font-semibold text-blue-700 mb-2">Empfehlungen:</h4>
            <ul className="list-disc list-inside space-y-1">
              {feedback.recommendations.map((rec, index) => (
                <li key={index} className="text-slate-700">{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Original Recording */}
      {originalText && (
        <div className="bg-white rounded-lg p-6 shadow relative">
          <CopyButton
            text={originalText}
            className="bg-red-600 hover:bg-red-700"
            position="top-right"
            onCopy={() => setCopiedOriginal(true)}
          />
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-red-600" />
            Your Recording (Original)
          </h3>
          <div className="space-y-3">
            <p className="text-slate-700 italic">&quot;{originalText}&quot;</p>
            <div className="flex items-center gap-2">
              <AudioPlayer
                audioUrl={originalAudioUrl}
                isPlaying={isPlayingOriginal}
                onPlayStateChange={onPlayOriginal || (() => {})}
                size="md"
              />
              <button
                onClick={onDownloadOriginal}
                disabled={isDownloadingOriginal}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isDownloadingOriginal ? "Downloading..." : "Download Audio"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Corrected Version */}
      <div className="bg-white rounded-lg p-6 shadow relative">
        <CopyButton
          text={correctedText}
          className="bg-green-600 hover:bg-green-700"
          position="top-right"
          onCopy={() => setCopiedCorrected(true)}
        />
        <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Corrected Version
        </h3>
        <div className="space-y-3">
          <p className="text-slate-700 italic">&quot;{correctedText}&quot;</p>
          <div className="flex items-center gap-2">
            <AudioPlayer
              audioBlob={correctedAudioBlob}
              isPlaying={isPlayingCorrected}
              onPlayStateChange={onPlayCorrected || (() => {})}
              size="md"
            />
            <button
              onClick={onDownloadCorrected}
              disabled={isDownloadingCorrected}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isDownloadingCorrected ? "Downloading..." : "Download Audio"}
            </button>
          </div>
        </div>
      </div>

      {/* Grammar Corrections */}
      {corrections.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            Grammar Corrections
          </h3>
          <div className="space-y-3">
            {corrections.map((correction, index) => (
              <div key={index} className="border-l-4 border-yellow-400 pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-red-600 font-medium">&quot;{correction.original}&quot;</span>
                  <span className="text-slate-400">→</span>
                  <span className="text-green-600 font-medium">&quot;{correction.corrected}&quot;</span>
                </div>
                <p className="text-sm text-slate-600">{correction.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model Answer */}
      {showModelAnswer && modelAnswer && (
        <div className="bg-white rounded-lg p-6 shadow relative">
          <CopyButton
            text={modelAnswer}
            className="bg-purple-600 hover:bg-purple-700"
            position="top-right"
            onCopy={() => setCopiedModel(true)}
          />
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-purple-600" />
            Model Answer
          </h3>
          <p className="text-slate-700">{modelAnswer}</p>
        </div>
      )}

      {/* Vorteile & Nachteile */}
      {showVorteileNachteile && (vorteile || nachteile) && (
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Advantages & Disadvantages
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {vorteile && vorteile.length > 0 && (
              <div>
                <h4 className="font-semibold text-green-700 mb-2">Advantages:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {vorteile.map((vorteil, index) => (
                    <li key={index} className="text-slate-700">{vorteil}</li>
                  ))}
                </ul>
              </div>
            )}
            {nachteile && nachteile.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-700 mb-2">Disadvantages:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {nachteile.map((nachteil, index) => (
                    <li key={index} className="text-slate-700">{nachteil}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
