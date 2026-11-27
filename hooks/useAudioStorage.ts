import { useState, useCallback } from 'react';

interface AudioStorageResult {
  audioId: string | null;
  audioUrl: string | null;
  cached: boolean;
  loading: boolean;
  error: string | null;
}

interface AudioStorageHook {
  generateAndStoreAudio: (content: string, contentType: 'transcript' | 'corrected' | 'presentation' | 'model_answer') => Promise<AudioStorageResult>;
  getStoredAudio: (audioId: string) => Promise<AudioStorageResult>;
  clearError: () => void;
}

export const useAudioStorage = (): AudioStorageHook => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const generateAndStoreAudio = useCallback(async (
    content: string, 
    contentType: 'transcript' | 'corrected' | 'presentation' | 'model_answer'
  ): Promise<AudioStorageResult> => {
    setLoading(true);
    setError(null);

    try {
      // First, check if audio already exists
      const checkResponse = await fetch('/api/audio-storage', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, contentType })
      });

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        setLoading(false);
        return {
          audioId: checkData.audioId,
          audioUrl: checkData.audioUrl,
          cached: true,
          loading: false,
          error: null
        };
      }

      // Generate new audio using TTS API with appropriate voice
      const voice = contentType === 'presentation' ? 'shimmer' : 'alloy';
      const ttsResponse = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: content,
          voice: voice
        })
      });

      if (!ttsResponse.ok) {
        throw new Error('Failed to generate audio');
      }

      const audioBlob = await ttsResponse.blob();
      
      // Convert blob to base64 for storage
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Store audio in database
      const storageResponse = await fetch('/api/audio-storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          contentType,
          audioBlob: base64Audio,
          mimeType: audioBlob.type || 'audio/mpeg'
        })
      });

      if (!storageResponse.ok) {
        throw new Error('Failed to store audio');
      }

      const storageData = await storageResponse.json();
      
      setLoading(false);
      return {
        audioId: storageData.audioId,
        audioUrl: storageData.audioUrl,
        cached: false,
        loading: false,
        error: null
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setLoading(false);
      return {
        audioId: null,
        audioUrl: null,
        cached: false,
        loading: false,
        error: errorMessage
      };
    }
  }, []);

  const getStoredAudio = useCallback(async (audioId: string): Promise<AudioStorageResult> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/audio-storage?audioId=${audioId}`);
      
      if (!response.ok) {
        throw new Error('Failed to retrieve audio');
      }

      const data = await response.json();
      
      setLoading(false);
      return {
        audioId,
        audioUrl: data.audioUrl,
        cached: true,
        loading: false,
        error: null
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setLoading(false);
      return {
        audioId: null,
        audioUrl: null,
        cached: false,
        loading: false,
        error: errorMessage
      };
    }
  }, []);

  return {
    generateAndStoreAudio,
    getStoredAudio,
    clearError
  };
};
