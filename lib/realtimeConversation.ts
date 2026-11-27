"use client";

export interface RealtimeMessage {
  type: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface RealtimeConversationState {
  isConnected: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  messages: RealtimeMessage[];
  currentPhase: string;
}

export class RealtimeConversation {
  private ws: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private onStateChange: (state: RealtimeConversationState) => void;
  private onMessage: (message: RealtimeMessage) => void;
  private onError: (error: string) => void;

  constructor(
    onStateChange: (state: RealtimeConversationState) => void,
    onMessage: (message: RealtimeMessage) => void,
    onError: (error: string) => void
  ) {
    this.onStateChange = onStateChange;
    this.onMessage = onMessage;
    this.onError = onError;
  }

  async connect(connectionInfo: { apiKey: string; baseUrl?: string }, topic: string, phase: string) {
    try {
      console.log('Connecting to OpenAI Realtime API...');
      
      // Create WebSocket connection to OpenAI Realtime API
      const wsUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Realtime API connected');
        this.setupConversation(topic, phase);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('Realtime API disconnected:', event.code, event.reason);
        this.updateState({ isConnected: false, isRecording: false, isProcessing: false });
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.onError('Connection failed to OpenAI Realtime API');
      };

    } catch (error) {
      console.error('Failed to connect:', error);
      this.onError('Failed to connect to realtime API');
    }
  }

  private setupConversation(topic: string, phase: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    console.log('Setting up conversation for topic:', topic, 'phase:', phase);

    // Set language to German for transcription
    this.ws.send(JSON.stringify({
      type: 'session.update',
      session: {
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1',
          language: 'de' // Force German language for transcription
        }
      }
    }));

    // Send system prompt
    const systemPrompt = this.getSystemPrompt(topic, phase);
    this.ws.send(JSON.stringify({
      type: 'conversation_initiation',
      conversation_initiation: {
        turn: 'assistant',
        turn_completion: {
          type: 'stop'
        }
      }
    }));

    // Send the system prompt
    this.ws.send(JSON.stringify({
      type: 'response.audio_transcript.delta',
      delta: {
        transcript: systemPrompt
      }
    }));

    // Initialize the conversation
    this.ws.send(JSON.stringify({
      type: 'conversation_initiation',
      conversation_initiation: {
        turn: 'user',
        turn_completion: {
          type: 'stop'
        }
      }
    }));

    this.updateState({ isConnected: true, isRecording: false, isProcessing: false });
  }

  private getSystemPrompt(topic: string, phase: string): string {
    return `Sie sind ein KI-Partner für den Goethe B1 Teil 1 Sprechtest. Sie führen ein natürliches Gespräch auf Deutsch.

Thema: ${topic}

Phase: ${phase}

WICHTIG: Dieses Gespräch muss ausschließlich auf Deutsch geführt werden. Sprechen Sie nur Deutsch und erwarten Sie, dass der Benutzer auch nur Deutsch spricht.

Ihre Aufgabe:
- Führen Sie ein natürliches, fließendes Gespräch AUSSCHLIESSLICH auf Deutsch
- Stellen Sie Fragen und reagieren Sie auf Antworten nur auf Deutsch
- Verwenden Sie natürliche deutsche Redemittel für Zustimmung, Ablehnung und Meinungsäußerung
- Sprechen Sie in einem natürlichen, freundlichen Ton auf Deutsch
- Lassen Sie Unterbrechungen und Überlappungen zu, wie in einem echten Gespräch
- Wenn der Benutzer in einer anderen Sprache spricht, bitten Sie höflich, auf Deutsch zu sprechen

Verwenden Sie kurze, natürliche deutsche Sätze. Sprechen Sie nicht zu schnell oder zu langsam.`;
  }

  private handleMessage(data: Record<string, unknown>) {
    console.log('Received message:', data);

    switch (data.type) {
      case 'conversation_initiation':
        console.log('Conversation initiated');
        this.updateState({ isProcessing: false });
        break;

      case 'response':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((data.response as any)?.type === 'content_block_delta') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const content = (data.response as any)?.delta?.content;
          if (content) {
            this.onMessage({
              type: 'assistant',
              content: content,
              timestamp: Date.now()
            });
          }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } else if ((data.response as any)?.type === 'content_block_done') {
          console.log('Assistant response completed');
          this.updateState({ isProcessing: false });
        }
        break;

      case 'response.audio_transcript.delta':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transcript = (data.delta as any)?.transcript;
        if (transcript) {
          this.onMessage({
            type: 'user',
            content: transcript,
            timestamp: Date.now()
          });
        }
        break;

      case 'response.audio_transcript.done':
        console.log('User transcript completed');
        break;

      case 'response.done':
        console.log('Response completed');
        this.updateState({ isProcessing: false });
        break;

      case 'error':
        console.error('API Error:', data.error);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.onError((data.error as any)?.message || 'Unknown error');
        break;

      case 'session.created':
        console.log('Session created');
        break;

      case 'session.updated':
        console.log('Session updated');
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  }

  async startRecording() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });

      this.audioContext = new AudioContext({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(this.stream);
      
      // Create a ScriptProcessorNode for real-time audio processing
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      source.connect(processor);
      processor.connect(this.audioContext.destination);

      processor.onaudioprocess = (event) => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const audioData = event.inputBuffer.getChannelData(0);
          const pcmData = this.convertToPCM(audioData);
          
          // Send audio data to OpenAI Realtime API
          this.ws.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: pcmData
          }));
        }
      };

      this.updateState({ isRecording: true, isProcessing: false });

    } catch (error) {
      console.error('Failed to start recording:', error);
      this.onError('Failed to start recording');
    }
  }

  stopRecording() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.updateState({ isRecording: false });

    // Commit the audio buffer to OpenAI Realtime API
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'input_audio_buffer.commit'
      }));
    }
  }

  private convertToPCM(audioData: Float32Array): string {
    // Convert Float32Array to base64 encoded PCM data
    const buffer = new ArrayBuffer(audioData.length * 2);
    const view = new DataView(buffer);
    
    for (let i = 0; i < audioData.length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      view.setInt16(i * 2, sample * 0x7FFF, true);
    }
    
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }

  private updateState(updates: Partial<RealtimeConversationState>) {
    this.onStateChange({
      isConnected: this.ws?.readyState === WebSocket.OPEN,
      isRecording: this.stream !== null,
      isProcessing: false,
      messages: [],
      currentPhase: '',
      ...updates
    });
  }

  disconnect() {
    this.stopRecording();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
