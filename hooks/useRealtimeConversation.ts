"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { RealtimeConversation, RealtimeMessage, RealtimeConversationState } from '@/lib/realtimeConversation';

export interface UseRealtimeConversationReturn {
  state: RealtimeConversationState;
  messages: RealtimeMessage[];
  startConversation: (topic: string, phase: string) => Promise<void>;
  stopConversation: () => void;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  isConnected: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
}

export function useRealtimeConversation(): UseRealtimeConversationReturn {
  const [state, setState] = useState<RealtimeConversationState>({
    isConnected: false,
    isRecording: false,
    isProcessing: false,
    messages: [],
    currentPhase: ''
  });
  
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const conversationRef = useRef<RealtimeConversation | null>(null);

  const handleStateChange = useCallback((newState: RealtimeConversationState) => {
    setState(newState);
  }, []);

  const handleMessage = useCallback((message: RealtimeMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    console.error('Realtime conversation error:', errorMessage);
  }, []);

  const startConversation = useCallback(async (topic: string, phase: string) => {
    try {
      setError(null);
      setMessages([]);

      // Get connection info from our secure API route
      const response = await fetch('/api/realtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_connection_info',
          topic,
          phase
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get connection info');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to get connection info');
      }

      conversationRef.current = new RealtimeConversation(
        handleStateChange,
        handleMessage,
        handleError
      );

      // Pass the connection info to the conversation class
      await conversationRef.current.connect(data.connectionInfo, topic, phase);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setError(error instanceof Error ? error.message : 'Failed to start conversation');
    }
  }, [handleStateChange, handleMessage, handleError]);

  const stopConversation = useCallback(() => {
    if (conversationRef.current) {
      conversationRef.current.disconnect();
      conversationRef.current = null;
    }
    setState({
      isConnected: false,
      isRecording: false,
      isProcessing: false,
      messages: [],
      currentPhase: ''
    });
    setMessages([]);
  }, []);

  const startRecording = useCallback(async () => {
    if (conversationRef.current) {
      await conversationRef.current.startRecording();
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (conversationRef.current) {
      conversationRef.current.stopRecording();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        conversationRef.current.disconnect();
      }
    };
  }, []);

  return {
    state,
    messages,
    startConversation,
    stopConversation,
    startRecording,
    stopRecording,
    isConnected: state.isConnected,
    isRecording: state.isRecording,
    isProcessing: state.isProcessing,
    error
  };
}
