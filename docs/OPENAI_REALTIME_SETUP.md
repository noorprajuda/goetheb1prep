# OpenAI Realtime API Setup Guide

## Overview

This guide explains how to set up the OpenAI Realtime API for live voice conversations in Teil 1 of the speaking test application.

## Prerequisites

1. **OpenAI Account**: You need an active OpenAI account
2. **API Access**: Apply for OpenAI Realtime API access (currently in limited beta)
3. **Environment Variables**: Configure your API keys securely

## Step 1: Apply for OpenAI Realtime API Access

### 1.1 Check Availability

- Visit [OpenAI's Realtime API page](https://platform.openai.com/docs/guides/realtime)
- Check if the API is available in your region
- Review the current limitations and requirements

### 1.2 Submit Application

- Fill out the application form
- Provide details about your use case
- Wait for approval (this can take several days to weeks)

### 1.3 Verify Access

Once approved, you should see the Realtime API in your OpenAI dashboard.

## Step 2: Configure Environment Variables

### 2.1 Update .env.local

```bash
# Add your OpenAI API key
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Set specific model version
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview-2024-10-01
```

### 2.2 Verify Configuration

```bash
# Check if the API key is loaded
npm run dev
# Look for "API Key exists: true" in the console
```

## Step 3: Test the Connection

### 3.1 Start the Development Server

```bash
npm run dev
```

### 3.2 Test Real-time Mode

1. Navigate to `/speaking`
2. Click on "Teil 1"
3. Toggle "Echtzeit-Gespräch wie ChatGPT" mode
4. Click the microphone button
5. Speak in German

### 3.3 Check Console Logs

Look for these messages in the browser console:

```
Connecting to OpenAI Realtime API...
Realtime API connected
Setting up conversation for topic: ...
```

## Step 4: Troubleshooting

### Common Issues

#### 4.1 "Connection Failed"

**Symptoms**: WebSocket connection fails immediately
**Solutions**:

- Verify your API key is correct
- Check if you have Realtime API access
- Ensure your internet connection is stable
- Try refreshing the page

#### 4.2 "API Key not found"

**Symptoms**: Error message about missing API key
**Solutions**:

- Check your `.env.local` file
- Restart the development server
- Verify the environment variable name

#### 4.3 "Microphone Permission Denied"

**Symptoms**: Cannot access microphone
**Solutions**:

- Allow microphone access in browser
- Check browser permissions
- Try a different browser
- Ensure HTTPS connection (required for microphone access)

#### 4.4 "WebSocket Error"

**Symptoms**: Connection drops or errors
**Solutions**:

- Check network connectivity
- Verify API key permissions
- Check OpenAI service status
- Review rate limits

### Debug Mode

Enable detailed logging by opening browser console and looking for:

```javascript
// Connection status
console.log("Realtime API connected");

// Message handling
console.log("Received message:", data);

// Audio processing
console.log("Audio data processed");
```

## Step 5: Production Deployment

### 5.1 Environment Variables

Ensure your production environment has:

```bash
OPENAI_API_KEY=your_production_api_key
```

### 5.2 HTTPS Requirement

- Real-time features require HTTPS
- Configure SSL certificates
- Update WebSocket URLs if needed

### 5.3 Rate Limits

- Monitor API usage
- Implement rate limiting if needed
- Consider caching for repeated requests

## Step 6: Advanced Configuration

### 6.1 Custom System Prompts

Modify the system prompt in `lib/realtimeConversation.ts`:

```typescript
private getSystemPrompt(topic: string, phase: string): string {
  return `Your custom system prompt here...`;
}
```

### 6.2 Audio Quality Settings

Adjust audio processing in `startRecording()`:

```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 16000, // Adjust as needed
    channelCount: 1,
  },
});
```

### 6.3 Message Handling

Customize message processing in `handleMessage()`:

```typescript
private handleMessage(data: any) {
  // Add custom message handling logic
}
```

## Step 7: Monitoring and Analytics

### 7.1 Connection Monitoring

Track connection status and errors:

```typescript
// Add to your analytics
analytics.track("realtime_connection", {
  status: "connected",
  topic: topic,
  phase: phase,
});
```

### 7.2 Usage Metrics

Monitor API usage and costs:

- Check OpenAI dashboard for usage
- Set up billing alerts
- Track conversation duration

## Step 8: Security Considerations

### 8.1 API Key Protection

- Never expose API keys in client-side code
- Use server-side API routes for authentication
- Implement proper access controls

### 8.2 Audio Privacy

- Audio is processed by OpenAI
- Review OpenAI's privacy policy
- Consider data retention policies
- Implement user consent mechanisms

### 8.3 Rate Limiting

- Implement client-side rate limiting
- Monitor for abuse
- Set up alerts for unusual usage

## Step 9: Performance Optimization

### 9.1 Audio Processing

- Optimize audio chunk sizes
- Implement audio buffering
- Consider compression for large files

### 9.2 Connection Management

- Implement connection pooling
- Handle reconnection logic
- Optimize WebSocket usage

### 9.3 Memory Management

- Clean up audio resources
- Implement proper disposal
- Monitor memory usage

## Step 10: Testing

### 10.1 Unit Tests

```typescript
// Test connection logic
describe("RealtimeConversation", () => {
  it("should connect to OpenAI API", async () => {
    // Test implementation
  });
});
```

### 10.2 Integration Tests

- Test full conversation flow
- Verify audio processing
- Check message handling

### 10.3 User Testing

- Test with real users
- Gather feedback
- Monitor performance

## Conclusion

The OpenAI Realtime API provides a powerful way to create natural voice conversations. Follow this guide to set up and configure the API for your speaking test application.

For additional support:

- Check OpenAI's documentation
- Review the application logs
- Test with different browsers
- Monitor API status

Remember to keep your API keys secure and monitor usage to avoid unexpected costs.
