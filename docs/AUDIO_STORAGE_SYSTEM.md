# Audio Storage System

This document describes the audio storage system implemented to optimize audio generation and reduce API costs for the Teil 3 speaking test page.

## Overview

The audio storage system prevents duplicate API calls to OpenAI's TTS service by:

1. Storing generated audio files in MongoDB
2. Checking for existing audio before generating new ones
3. Serving cached audio files directly from the database
4. Automatically cleaning up expired audio files

## Architecture

### Components

1. **Audio Storage API** (`/api/audio-storage`)

   - Stores audio files in MongoDB
   - Checks for existing audio before generating new ones
   - Returns audio URLs for playback and download

2. **Audio Playback API** (`/api/audio-storage/play/[audioId]`)

   - Serves audio files directly from MongoDB
   - Handles audio streaming and caching headers
   - Manages audio expiration

3. **Audio Storage Hook** (`hooks/useAudioStorage.ts`)

   - React hook for managing audio generation and storage
   - Handles caching logic and error management
   - Provides consistent interface for audio operations

4. **Cleanup Scripts**
   - `scripts/cleanup-expired-audio.js`: Removes expired audio files
   - `scripts/setup-audio-cleanup-cron.js`: Sets up daily cleanup cron job

## Database Schema

### Audio Storage Collection

```javascript
{
  _id: ObjectId,
  content: string,           // The text that was converted to audio
  contentType: string,       // 'transcript' | 'corrected' | 'presentation' | 'model_answer'
  audioUrl: string,          // URL for serving the audio file
  audioBlob: Buffer,         // The actual audio file data
  mimeType: string,          // MIME type of the audio file
  createdAt: Date,           // When the audio was created
  expiresAt: Date            // When the audio should be deleted (7 days)
}
```

## Usage

### In React Components

```typescript
import { useAudioStorage } from "@/hooks/useAudioStorage";

const MyComponent = () => {
  const audioStorage = useAudioStorage();

  const handlePlayAudio = async () => {
    const result = await audioStorage.generateAndStoreAudio(
      "Hello world",
      "transcript"
    );

    if (result.audioUrl) {
      const audio = new Audio(result.audioUrl);
      await audio.play();
    }
  };

  return <button onClick={handlePlayAudio}>Play Audio</button>;
};
```

### API Endpoints

#### Store Audio

```http
POST /api/audio-storage
Content-Type: application/json

{
  "content": "Text to convert to audio",
  "contentType": "transcript",
  "audioBlob": "base64-encoded-audio-data",
  "mimeType": "audio/mpeg"
}
```

#### Retrieve Audio

```http
GET /api/audio-storage?audioId=audio-id
```

#### Play Audio

```http
GET /api/audio-storage/play/audio-id
```

## Benefits

1. **Cost Reduction**: Eliminates duplicate API calls to OpenAI TTS
2. **Performance**: Faster audio playback using cached files
3. **Reliability**: Fallback to browser TTS if storage fails
4. **Scalability**: Handles multiple users without API rate limits
5. **Maintenance**: Automatic cleanup of expired files

## Configuration

### Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `OPENAI_API_KEY`: OpenAI API key for TTS generation

### Audio Expiration

Audio files expire after 7 days by default. This can be configured in the storage API:

```typescript
expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
```

## Maintenance

### Manual Cleanup

```bash
node scripts/cleanup-expired-audio.js
```

### Automated Cleanup

The system includes a cron job that runs daily at 2 AM to clean up expired audio files.

## Error Handling

The system includes comprehensive error handling:

1. **API Failures**: Falls back to browser TTS
2. **Storage Failures**: Logs errors and continues with fallback
3. **Network Issues**: Retries with exponential backoff
4. **Expired Audio**: Automatically regenerates when needed

## Monitoring

Monitor the system by checking:

1. **MongoDB Collection Size**: `audio_storage` collection
2. **API Response Times**: Audio generation and retrieval
3. **Error Logs**: Failed audio generation or storage
4. **Cache Hit Rate**: Percentage of cached vs new audio generation

## Future Improvements

1. **CDN Integration**: Serve audio from CDN for better performance
2. **Compression**: Compress audio files to reduce storage size
3. **Analytics**: Track audio usage and popular content
4. **Multi-language Support**: Store audio in different languages
5. **Voice Selection**: Allow users to choose different voices
