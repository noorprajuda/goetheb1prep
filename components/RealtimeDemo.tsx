"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, MessageSquare, User, Bot, Download } from 'lucide-react';
// Removed RealtimeWebRTC import - using fallback mode directly
import { StreamingChat } from '@/lib/streamingChat';

export default function RealtimeDemo() {
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<Array<{type: 'user' | 'assistant', content: string, timestamp: number}>>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  // Removed realtimeConnection - using fallback mode directly
  const [streamingChat, setStreamingChat] = useState<StreamingChat | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const isInitializedRef = useRef(false);

  // Audio recording states
  const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null);
  const [aiAudioUrl, setAiAudioUrl] = useState<string | null>(null);
  const [mergedAudioUrl, setMergedAudioUrl] = useState<string | null>(null);
  // Audio recording states removed
  
  // Session recording states - removed unused states
  
  // Audio recording refs
  const userRecorderRef = useRef<MediaRecorder | null>(null);
  const aiRecorderRef = useRef<MediaRecorder | null>(null);
  const userChunksRef = useRef<Blob[]>([]);
  const aiChunksRef = useRef<Blob[]>([]);
  const mergedAudioRef = useRef<HTMLAudioElement | null>(null);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const initializeFallback = useCallback(async () => {
    try {
      console.log('Initializing fallback streaming chat...');
      
      const chat = new StreamingChat(
        (state) => {
          setIsConnected(state.isConnected);
          setIsRecording(state.isRecording);
          setIsProcessing(state.isProcessing);
        },
        (message) => {
          setMessages(prev => [...prev, {
            type: message.type,
            content: message.content,
            timestamp: message.timestamp
          }]);
        },
        (errorMessage) => {
          setError(errorMessage);
        },
        (aiAudioUrl) => {
          console.log('AI audio URL received:', aiAudioUrl);
          setAiAudioUrl(aiAudioUrl);
          
          // Add AI audio to session recording
          // Convert URL to blob and store for session
          fetch(aiAudioUrl)
            .then(response => response.blob())
            .then(blob => {
              console.log('AI audio blob created, size:', blob.size);
              addAIAudioToSession(blob);
            })
            .catch(error => {
              console.error('Failed to convert AI audio URL to blob:', error);
            });
        }
      );

      setStreamingChat(chat);
      setUseFallback(true);
      setError(null); // Clear any previous errors
      
      console.log('StreamingChat initialized successfully');
      await chat.connect('Krankenhausbesuch', 'discussion');
      
    } catch (error) {
      console.error('Failed to initialize fallback:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize fallback');
    }
  }, []);

  // Removed initializeConnection - using fallback mode directly for better AI audio capture

  // Initialize connection on component mount (only once)
  useEffect(() => {
    if (!isInitializedRef.current) {
      console.log('Initializing with fallback mode for better AI audio capture');
      initializeFallback();
      isInitializedRef.current = true;
    }
    
    return () => {
      // Session recording removed
      
      if (streamingChat) {
        streamingChat.disconnect();
      }
    };
  }, [initializeFallback, streamingChat]);

  const handleStartRecording = async () => {
    try {
      setError(null);
      setRecordingTime(0);
      
      if (streamingChat) {
        await streamingChat.startRecording();
      } else {
        throw new Error('Not connected to chat service');
      }

      setIsRecording(true);

    } catch (error) {
      console.error('Failed to start recording:', error);
      setError('Failed to start recording. Please check microphone permissions.');
    }
  };

  const handleStopRecording = async () => {
    if (streamingChat) {
      streamingChat.stopRecording();
    }
    setIsRecording(false);

    // Session recording removed
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const clearConversation = () => {
    setMessages([]);
    setRecordingTime(0);
    setError(null);
    clearAudioRecordings();
  };

  // Audio recording functions
  // Removed startAudioRecording - handled by StreamingChat internally

  // Removed setupAIAudioRecording - AI audio is handled by streaming chat

  // Removed stopAudioRecording - handled by StreamingChat internally

  // Audio recording functions removed

  // Session recording functions - removed

  // Store AI audio chunks for session recording
  const sessionAIAudioChunks = useRef<Blob[]>([]);

  const addAIAudioToSession = (aiAudioBlob: Blob) => {
    try {
      if (aiAudioBlob) {
        // Store AI audio for later merging
        sessionAIAudioChunks.current.push(aiAudioBlob);
        console.log('AI audio stored for session recording, total chunks:', sessionAIAudioChunks.current.length);
      }
    } catch (error) {
      console.error('Failed to store AI audio for session:', error);
    }
  };

  // Session recording functions removed

  // Session recording functions removed

  // Session recording functions removed

  // Session recording functions removed

  const clearAudioRecordings = () => {
    // Clean up URLs
    if (userAudioUrl) URL.revokeObjectURL(userAudioUrl);
    if (aiAudioUrl) URL.revokeObjectURL(aiAudioUrl);
    if (mergedAudioUrl) URL.revokeObjectURL(mergedAudioUrl);

    // Reset states
    setUserAudioUrl(null);
    setAiAudioUrl(null);
    setMergedAudioUrl(null);

    // Clean up refs
    userChunksRef.current = [];
    aiChunksRef.current = [];
    userRecorderRef.current = null;
    aiRecorderRef.current = null;
    mergedAudioRef.current = null;
  };

  const downloadDialogue = () => {
    if (messages.length === 0) {
      setError('No conversation to download');
      return;
    }

    // Format messages as dialogue
    const dialogueText = messages.map(message => {
      const speaker = message.type === 'user' ? 'Sie' : 'KI-Partner';
      return `${speaker}:\n${message.content}\n`;
    }).join('\n');

    // Create and download file
    const blob = new Blob([dialogueText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `goethe-b1-gespraech-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyDialogue = async () => {
    if (messages.length === 0) {
      setError('No conversation to copy');
      return;
    }

    // Format messages as dialogue
    const dialogueText = messages.map(message => {
      const speaker = message.type === 'user' ? 'Sie' : 'KI-Partner';
      return `${speaker}:\n${message.content}\n`;
    }).join('\n');

    try {
      await navigator.clipboard.writeText(dialogueText);
      setError(null);
      setCopySuccess(true);
      // Hide success message after 2 seconds
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      setError('Failed to copy to clipboard');
      console.error('Copy to clipboard failed:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          🎙️ Real-Time Conversation Demo
        </h1>
        <p className="text-slate-600 text-lg">
          Experience natural voice conversation like ChatGPT
        </p>
        {useFallback && (
          <div className="mt-3 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm inline-block">
            Using Fallback Mode (OpenAI Realtime API not available)
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="text-red-600">⚠️</div>
            <div>
              <h4 className="font-semibold text-red-800 mb-1">Connection Error</h4>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {copySuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="text-green-600">✅</div>
            <div>
              <h4 className="font-semibold text-green-800 mb-1">Copied!</h4>
              <p className="text-green-700 text-sm">Conversation text copied to clipboard</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading Spinner - Show when not connected */}
      {!isConnected && !error && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600 text-lg">Establishing connection to OpenAI Realtime API...</p>
          <p className="text-slate-500 text-sm mt-2">Please wait while we set up your voice conversation</p>
        </div>
      )}

      {/* Live Conversation - Only show when connected */}
      {isConnected && (
        <>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Live Conversation
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={copyDialogue}
                  className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-300 rounded-lg hover:bg-blue-50 flex items-center gap-1"
                  title="Copy conversation to clipboard"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </button>
                <button
                  onClick={clearConversation}
                  className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear Conversation
                </button>
              </div>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {/* Messages */}
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Start a conversation by clicking the microphone button below</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md p-3 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-blue-100 text-blue-900' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {message.type === 'user' ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">
                          {message.type === 'user' ? 'Sie' : 'KI-Partner'}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))
              )}

              {/* Download Dialogue Button */}
              {messages.length > 0 && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={downloadDialogue}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    title="Download Conversation Text"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Gespräch</span>
                  </button>
                </div>
              )}

              {/* AI Processing Indicator */}
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
                {formatTime(recordingTime)}
              </div>
              <p className="text-slate-600">
                {isRecording 
                  ? 'Sprechen Sie natürlich...' 
                  : isConnected 
                    ? 'Klicken Sie auf das Mikrofon, um zu sprechen'
                    : 'Warten Sie auf die Verbindung...'}
              </p>
            </div>

            <div className="flex justify-center">
              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  disabled={!isConnected}
                  className={`p-4 rounded-full transition-colors ${
                    isConnected 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}
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
        </>
      )}



    </div>
  );
}