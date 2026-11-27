"use client";
import React, { useState, useRef, useCallback } from "react";
import { Mic, Square } from "lucide-react";

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, memoId: string) => void;
  disabled?: boolean;
  onStartRecording?: () => void;
}

export default function AudioRecorder({ onRecordingComplete, disabled = false, onStartRecording }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRecordingComplete = useCallback(async (audioBlob: Blob) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      
      const response = await fetch('/api/memos', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', response.status, errorText);
        throw new Error(`Failed to save audio memo: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("Audio memo saved:", result);
      
      // Call the parent component's callback with both blob and memoId
      onRecordingComplete(audioBlob, result.memoId);
      
    } catch (error) {
      console.error('Error saving audio memo:', error);
      alert('Failed to save recording. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [onRecordingComplete]);

  const startRecording = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true, 
          noiseSuppression: true, 
          sampleRate: 44100
        } 
      });
      
      // Clear previous chunks
      chunksRef.current = [];

      const options = {
        mimeType: "audio/webm;codecs=opus"
      };
      let mediaRecorder: MediaRecorder;

      if (MediaRecorder.isTypeSupported(options.mimeType)) {
        mediaRecorder = new MediaRecorder(stream, options);
      } else {
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;
      
      console.log("Recording with format:", mediaRecorder.mimeType);
      
      mediaRecorder.ondataavailable = (event) => {
        console.log("Data available:", event.data.size, "bytes");
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("Recording stopped, chunks:", chunksRef.current.length);
        const mimeType = mediaRecorder.mimeType || "audio/webm";
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        console.log("Final blob size:", audioBlob.size);
        
        if (audioBlob.size > 0) {
          await handleRecordingComplete(audioBlob);
        } else {
          alert('Recording failed - no audio data captured');
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Request data every 1 second
      setIsRecording(true);
      setRecordingTime(0);
      
      // Call the onStartRecording callback if provided
      if (onStartRecording) {
        onStartRecording();
      }

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error: unknown) {
      console.error('Error accessing microphone:', error);
      const err = error as Error;
      if (err.name === 'NotAllowedError') {
        alert('Microphone access was denied. Please allow microphone access and try again.');
      } else if (err.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.');
      } else if (err.name === 'NotSupportedError') {
        alert('Microphone access is not supported in your browser.');
      } else {
        alert('Could not access microphone. Please ensure you have granted permission and try again.');
      }
    }
  }, [handleRecordingComplete, onStartRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log("Stopping recording...");
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="text-center">
      <div className="mb-4">
        <div className="text-4xl font-mono font-bold text-blue-600 mb-4">
          {formatTime(recordingTime)}
        </div>
        <div className="flex justify-center gap-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={disabled}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white p-4 rounded-full transition-colors"
            >
              <Mic className="w-8 h-8" />
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full transition-colors"
            >
              <Square className="w-8 h-8" />
            </button>
          )}
        </div>
      </div>
      
      {isUploading && (
        <div className="text-sm text-blue-600">
          Saving recording...
        </div>
      )}
    </div>
  );
}