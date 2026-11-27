// Simple audio merging utility for combining user and AI audio
// In production, you would use a more sophisticated audio processing library

export interface AudioSegment {
  audioUrl: string;
  speaker: 'user' | 'ai';
  duration?: number;
}

export class AudioMerger {
  public static async fetchAudioAsBuffer(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.statusText}`);
    }
    return await response.arrayBuffer();
  }

  private static async createAudioElement(url: string): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audio.addEventListener('canplaythrough', () => resolve(audio));
      audio.addEventListener('error', reject);
      audio.load();
    });
  }

  private static async getAudioDuration(url: string): Promise<number> {
    const audio = await this.createAudioElement(url);
    return audio.duration;
  }

  // Simple concatenation approach - in production, use Web Audio API or FFmpeg
  static async mergeConversationAudio(segments: AudioSegment[]): Promise<string> {
    try {
      // For now, return a placeholder URL
      // In production, you would:
      // 1. Fetch all audio files
      // 2. Use Web Audio API to concatenate them
      // 3. Upload the combined audio to storage
      // 4. Return the URL
      
      console.log('Merging audio segments:', segments);
      
      // Placeholder implementation
      return '/uploads/combined_conversation_placeholder.mp3';
    } catch (error) {
      console.error('Error merging audio:', error);
      throw error;
    }
  }

  // Alternative: Create a playlist-style approach
  static createAudioPlaylist(segments: AudioSegment[]): AudioSegment[] {
    return segments.map(segment => ({
      ...segment,
      // Add metadata for playback
      metadata: {
        speaker: segment.speaker,
        timestamp: Date.now()
      }
    }));
  }

  // Get total duration of all segments
  static async getTotalDuration(segments: AudioSegment[]): Promise<number> {
    let totalDuration = 0;
    
    for (const segment of segments) {
      if (segment.duration) {
        totalDuration += segment.duration;
      } else {
        try {
          const duration = await this.getAudioDuration(segment.audioUrl);
          totalDuration += duration;
        } catch (error) {
          console.warn(`Could not get duration for ${segment.audioUrl}:`, error);
        }
      }
    }
    
    return totalDuration;
  }
}

// Web Audio API implementation for actual audio merging
export class WebAudioMerger {
  private audioContext: AudioContext;
  private audioBuffers: AudioBuffer[] = [];

  constructor() {
    this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }

  async loadAudioSegments(segments: AudioSegment[]): Promise<void> {
    for (const segment of segments) {
      try {
        const arrayBuffer = await AudioMerger.fetchAudioAsBuffer(segment.audioUrl);
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.audioBuffers.push(audioBuffer);
      } catch (error) {
        console.error(`Error loading audio segment ${segment.audioUrl}:`, error);
      }
    }
  }

  async mergeAudio(): Promise<Blob> {
    if (this.audioBuffers.length === 0) {
      throw new Error('No audio buffers loaded');
    }

    // Calculate total length
    const totalLength = this.audioBuffers.reduce((sum, buffer) => sum + buffer.length, 0);
    
    // Create output buffer
    const outputBuffer = this.audioContext.createBuffer(
      this.audioBuffers[0].numberOfChannels,
      totalLength,
      this.audioBuffers[0].sampleRate
    );

    // Copy audio data
    let offset = 0;
    for (const buffer of this.audioBuffers) {
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const outputData = outputBuffer.getChannelData(channel);
        const inputData = buffer.getChannelData(channel);
        outputData.set(inputData, offset);
      }
      offset += buffer.length;
    }

    // Convert to WAV blob
    return this.audioBufferToWav(outputBuffer);
  }

  private audioBufferToWav(buffer: AudioBuffer): Blob {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);

    // Convert audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }
}
