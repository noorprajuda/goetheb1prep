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

export class RealtimeWebRTC {
  private pc: RTCPeerConnection | null = null;
  private stream: MediaStream | null = null;
  private onStateChange: (state: RealtimeConversationState) => void;
  private onMessage: (message: RealtimeMessage) => void;
  private onError: (error: string) => void;
  private onAIAudio: ((audioUrl: string) => void) | null = null;
  private ephemeralKey: string | null = null;
  private sessionId: string | null = null;
  private isConnecting: boolean = false;

  constructor(
    onStateChange: (state: RealtimeConversationState) => void,
    onMessage: (message: RealtimeMessage) => void,
    onError: (error: string) => void,
    onAIAudio?: (audioUrl: string) => void
  ) {
    this.onStateChange = onStateChange;
    this.onMessage = onMessage;
    this.onError = onError;
    this.onAIAudio = onAIAudio || null;
  }

  async connect() {
    try {
      // Prevent multiple simultaneous connections
      if (this.isConnecting) {
        console.log('Connection already in progress, skipping...');
        return;
      }

      if (this.ephemeralKey && this.sessionId) {
        console.log('Already connected, skipping session creation');
        return;
      }

      this.isConnecting = true;
      console.log('Initializing Realtime WebRTC connection...');
      
      // Get ephemeral session key from our API
      const sessionResponse = await fetch('/api/realtime/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to create ephemeral session');
      }

      const sessionData = await sessionResponse.json();
      if (!sessionData.success) {
        throw new Error(sessionData.error || 'Failed to create session');
      }

      this.ephemeralKey = sessionData.session.client_secret;
      this.sessionId = sessionData.session.id;
      console.log('Ephemeral session created:', sessionData.session.id);

      // Create WebRTC peer connection
      this.pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      // Set up WebRTC event handlers
      this.setupWebRTCEvents();

      // Get microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      });

      // Add audio tracks to peer connection
      this.stream.getTracks().forEach(track => {
        this.pc!.addTrack(track, this.stream!);
      });

      // Create and send offer
      await this.createOffer();

      this.updateState({ isConnected: true, isRecording: false, isProcessing: false });
      this.isConnecting = false;

    } catch (error) {
      console.error('Failed to connect:', error);
      this.onError(error instanceof Error ? error.message : 'Failed to connect to Realtime API');
      this.isConnecting = false;
    }
  }

  private setupWebRTCEvents() {
    if (!this.pc) return;

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE candidate:', event.candidate);
      }
    };

    this.pc.ontrack = (event) => {
      console.log('Received remote track:', event.track);
      // Handle incoming audio from AI
      if (event.track.kind === 'audio') {
        const audio = new Audio();
        audio.srcObject = event.streams[0];
        audio.autoplay = true;
      }
    };

    this.pc.onconnectionstatechange = () => {
      console.log('Connection state:', this.pc?.connectionState);
      if (this.pc?.connectionState === 'connected') {
        console.log('WebRTC connection established');
        this.updateState({ isConnected: true });
      } else if (this.pc?.connectionState === 'failed') {
        this.onError('WebRTC connection failed');
      }
    };

    this.pc.ondatachannel = (event) => {
      const channel = event.channel;
      channel.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleRealtimeMessage(data);
        } catch (error) {
          console.error('Failed to parse data channel message:', error);
        }
      };
    };
  }

  private async createOffer() {
    if (!this.pc || !this.ephemeralKey) return;

    try {
      // Create offer
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // Send SDP offer to OpenAI Realtime API with ephemeral key
      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = 'gpt-4o-realtime-preview';

      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          'Authorization': `Bearer ${this.ephemeralKey}`,
          'Content-Type': 'application/sdp',
        },
      });

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        throw new Error(`SDP offer failed: ${sdpResponse.status} ${errorText}`);
      }

      const answerSDP = await sdpResponse.text();
      await this.pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSDP,
      });

      console.log('WebRTC offer/answer exchange completed');

    } catch (error) {
      console.error('Failed to create offer:', error);
      this.onError('Failed to establish WebRTC connection');
    }
  }


  private handleRealtimeMessage(data: Record<string, unknown>) {
    try {
      console.log('Received Realtime message:', data);
      console.log('Message type:', data.type);
      console.log('Full message structure:', JSON.stringify(data, null, 2));

      switch (data.type) {
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

      case 'response.done':
        console.log('Response completed');
        this.updateState({ isProcessing: false });
        break;

      case 'error':
        try {
          console.error('Realtime API Error:', data);
          console.error('Error details:', JSON.stringify(data, null, 2));
          
          // Handle different error structures
          let errorMessage = 'Unknown error';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((data.error as any)?.message) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            errorMessage = (data.error as any).message;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } else if ((data as any).message) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            errorMessage = (data as any).message;
          } else if (data.error) {
            errorMessage = JSON.stringify(data.error);
          } else if (typeof data === 'string') {
            errorMessage = data;
          }
          
          this.onError(errorMessage);
        } catch (error) {
          console.error('Error in error handling:', error);
          this.onError('Failed to process error message');
        }
        break;

      default:
        console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error in handleRealtimeMessage:', error);
      console.error('Problematic data:', data);
      this.onError('Failed to process realtime message');
    }
  }

  async startRecording() {
    if (!this.pc || !this.stream) {
      throw new Error('Not connected to Realtime API');
    }

    this.updateState({ isRecording: true, isProcessing: false });
    console.log('Recording started');
  }

  stopRecording() {
    this.updateState({ isRecording: false });
    console.log('Recording stopped');
  }

  private updateState(updates: Partial<RealtimeConversationState>) {
    this.onStateChange({
      isConnected: this.pc?.connectionState === 'connected',
      isRecording: this.stream !== null,
      isProcessing: false,
      messages: [],
      currentPhase: '',
      ...updates
    });
  }

  // Method to capture AI audio for session recording
  captureAIAudio(audioBlob: Blob) {
    if (this.onAIAudio) {
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log('Capturing AI audio for WebRTC session:', audioUrl);
      this.onAIAudio(audioUrl);
    }
  }

  disconnect() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    // Reset connection state
    this.isConnecting = false;
    this.ephemeralKey = null;
    this.sessionId = null;

    this.updateState({
      isConnected: false,
      isRecording: false,
      isProcessing: false,
      messages: [],
      currentPhase: ''
    });
  }
}
