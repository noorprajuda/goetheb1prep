"use client";

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, MessageSquare, User, Bot } from 'lucide-react';
import { useRealtimeConversation } from '@/hooks/useRealtimeConversation';

interface RealtimeConversationProps {
  topic: string;
  phase: string;
  // onPhaseComplete: () => void;
  onConversationComplete: (messages: Array<{ role: string; content: string; timestamp?: number }>) => void;
}

export default function RealtimeConversation({
  topic,
  phase,
  // onPhaseComplete,
  onConversationComplete
}: RealtimeConversationProps) {
  const {
    // state,
    messages,
    startConversation,
    stopConversation,
    startRecording,
    stopRecording,
    isConnected,
    isRecording,
    isProcessing,
    error
  } = useRealtimeConversation();

  // const [isPlaying, setIsPlaying] = useState(false);
  const [currentUserMessage, setCurrentUserMessage] = useState('');
  const [currentAssistantMessage, setCurrentAssistantMessage] = useState('');

  // Start conversation when component mounts
  useEffect(() => {
    startConversation(topic, phase);
    return () => stopConversation();
  }, [topic, phase, startConversation, stopConversation]);

  // Handle new messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      if (lastMessage.type === 'user') {
        setCurrentUserMessage(prev => prev + lastMessage.content);
      } else if (lastMessage.type === 'assistant') {
        setCurrentAssistantMessage(prev => prev + lastMessage.content);
      }
    }
  }, [messages]);

  const handleStartRecording = async () => {
    setCurrentUserMessage('');
    setCurrentAssistantMessage('');
    await startRecording();
  };

  const handleStopRecording = () => {
    stopRecording();
    
    // Add completed messages to conversation
    if (currentUserMessage.trim()) {
      const userMessage = {
        role: 'user',
        content: currentUserMessage.trim(),
        timestamp: Date.now()
      };
      
      if (currentAssistantMessage.trim()) {
        const assistantMessage = {
          role: 'assistant',
          content: currentAssistantMessage.trim(),
          timestamp: Date.now()
        };
        
        onConversationComplete([userMessage, assistantMessage]);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 mb-4">
          <MessageSquare className="w-8 h-8 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Verbindungsfehler</h3>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={() => startConversation(topic, phase)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              {isConnected ? 'Verbunden' : 'Verbindung wird hergestellt...'}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {phase === 'discussion' && 'Diskussion'}
            {phase === 'disagreement' && 'Meinungsäußerung'}
            {phase === 'agreement' && 'Zustimmung'}
            {phase === 'conclusion' && 'Zusammenfassung'}
          </div>
        </div>
      </div>

      {/* Real-time Messages */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Live-Gespräch
        </h3>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {/* Current User Message */}
          {currentUserMessage && (
            <div className="flex justify-end">
              <div className="max-w-md bg-blue-100 text-blue-900 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">Sie</span>
                </div>
                <p className="text-sm">{currentUserMessage}</p>
              </div>
            </div>
          )}

          {/* Current Assistant Message */}
          {currentAssistantMessage && (
            <div className="flex justify-start">
              <div className="max-w-md bg-gray-100 text-gray-900 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="w-4 h-4" />
                  <span className="text-sm font-medium">KI-Partner</span>
                </div>
                <p className="text-sm">{currentAssistantMessage}</p>
              </div>
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="max-w-md bg-gray-100 text-gray-900 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  <span className="text-sm">KI-Partner denkt nach...</span>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recording Controls */}
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="mb-6">
          <div className="text-4xl font-mono font-bold text-slate-900 mb-2">
            {formatTime(0)} {/* You can add a timer here if needed */}
          </div>
          <p className="text-slate-600">
            {isRecording 
              ? 'Sprechen Sie natürlich...' 
              : 'Klicken Sie auf das Mikrofon, um zu sprechen'}
          </p>
        </div>

        <div className="flex justify-center gap-4">
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              disabled={!isConnected || isProcessing}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white p-4 rounded-full transition-colors"
            >
              <Mic className="w-8 h-8" />
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full transition-colors"
            >
              <MicOff className="w-8 h-8" />
            </button>
          )}
        </div>

        {isRecording && (
          <div className="mt-4">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-8 h-8 bg-red-500 rounded-full"></div>
            </div>
          </div>
        )}
      </div>

      {/* Language Restriction Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
          <span className="text-yellow-600">🇩🇪</span>
          Spracheinstellung
        </h4>
        <p className="text-yellow-700 text-sm">
          <strong>Wichtig:</strong> Sprechen Sie ausschließlich auf Deutsch. Die Spracherkennung ist auf Deutsch eingestellt und funktioniert am besten mit deutschen Äußerungen.
        </p>
      </div>

      {/* Phase Instructions */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">Aktuelle Phase</h4>
        <p className="text-blue-700 text-sm">
          {phase === 'discussion' && 'Beginnen Sie das Gespräch. Stellen Sie sich vor und sprechen Sie über das Thema.'}
          {phase === 'disagreement' && 'Äußern Sie eine andere Meinung zu einem der Punkte. Verwenden Sie Redemittel der Meinungsäußerung.'}
          {phase === 'agreement' && 'Stimmen Sie einem Punkt zu. Verwenden Sie Redemittel der Zustimmung.'}
          {phase === 'conclusion' && 'Fassen Sie das Gespräch zusammen. Verwenden Sie Redemittel der Zusammenfassung.'}
        </p>
      </div>
    </div>
  );
}
