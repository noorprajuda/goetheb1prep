# Real-Time Conversation Setup for Teil 1

## Overview

This document explains how to set up the real-time conversation feature for Teil 1, which provides a ChatGPT-like voice conversation experience using OpenAI's Realtime API.

## Features

- 🎙️ **Real-time voice conversation** - Talk naturally with the AI
- 🔄 **Live streaming** - Both text and voice responses in real-time
- 🎯 **Natural interaction** - Interrupt, overlap, and converse like humans
- 📱 **ChatGPT-like experience** - Similar to the ChatGPT iOS app
- 🇩🇪 **German language focus** - Optimized for B1 Goethe exam practice

## Current Implementation

### Phase 1: Simulation Mode (Current)

The current implementation includes a simulation mode that demonstrates the UI and flow without requiring the actual OpenAI Realtime API setup.

**Features:**

- ✅ Mode toggle between traditional recording and real-time conversation
- ✅ Real-time conversation UI with live message display
- ✅ Simulated AI responses for testing
- ✅ Phase progression (Discussion → Disagreement → Agreement → Conclusion)
- ✅ Microphone permission handling

### Phase 2: Production Setup (Current)

The real-time conversation now uses the actual OpenAI Realtime API! Here's how to set it up:

1. **Get OpenAI Realtime API Access**

   - Apply for OpenAI Realtime API access
   - Wait for approval (currently in limited beta)
   - See detailed setup guide: [OPENAI_REALTIME_SETUP.md](./OPENAI_REALTIME_SETUP.md)

2. **Update Environment Variables**

   ```bash
   # Add to .env.local
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Real WebSocket Connection**
   - The implementation now uses actual WebSocket connections
   - API keys are securely handled server-side
   - No client-side API key exposure

## File Structure

```
lib/
├── realtimeConversation.ts          # Core real-time conversation logic
hooks/
├── useRealtimeConversation.ts       # React hook for state management
components/
├── RealtimeConversation.tsx         # UI component for real-time chat
app/teil1/
├── page.tsx                         # Updated with mode toggle
```

## Usage

### 1. Enable Real-time Mode

- Toggle the "Gesprächsmodus" switch in Teil 1
- Select "Echtzeit-Gespräch wie ChatGPT (empfohlen)"

### 2. Start Conversation

- Click the microphone button to start recording
- Speak naturally - the AI will respond in real-time
- The conversation flows through different phases automatically

### 3. Phase Progression

- **Discussion**: Initial conversation about the topic
- **Disagreement**: Express different opinions
- **Agreement**: Find common ground
- **Conclusion**: Summarize the discussion

## Technical Details

### WebSocket Connection

```typescript
// Real-time API connection (secure server-side)
const ws = new WebSocket(connectionInfo.url, {
  headers: connectionInfo.headers,
});

// Connection info obtained from secure API route
const response = await fetch("/api/realtime", {
  method: "POST",
  body: JSON.stringify({
    action: "get_connection_info",
    topic,
    phase,
  }),
});
```

### Audio Processing

- **Sample Rate**: 16kHz (optimized for speech)
- **Echo Cancellation**: Enabled
- **Noise Suppression**: Enabled
- **Format**: PCM audio data

### Message Flow

1. User speaks → Audio captured
2. Audio sent to OpenAI Realtime API
3. AI processes and responds
4. Response streamed back as text + voice
5. UI updates in real-time

## Benefits

### For Students

- **Natural Practice**: Feels like talking to a real person
- **Immediate Feedback**: Get responses instantly
- **Realistic Experience**: Mimics actual exam conditions
- **Engaging**: More interactive than traditional recording

### For Learning

- **Fluency Development**: Practice natural conversation flow
- **Confidence Building**: Get comfortable with speaking
- **Error Correction**: Learn from AI responses
- **Redemittel Practice**: Use authentic German expressions

## Future Enhancements

1. **Voice Synthesis**: Add AI voice responses
2. **Interruption Handling**: Allow natural conversation flow
3. **Emotion Detection**: Analyze speaking confidence
4. **Advanced Scoring**: Real-time performance feedback
5. **Multi-language Support**: Extend to other languages

## Troubleshooting

### Common Issues

1. **Microphone Permission Denied**

   - Ensure browser has microphone access
   - Check browser settings
   - Try refreshing the page

2. **Connection Failed**

   - Verify OpenAI API key
   - Check internet connection
   - Ensure API access is approved

3. **Audio Quality Issues**
   - Use a good microphone
   - Ensure quiet environment
   - Check browser audio settings

### Debug Mode

Enable console logging to debug issues:

```typescript
console.log("Realtime conversation state:", state);
console.log("Messages:", messages);
console.log("Error:", error);
```

## Security Considerations

- **API Key Protection**: Never expose API keys in client-side code
- **Audio Privacy**: Audio is processed by OpenAI (review their privacy policy)
- **Data Storage**: Conversation data is stored locally
- **HTTPS Required**: Real-time features require secure connections

## Performance Optimization

- **Audio Buffering**: Optimize audio chunk sizes
- **Connection Pooling**: Reuse WebSocket connections
- **Memory Management**: Clean up audio resources
- **Error Recovery**: Handle connection drops gracefully

## Conclusion

The real-time conversation feature provides a revolutionary way to practice German speaking skills, making the learning experience more engaging and natural. While the current implementation includes simulation mode for testing, the full production setup will require OpenAI Realtime API access.

This feature represents the future of language learning - combining AI technology with natural human conversation patterns to create an immersive, effective learning experience.
