import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GridFSService } from '@/lib/gridfsService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    console.log('Teil 3 API: Request received');
    console.log('Content-Type:', request.headers.get('content-type'));
    
    const formData = await request.formData();
    console.log('FormData parsed successfully');
    
    const audioFile = formData.get('audio') as File;
    const topic = formData.get('topic') as string;
    const presentationData = formData.get('presentation') as string;
    const qaSessionsData = formData.get('qaSessions') as string;
    
    console.log('FormData fields:', {
      hasAudio: !!audioFile,
      topic,
      hasPresentation: !!presentationData,
      hasQASessions: !!qaSessionsData
    });

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Parse presentation and Q&A sessions
    const presentation = JSON.parse(presentationData || '[]');
    const qaSessions = JSON.parse(qaSessionsData || '[]');

    // Convert audio file to buffer
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    console.log('Audio file info:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size
    });

    // Create a new File object with a supported format for Whisper
    // Whisper supports WebM but might have issues with Opus codec
    const audioFileForWhisper = new File([audioFile], 'audio.webm', { 
      type: 'audio/webm' 
    });

    console.log('Sending to Whisper with type:', audioFileForWhisper.type);

    // Transcribe the question
    let transcription;
    try {
      transcription = await openai.audio.transcriptions.create({
        file: audioFileForWhisper,
        model: 'whisper-1',
        language: 'de',
        response_format: 'text',
        temperature: 0.0,
      });
    } catch (whisperError: unknown) {
      console.error('Whisper API error:', whisperError);
      
      // If Whisper fails due to format, try with a different approach
      if ((whisperError as { status?: number; message?: string }).status === 400 && (whisperError as { status?: number; message?: string }).message?.includes('Invalid file format')) {
        console.log('Trying with different file format...');
        
        // Try with MP4 format
        const audioFileMP4 = new File([audioFile], 'audio.mp4', { 
          type: 'audio/mp4' 
        });
        
        transcription = await openai.audio.transcriptions.create({
          file: audioFileMP4,
          model: 'whisper-1',
          language: 'de',
          response_format: 'text',
          temperature: 0.0,
        });
      } else {
        throw whisperError;
      }
    }

    console.log('Teil 3 API: Transcribed question:', transcription);

    // Generate answer based on presentation and previous Q&A
    const answerPrompt = `
Sie sind ein Experte für den Goethe B1 Test Teil 3. Beantworten Sie die folgende Frage basierend auf der gegebenen Präsentation.

Präsentationsthema: ${topic}
Präsentationsfolien:
${presentation.map((slide: { title: string; content: string[] }, index: number) => 
  `Folie ${index + 1}: ${slide.title}\n${slide.content.join('\n')}`
).join('\n\n')}

Bisherige Fragen und Antworten:
${qaSessions.map((session: { question: string; answer: string }, index: number) => 
  `Q${index + 1}: ${session.question}\nA${index + 1}: ${session.answer}`
).join('\n\n')}

Aktuelle Frage: ${transcription}

Bitte geben Sie eine detaillierte, hilfreiche Antwort auf Deutsch, die:
1. Direkt auf die Frage eingeht
2. Informationen aus der Präsentation verwendet
3. Für B1-Niveau angemessen ist
4. 2-3 Sätze lang ist
5. Professionell und freundlich formuliert ist

Antworten Sie nur mit der Antwort, ohne zusätzliche Erklärungen.
`;

    const answerResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Sie sind ein Experte für den Goethe B1 Test Teil 3. Beantworten Sie Fragen basierend auf Präsentationen präzise und hilfreich.'
        },
        {
          role: 'user',
          content: answerPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const answer = answerResponse.choices[0].message.content || 'Entschuldigung, ich konnte keine Antwort generieren.';

    // Store audio in GridFS for potential future use
    const audioFileId = await GridFSService.storeAudioFile(
      audioBuffer,
      `teil3_question_${Date.now()}.webm`,
      'audio/webm',
      {
        teil: 'teil3',
        type: 'question',
        createdAt: new Date()
      }
    );

    return NextResponse.json({
      success: true,
      question: transcription,
      answer: answer,
      audioUrl: `/api/audio-file?fileId=${audioFileId.toString()}`
    });

  } catch (error) {
    console.error('Error processing question:', error);
    
    // Provide more specific error messages
    if (error instanceof TypeError && error.message.includes('FormData')) {
      return NextResponse.json({ 
        error: 'Invalid request format. Expected FormData.' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to process question',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
