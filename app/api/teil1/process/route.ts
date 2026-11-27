import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GridFSService } from '@/lib/gridfsService';

// Debug: Check if environment variable is loaded
console.log("Teil 1 API Environment check:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("API Key exists:", !!process.env.OPENAI_API_KEY);
console.log("API Key length:", process.env.OPENAI_API_KEY?.length || 0);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const TEIL1_TOPICS = {
  'krankenhaus_besuch': {
    title: 'Krankenhausbesuch planen',
    description: 'Ein Teilnehmer aus dem Deutschkurs hatte einen Unfall und liegt im Krankenhaus. Planen Sie gemeinsam einen Besuch.',
    instructions: 'Planen Sie gemeinsam einen Krankenhausbesuch und überlegen Sie, wie Sie den verletzten Teilnehmer unterstützen können.',
    planningPoints: [
      'Ein Teilnehmer aus dem Deutschkurs hatte einen Unfall und liegt im Krankenhaus.',
      'Diese Woche möchten Sie ihn besuchen und ein Geschenk von der ganzen Gruppe mitbringen.',
      'Nächste Woche kann er das Krankenhaus verlassen.',
      'Da er allein lebt, wird er Hilfe brauchen.',
      'Überlegen Sie, wie Sie ihn unterstützen können.'
    ]
  },
  'geburtstag_party': {
    title: 'Geburtstagsparty organisieren',
    description: 'Ein Freund hat bald Geburtstag. Planen Sie gemeinsam eine Überraschungsparty.',
    instructions: 'Planen Sie gemeinsam eine Überraschungsparty für einen Freund aus der Gruppe.',
    planningPoints: [
      'Ein Freund aus der Gruppe hat nächste Woche Geburtstag.',
      'Sie möchten eine Überraschungsparty für ihn organisieren.',
      'Der Freund weiß noch nichts von der Party.',
      'Sie müssen alles heimlich planen.',
      'Überlegen Sie, wie Sie die Party organisieren können.'
    ]
  },
  'studienreise': {
    title: 'Studienreise planen',
    description: 'Planen Sie gemeinsam eine Studienreise für den Deutschkurs.',
    instructions: 'Planen Sie gemeinsam eine Studienreise nach Deutschland für den Deutschkurs.',
    planningPoints: [
      'Der Deutschkurs möchte eine Studienreise nach Deutschland machen.',
      'Sie müssen das Ziel, die Unterkunft und das Programm planen.',
      'Das Budget ist begrenzt.',
      'Alle Teilnehmer haben verschiedene Interessen.',
      'Überlegen Sie, wie Sie die Reise organisieren können.'
    ]
  },
  'projekt_arbeit': {
    title: 'Projektarbeit koordinieren',
    description: 'Planen Sie gemeinsam eine Projektarbeit für den Deutschkurs.',
    instructions: 'Planen Sie gemeinsam eine Projektarbeit zum Thema "Deutsche Kultur in meinem Land".',
    planningPoints: [
      'Der Deutschkurs muss eine gemeinsame Projektarbeit erstellen.',
      'Das Thema ist "Deutsche Kultur in meinem Land".',
      'Jeder Teilnehmer soll einen Teil übernehmen.',
      'Die Präsentation ist in zwei Wochen.',
      'Überlegen Sie, wie Sie das Projekt organisieren können.'
    ]
  },
  'kulturfestival': {
    title: 'Kulturfestival organisieren',
    description: 'Planen Sie gemeinsam ein Kulturfestival für die Sprachschule.',
    instructions: 'Planen Sie gemeinsam ein Kulturfestival für die Sprachschule.',
    planningPoints: [
      'Die Sprachschule möchte ein Kulturfestival veranstalten.',
      'Verschiedene Kulturen sollen vorgestellt werden.',
      'Es soll Essen, Musik und traditionelle Kleidung geben.',
      'Das Festival ist in einem Monat.',
      'Überlegen Sie, wie Sie das Festival organisieren können.'
    ]
  },
  'sprachpartner': {
    title: 'Sprachpartner finden',
    description: 'Planen Sie gemeinsam ein Programm zum Finden von Sprachpartnern.',
    instructions: 'Planen Sie gemeinsam ein Sprachpartner-Programm für die Sprachschule.',
    planningPoints: [
      'Die Sprachschule möchte ein Sprachpartner-Programm starten.',
      'Deutsche Muttersprachler sollen mit den Kursteilnehmern üben.',
      'Es soll regelmäßige Treffen geben.',
      'Das Programm soll kostenlos sein.',
      'Überlegen Sie, wie Sie das Programm organisieren können.'
    ]
  }
};

// Function to clean transcript by removing repetitive words and speech artifacts
function cleanTranscript(transcript: string): string {
  if (!transcript || typeof transcript !== 'string') {
    return '';
  }

  let cleaned = transcript;

  // Remove common repetitive words and speech artifacts
  const patterns = [
    // Remove repetitive words like "Mit", "Mit...", "Äh", "Ähm", "Also", "Ja", "Nein"
    /\b(Mit|Mit\.\.\.|Äh|Ähm|Also|Ja|Nein|Hmm|Uhm)\s+/g,
    // Remove repeated words (e.g., "das das" -> "das")
    /\b(\w+)\s+\1\b/g,
    // Remove filler words at the beginning
    /^(Äh|Ähm|Also|Ja|Nein|Hmm|Uhm|Mit|Mit\.\.\.)\s+/g,
    // Remove filler words at the end
    /\s+(Äh|Ähm|Also|Ja|Nein|Hmm|Uhm|Mit|Mit\.\.\.)$/g,
    // Remove multiple spaces
    /\s+/g,
    // Remove trailing punctuation followed by spaces
    /[.,;:!?]+\s*$/g,
    // Remove leading/trailing whitespace
    /^\s+|\s+$/g
  ];

  // Apply all cleaning patterns
  patterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, ' ');
  });

  // Final cleanup: remove extra spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Teil 1 API: Processing request...');
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const topic = formData.get('topic') as string;
    const phase = formData.get('phase') as string;
    const conversationData = formData.get('conversation') as string;
    
    console.log('Teil 1 API: Received data:', {
      hasAudioFile: !!audioFile,
      audioFileSize: audioFile?.size,
      audioFileType: audioFile?.type,
      topic,
      phase,
      hasConversationData: !!conversationData
    });
    
    if (!audioFile) {
      console.log('Teil 1 API: No audio file provided');
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Convert audio to text using OpenAI Whisper
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    
    // Store audio file in GridFS
    const audioFileId = await GridFSService.storeAudioFile(
      audioBuffer,
      `teil1-${Date.now()}.webm`,
      'audio/webm',
      {
        teil: 'teil1',
        processed: true,
        createdAt: new Date()
      }
    );

    // Transcribe audio - Force German language detection and transcription
    console.log('Teil 1 API: Starting transcription...');
    console.log('Audio file details:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size
    });
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'de', // Force German language
      response_format: 'text', // returns plain text
      temperature: 0.0, // More deterministic output
    });

    // Clean up the transcript - remove repetitive words and common speech artifacts
    const cleanedTranscript = cleanTranscript(transcription);
    console.log('Teil 1 API: Original transcript:', transcription);
    console.log('Teil 1 API: Cleaned transcript:', cleanedTranscript);

    // Parse conversation history
    const conversation = conversationData ? JSON.parse(conversationData) : [];
    const topicData = TEIL1_TOPICS[topic as keyof typeof TEIL1_TOPICS];
    
    console.log('Teil 1 API: Topic data:', topicData);
    
    if (!topicData) {
      console.log('Teil 1 API: Invalid topic:', topic);
      return NextResponse.json({ error: 'Invalid topic provided' }, { status: 400 });
    }

    // Generate AI response based on phase and conversation
    console.log('Teil 1 API: Generating AI response...');
    const aiResponse = await generateAIResponse(phase, cleanedTranscript, conversation, topicData);
    
    // Audio is already stored in GridFS, no need for additional cleanup

    return NextResponse.json({
      success: true,
      userTranscript: cleanedTranscript,
      aiResponse,
      userAudioUrl: `/api/audio-file?fileId=${audioFileId.toString()}`,
      // Don't generate AI audio here - let client handle TTS
    });

  } catch (error) {
    console.error('Error processing Teil 1 audio:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to process audio';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'OpenAI API key is missing or invalid';
        statusCode = 401;
      } else if (error.message.includes('quota')) {
        errorMessage = 'OpenAI API quota exceeded';
        statusCode = 429;
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'OpenAI API rate limit exceeded';
        statusCode = 429;
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

interface ConversationTurn {
  speaker: 'user' | 'ai';
  text: string;
}

interface TopicData {
  title: string;
  description: string;
  instructions: string;
  planningPoints: string[];
}

async function generateAIResponse(phase: string, userTranscript: string, conversation: ConversationTurn[], topicData: TopicData): Promise<string> {
  // Build conversation history as proper message array
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content: `Sie sind ein KI-Partner für den Goethe B1 Teil 1 Sprechtest. Sie führen ein natürliches Gespräch auf Deutsch.

Thema: ${topicData.title}

Gesprächspunkte: ${topicData.planningPoints.join(', ')}

Verwenden Sie natürliche, freundliche Sprache. Stellen Sie Fragen, äußern Sie Meinungen, und führen Sie ein echtes Gespräch.

Aktuelle Phase: ${phase === 'discussion' ? 'Diskussion - Beginnen Sie das Gespräch. Stellen Sie sich vor und sprechen Sie über das Thema.' :
  phase === 'disagreement' ? 'Meinungsäußerung - Äußern Sie eine andere Meinung zu einem der Punkte. Verwenden Sie Redemittel der Meinungsäußerung.' :
  phase === 'agreement' ? 'Zustimmung - Stimmen Sie einem Punkt zu. Verwenden Sie Redemittel der Zustimmung.' :
  phase === 'conclusion' ? 'Zusammenfassung - Fassen Sie das Gespräch zusammen und beenden Sie es höflich.' :
  'Natürliches Gespräch'}`
    }
  ];

  // Add conversation history as proper message history
  conversation.forEach(turn => {
    if (turn.speaker === 'user') {
      messages.push({ role: 'user', content: turn.text });
    } else if (turn.speaker === 'ai') {
      messages.push({ role: 'assistant', content: turn.text });
    }
  });

  // Add current user message
  messages.push({ role: 'user', content: userTranscript });

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: messages,
    max_tokens: 200,
    temperature: 0.7
  });

  return response.choices[0].message.content || 'Entschuldigung, ich konnte nicht antworten.';
}
