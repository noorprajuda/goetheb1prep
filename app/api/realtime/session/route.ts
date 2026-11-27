import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { topic, level } = await request.json();
    
    // Create ephemeral session key
    const sessionResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime=v1'
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-10-01',
        voice: 'alloy',
        instructions: `Du bist ein freundlicher deutscher Gesprächspartner. Sprich nur auf Deutsch. 
        Das heutige Thema ist: ${topic}.
        Führe ein natürliches Gespräch auf ${level}-Niveau.
        Stelle Fragen, zeige Interesse und hilf beim Lernen.
        Sei geduldig und ermutigend.`,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8
        }
      })
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${sessionResponse.status}`);
    }

    const sessionData = await sessionResponse.json();
    
    return NextResponse.json({
      session_id: sessionData.id,
      expires_at: sessionData.expires_at
    });

  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}