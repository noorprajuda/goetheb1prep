import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'get_connection_info') {
      // Return connection information for the client to establish WebSocket connection
      // For OpenAI Realtime API, we need to pass the token as a query parameter
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: 'OpenAI API key not found' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        connectionInfo: {
          url: `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`,
          apiKey: apiKey,
          // We'll send the API key in the first message after connection
        }
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Realtime API error:', error);
    return NextResponse.json(
      { error: 'Failed to process realtime request' },
      { status: 500 }
    );
  }
}
