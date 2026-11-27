"use client";

export interface StreamingMessage {
  type: 'user' | 'assistant';
  content: string;
  timestamp: number;
  audioUrl?: string;
}

export interface StreamingChatState {
  isConnected: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  messages: StreamingMessage[];
  currentPhase: string;
}

export class StreamingChat {
  private onStateChange: (state: StreamingChatState) => void;
  private onMessage: (message: StreamingMessage) => void;
  private onError: (error: string) => void;
  private isRecording: boolean = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private aiAudioChunks: Blob[] = [];
  private onAIAudio: ((audioUrl: string) => void) | null = null;

  constructor(
    onStateChange: (state: StreamingChatState) => void,
    onMessage: (message: StreamingMessage) => void,
    onError: (error: string) => void,
    onAIAudio?: (audioUrl: string) => void
  ) {
    this.onStateChange = onStateChange;
    this.onMessage = onMessage;
    this.onError = onError;
    this.onAIAudio = onAIAudio || null;
  }

  async connect(topic: string, phase: string) {
    try {
      console.log('Initializing Streaming Chat...');
      
      // Simulate connection
      this.updateState({ 
        isConnected: true, 
        isRecording: false, 
        isProcessing: false,
        messages: [],
        currentPhase: phase
      });

      // Send initial AI message
      this.onMessage({
        type: 'assistant',
        content: 'Hallo! Schön, dass Sie hier sind. Lassen Sie uns über den Krankenhausbesuch sprechen. Wann möchten Sie Ihren Freund besuchen?',
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Failed to connect:', error);
      this.onError(error instanceof Error ? error.message : 'Failed to initialize streaming chat');
    }
  }

  async startRecording() {
    try {
      if (this.isRecording) {
        console.log('Already recording');
        return;
      }

      console.log('Starting audio recording...');
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      });

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.processAudio();
      };

      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;
      this.updateState({ isRecording: true, isProcessing: false });

    } catch (error) {
      console.error('Failed to start recording:', error);
      this.onError('Failed to start microphone. Please check permissions.');
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      console.log('Stopping audio recording...');
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.updateState({ isRecording: false, isProcessing: true });
    }
  }

  private async processAudio() {
    try {
      if (this.audioChunks.length === 0) {
        this.updateState({ isProcessing: false });
        return;
      }

      // Create audio blob
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      console.log('Audio chunks count:', this.audioChunks.length);
      console.log('Audio blob size:', audioBlob.size);
      console.log('Audio blob type:', audioBlob.type);
      this.audioChunks = [];

      if (audioBlob.size === 0) {
        console.error('Audio blob is empty, skipping transcription');
        this.updateState({ isProcessing: false });
        return;
      }

      // Create FormData
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');

      // Send to transcription API
      console.log('Sending audio for transcription, size:', audioBlob.size);
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Transcription failed:', response.status, errorText);
        throw new Error(`Transcription failed: ${response.status} - ${errorText}`);
      }

      const { text: transcription } = await response.json();
      
      if (transcription && transcription.trim()) {
        // Add user message
        this.onMessage({
          type: 'user',
          content: transcription,
          timestamp: Date.now()
        });

        // Generate AI response
        await this.generateAIResponse(transcription);
      } else {
        this.updateState({ isProcessing: false });
      }

    } catch (error) {
      console.error('Failed to process audio:', error);
      this.onError('Failed to process audio. Please try again.');
      this.updateState({ isProcessing: false });
    }
  }

  private async generateAIResponse(userInput: string) {
    try {
      console.log('Generating AI response for:', userInput);

      // Create conversation context
      const messages = [
        {
          role: 'system',
          content: 'Sie sind ein KI-Partner für den Goethe B1 Teil 1 Sprechtest. Sie führen ein natürliches Gespräch auf Deutsch über das Thema Krankenhausbesuch. Verwenden Sie kurze, natürliche Sätze und reagieren Sie auf die Antworten des Benutzers. Führen Sie ein Gespräch über: Besuch planen (Wann besuchen? Wie hinkommen? Was mitnehmen?) und Hilfe organisieren (Vom Krankenhaus abholen, Einkaufen helfen, Weitere Unterstützung).'
        },
        {
          role: 'user',
          content: userInput
        }
      ];

      // Call OpenAI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages })
      });

      if (!response.ok) {
        throw new Error('AI response failed');
      }

      const { content } = await response.json();
      
      if (content) {
        // Add AI message
        this.onMessage({
          type: 'assistant',
          content: content,
          timestamp: Date.now()
        });

        // Generate TTS audio for AI response
        await this.generateTTSAudio(content);
      }

      this.updateState({ isProcessing: false });

    } catch (error) {
      console.error('Failed to generate AI response:', error);
      this.onError('Failed to generate AI response. Please try again.');
      this.updateState({ isProcessing: false });
    }
  }

  private async generateTTSAudio(text: string) {
    try {
      console.log('Generating TTS audio for:', text);

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voice: 'alloy' })
      });

      if (!response.ok) {
        throw new Error('TTS generation failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Store AI audio for recording
      this.aiAudioChunks.push(audioBlob);
      
      // Notify parent component about AI audio
      if (this.onAIAudio) {
        console.log('Calling onAIAudio callback with URL:', audioUrl);
        this.onAIAudio(audioUrl);
      } else {
        console.log('No onAIAudio callback provided');
      }
      
      // Play the audio
      const audio = new Audio(audioUrl);
      audio.play();

    } catch (error) {
      console.error('Failed to generate TTS audio:', error);
      // Don't show error to user, just log it
    }
  }

  private updateState(updates: Partial<StreamingChatState>) {
    this.onStateChange({
      isConnected: true,
      isRecording: this.isRecording,
      isProcessing: false,
      messages: [],
      currentPhase: '',
      ...updates
    });
  }

  getAIAudioBlob(): Blob | null {
    if (this.aiAudioChunks.length === 0) return null;
    return new Blob(this.aiAudioChunks, { type: 'audio/webm' });
  }

  clearAIAudio() {
    this.aiAudioChunks = [];
  }

  disconnect() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
    
    this.isRecording = false;
    this.audioChunks = [];
    this.clearAIAudio();
    
    this.updateState({
      isConnected: false,
      isRecording: false,
      isProcessing: false,
      messages: [],
      currentPhase: ''
    });
  }
}
