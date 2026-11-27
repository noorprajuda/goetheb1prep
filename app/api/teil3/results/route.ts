import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { dbConnect } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define interfaces for type safety
interface PresentationSlide {
  id: string;
  title: string;
  content: string;
}

interface QASession {
  question: string;
  answer: string;
}

interface Correction {
  original: string;
  corrected: string;
  explanation: string;
}

interface Improvement {
  original: string;
  improved: string;
  explanation: string;
}

interface Teil3Results {
  scores: {
    interaction_reaction: number;
    language_appropriateness: number;
    fluency: number;
    vocabulary: number;
    grammar: number;
    pronunciation: number;
    task_completion: number;
    overall: number;
  };
  feedback: {
    strengths: string[];
    areas_for_improvement: string[];
    specific_feedback: string;
    recommendations: string[];
  };
  correctedText: string;
  corrections: Correction[];
  modelAnswer: string;
  modelAnswerExplanation: string[];
  transcript: string;
  improvements: Improvement[];
  passed: boolean;
  memoId?: string;
  vorteile: string[];
  nachteile: string[];
}

// Function to generate German feedback prompt (no i18n)
function generateFeedbackPrompt(topic: string, presentation: PresentationSlide[], qaSessions: QASession[]) {
  const baseContent = {
    de: {
      systemMessage: 'Sie sind ein Experte für die Bewertung des Goethe B1 Tests. Bewerten Sie die Leistung fair und konstruktiv. WICHTIG: Alle Rückmeldungen, Stärken, Verbesserungsbereiche und Empfehlungen müssen ausschließlich auf DEUTSCH zurückgegeben werden, da dies eine deutsche B1-Prüfungsvorbereitung ist und die Schüler das Lesen von Rückmeldungen in der Zielsprache üben müssen.',
      prompt: `
Bewerten Sie die Leistung des Teilnehmers im Goethe B1 Test Teil 3 (Reaktion und Fragen zur Präsentation).

Präsentationsthema: ${topic}
Präsentationsfolien:
${presentation.map((slide: PresentationSlide, index: number) => 
  `Folie ${index + 1}: ${slide.title}\n${slide.content}`
).join('\n\n')}

Fragen und Reaktionen des Teilnehmers:
${qaSessions.map((session: QASession, index: number) => 
  `Frage ${index + 1}: ${session.question}\nAntwort/Reaktion ${index + 1}: ${session.answer}`
).join('\n\n')}

KRITISCHE BEWERTUNGSKRITERIEN FÜR TEIL 3:

Die Kriterien sind die Fähigkeit zu reagieren, spontane Antworten, das Stellen einer relevanten Frage zur Präsentation des Partners und das Geben einer klaren und strukturierten Rückmeldung zur Präsentation. Es wird bewertet, wie Sie auf das Gesagte reagieren, sich ausdrücken und einen Gesprächsbeitrag leisten.

Bewertungskriterien für Teil 3:

1. **Interaktion und Reaktion (0-100 Punkte)**: 
   - Wie gut reagieren Sie auf die Äußerungen des Partners und der Prüfer? 
   - Können Sie spontan und angemessen antworten?

2. **Sprachliche Angemessenheit (0-100 Punkte)**:
   - Ihre Rückmeldung und Frage sollten in klarem und grammatikalisch korrektem Deutsch formuliert sein

3. **Flüssigkeit (0-100 Punkte)**: Wie flüssig und natürlich spricht der Teilnehmer?

4. **Wortschatz (0-100 Punkte)**: Wie vielfältig und angemessen ist der verwendete Wortschatz?

5. **Grammatik (0-100 Punkte)**: Wie korrekt ist die Grammatik?

6. **Aussprache (0-100 Punkte)**: Wie klar ist die Aussprache?

7. **Aufgabenbewältigung (0-100 Punkte)**: 
   - Wie gut erfüllt der Teilnehmer die Aufgabe als Sprecher oder Zuhörer?
   - Kann er spontan reagieren und eigene Fragen stellen?
   - Stellt er relevante Fragen zur Präsentation des Partners?
   - Gibt er eine klare und verständliche Rückmeldung zur Präsentation?

BEISPIEL FÜR GUTE RÜCKMELDUNG UND FRAGE:
"Ich fand Ihre Präsentation sehr interessant, besonders den Punkt über die Umweltschutzinitiative. Ich finde es sehr wichtig, dass wir alle einen Beitrag leisten. Meine Frage ist: Haben Sie schon einmal über andere konkrete Aktionen nachgedacht, die in der Nachbarschaft umgesetzt werden könnten?"

WICHTIG: Geben Sie ALLE Rückmeldungen, Stärken, Verbesserungsvorschläge und Empfehlungen ausschließlich auf DEUTSCH zurück. Die JSON-Antwort muss vollständig auf Deutsch sein, da dies eine deutsche B1-Prüfungsvorbereitung ist und die Schüler das Lesen von Rückmeldungen in der Zielsprache üben müssen.

Geben Sie eine detaillierte Bewertung im folgenden JSON-Format:

{
  "scores": {
    "interaction_reaction": 85,
    "language_appropriateness": 82,
    "fluency": 88,
    "vocabulary": 85,
    "grammar": 80,
    "pronunciation": 82,
    "task_completion": 88,
    "overall": 82
  },
  "feedback": {
    "strengths": [
      "Sehr gute Aufgabenbewältigung in Teil 3",
      "Stellt relevante Fragen zur Präsentation des Partners",
      "Gibt eine klare und verständliche Rückmeldung zur Präsentation",
      "Reagiert spontan und angemessen auf die Präsentation",
      "Verwendet passende Redemittel für Teil 3"
    ],
    "areas_for_improvement": [
      "Grammatikfehler in komplexeren Satzstrukturen",
      "Aussprache könnte bei schwierigen Wörtern präziser sein",
      "Mehr Variation in der Wortwahl für Fragen und Rückmeldungen",
      "Bessere Verbindung zwischen Fragen und Antworten"
    ],
    "specific_feedback": "Ihre Leistung in Teil 3 zeigt eine sehr gute Aufgabenbewältigung. Sie reagieren spontan und angemessen auf die Präsentation, stellen relevante Fragen zur Präsentation des Partners und geben eine klare und verständliche Rückmeldung. Ihre sprachliche Angemessenheit ist für das B1-Niveau geeignet, mit klaren und grammatikalischen Formulierungen. Die formale Korrektheit ist größtenteils gegeben, mit nur wenigen Grammatikfehlern. Ihre Aussprache ist verständlich und zeigt angemessene Intonation. Insgesamt eine sehr gute Leistung, die dem B1-Standard entspricht.",
    "recommendations": [
      "Üben Sie komplexere Satzstrukturen mit Nebensätzen",
      "Arbeiten Sie an der Aussprache schwieriger Wörter",
      "Erweitern Sie den Wortschatz für Fragen und Rückmeldungen",
      "Üben Sie das Stellen relevanter Fragen zur Präsentation",
      "Verwenden Sie mehr Verbindungswörter für flüssigere Übergänge"
    ]
  },
  "correctedText": "Korrigierte Version der Fragen und Reaktionen",
  "corrections": [
    {
      "original": "Originaltext",
      "corrected": "Korrigierter Text",
      "explanation": "Erklärung der Korrektur"
    }
  ],
  "modelAnswer": "Beispiel für eine gute Rückmeldung und Frage zur Präsentation",
  "modelAnswerExplanation": [
    "Die Modellantwort folgt der geforderten 5-Schritte-Struktur: Einleitung, persönliche Meinung, Situation im Heimatland, Vor- und Nachteile, Abschluss und Dank",
    "Jeder Schritt ist klar formuliert und erfüllt die Wortanzahl von über 300 Wörtern"
  ]
}

Bewerten Sie fair und konstruktiv. Berücksichtigen Sie das B1-Niveau.

WICHTIG für modelAnswerExplanation: 
- Geben Sie EXAKT 2 Array-Elemente zurück
- Erstes Element: "Die Modellantwort folgt der geforderten 5-Schritte-Struktur: Einleitung, persönliche Meinung, Situation im Heimatland, Vor- und Nachteile, Abschluss und Dank"
- Zweites Element: "Jeder Schritt ist klar formuliert und erfüllt die Wortanzahl von über 300 Wörtern"

WICHTIG: Alle Rückmeldungen müssen auf DEUTSCH sein - dies ist eine deutsche B1-Prüfungsvorbereitung!
`
    }
  };

  // Always return German content regardless of language parameter
  return baseContent.de;
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    
    // Handle FormData (audio analysis)
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      const audioFile = formData.get('audio') as File;
      const topic = formData.get('topic') as string;
      const presentationData = formData.get('presentation') as string;
      
      // Enhanced logging for debugging
      console.log('Teil 3 API - Received data:', {
        hasAudioFile: !!audioFile,
        audioFileSize: audioFile?.size,
        audioFileType: audioFile?.type,
        topic: topic,
        hasPresentationData: !!presentationData,
        presentationDataLength: presentationData?.length,
        allFormDataKeys: Array.from(formData.keys())
      });
      
      if (!audioFile || !topic) {
        console.error('Teil 3 API - Missing required data:', {
          hasAudioFile: !!audioFile,
          hasTopic: !!topic,
          topicValue: topic
        });
        return NextResponse.json({ 
          error: 'Missing required data',
          details: {
            hasAudioFile: !!audioFile,
            hasTopic: !!topic,
            topicValue: topic
          }
        }, { status: 400 });
      }
      
      // Validate audio file
      if (audioFile.size === 0) {
        return NextResponse.json({ error: 'Audio file is empty' }, { status: 400 });
      }
      
      if (audioFile.size > 25 * 1024 * 1024) { // 25MB limit
        return NextResponse.json({ error: 'Audio file too large (max 25MB)' }, { status: 400 });
      }
      
      // Validate audio file type (check base type, not specific codec)
      const allowedBaseTypes = ['audio/webm', 'audio/mp4', 'audio/wav', 'audio/mpeg', 'audio/ogg'];
      const audioType = audioFile.type.split(';')[0]; // Remove codec specification
      
      console.log('Teil 3 API - Audio file validation:', {
        originalType: audioFile.type,
        baseType: audioType,
        size: audioFile.size
      });
      
      if (!allowedBaseTypes.includes(audioType)) {
        return NextResponse.json({ 
          error: 'Unsupported audio format. Please use WebM, MP4, WAV, MP3, or OGG.',
          details: `Received: ${audioFile.type}, Expected one of: ${allowedBaseTypes.join(', ')}`
        }, { status: 400 });
      }
      
      // Parse presentation data
      let presentation: PresentationSlide[];
      try {
        presentation = JSON.parse(presentationData || '[]');
        console.log('Received presentation data:', presentation.length, 'slides');
        
        // Validate presentation data
        if (!Array.isArray(presentation)) {
          console.error('Teil 3 API - Invalid presentation data: not an array');
          return NextResponse.json({ 
            error: 'Invalid presentation data format',
            details: 'Presentation data must be an array'
          }, { status: 400 });
        }
        
        if (presentation.length === 0) {
          console.error('Teil 3 API - Empty presentation data');
          return NextResponse.json({ 
            error: 'Presentation data is required',
            details: 'No presentation slides found'
          }, { status: 400 });
        }
      } catch (parseError) {
        console.error('Teil 3 API - Error parsing presentation data:', parseError);
        return NextResponse.json({ 
          error: 'Invalid presentation data format',
          details: parseError instanceof Error ? parseError.message : 'Failed to parse presentation data'
        }, { status: 400 });
      }
      
      // Check OpenAI API key before transcription
      if (!process.env.OPENAI_API_KEY) {
        console.error('Teil 3 API - OpenAI API key not configured');
        return NextResponse.json({ 
          error: 'OpenAI API key not configured',
          details: 'Server configuration error'
        }, { status: 500 });
      }

      // Transcribe audio to text
      let transcript: string;
      try {
        console.log('Teil 3 API - Starting transcription with OpenAI...', {
          audioType: audioFile.type,
          audioSize: audioFile.size,
          audioName: audioFile.name
        });
        
        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: "whisper-1",
          language: "de"
        });
        
        transcript = transcription.text;
        console.log('Transcribed audio:', transcript.substring(0, 100) + '...');
        
        // Validate transcription result
        if (!transcript || transcript.trim().length === 0) {
          throw new Error('Empty transcription result');
        }
      } catch (error) {
        console.error('Error transcribing audio:', error);
        // Return error response instead of falling back to empty transcript
        return NextResponse.json({ 
          error: 'Failed to transcribe audio. Please ensure the audio is clear and try again.',
          details: error instanceof Error ? error.message : 'Unknown transcription error'
        }, { status: 400 });
      }
      
      // Create a single Q&A session from the transcribed audio
      const qaSessions = [{
        question: "User's response to presentation",
        answer: transcript
      }];
      
      // Process the analysis
      return await processTeil3Analysis(topic, presentation, qaSessions, request);
    }
    
    // Handle JSON (text analysis)
    const { topic, presentation, qaSessions } = await request.json();

    if (!topic || !presentation || !qaSessions) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }
    
    return await processTeil3Analysis(topic, presentation, qaSessions, request);

  } catch (error) {
    console.error('Error generating results:', error);
    return NextResponse.json({ error: 'Failed to generate results' }, { status: 500 });
  }
}

// Extract the analysis logic into a separate function
async function processTeil3Analysis(topic: string, presentation: PresentationSlide[], qaSessions: QASession[], request: NextRequest) {
  try {
    // Generate language-specific feedback prompt
    const languageContent = generateFeedbackPrompt(topic, presentation, qaSessions);
    console.log('Analysis prompt length:', languageContent.prompt.length);
    console.log('Presentation slides:', presentation.length);
    console.log('QA sessions:', qaSessions.length);

    const feedbackResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: languageContent.systemMessage
        },
        {
          role: 'user',
          content: languageContent.prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    let results: Teil3Results;
    let content = '';
    try {
      // Clean the response content to remove potential formatting issues
      content = feedbackResponse.choices[0].message.content || '{}';
      
      // Remove any markdown code blocks or backticks that might interfere with JSON parsing
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Try to extract JSON from the response if it's wrapped in other text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = jsonMatch[0];
      }
      
      // Additional cleaning for common issues
      content = content
        .replace(/,\s*}/g, '}') // Remove trailing commas
        .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
        .replace(/\n\s*/g, ' ') // Replace newlines with spaces
        .trim();
      
      results = JSON.parse(content);
      
      // Validate that the parsed result has the expected structure
      if (!results.scores) {
        throw new Error('Invalid response structure: missing scores');
      }
      
      // Validate all required score properties exist
      const requiredScores: (keyof typeof results.scores)[] = ['interaction_reaction', 'language_appropriateness', 'fluency', 'vocabulary', 'grammar', 'pronunciation', 'task_completion'];
      const missingScores = requiredScores.filter(score => typeof results.scores[score] !== 'number');
      if (missingScores.length > 0) {
        throw new Error(`Missing required scores: ${missingScores.join(', ')}`);
      }
      
      // Validate feedback structure
      if (!results.feedback) {
        results.feedback = {
          strengths: [],
          areas_for_improvement: [],
          specific_feedback: '',
          recommendations: []
        };
      }
      
      // Ensure all feedback properties are arrays
      if (!Array.isArray(results.feedback.strengths)) {
        results.feedback.strengths = [];
      }
      if (!Array.isArray(results.feedback.areas_for_improvement)) {
        results.feedback.areas_for_improvement = [];
      }
      if (!Array.isArray(results.feedback.recommendations)) {
        results.feedback.recommendations = [];
      }
      
    } catch (error) {
      console.error('Error parsing feedback JSON:', error);
      console.error('Raw response content:', feedbackResponse.choices[0].message.content);
      console.error('Cleaned content:', content);
      // German fallback results for Teil 3
      const fallback = {
        strengths: ['Gute Teilnahme am Gespräch', 'Relevante Fragen gestellt'],
        areas_for_improvement: ['Grammatik verbessern', 'Wortschatz erweitern'],
        specific_feedback: 'Gute Grundleistung mit Raum für Verbesserungen.',
        recommendations: ['Regelmäßig üben', 'Grammatik wiederholen'],
        correctedText: 'Korrigierte Version der Fragen und Reaktionen',
        modelAnswer: 'Beispiel für eine gute Rückmeldung und Frage zur Präsentation',
        modelAnswerExplanation: [
          'Gibt eine klare und verständliche Rückmeldung zur Präsentation',
          'Stellt eine relevante Frage, die sich auf das Gesagte bezieht',
          'Reagiert spontan und passend auf die Äußerungen des Partners'
        ]
      };

      results = {
        scores: {
          interaction_reaction: 75,
          language_appropriateness: 75,
          fluency: 80,
          vocabulary: 75,
          grammar: 70,
          pronunciation: 74,
          task_completion: 72,
          overall: 74
        },
        feedback: {
          strengths: fallback.strengths,
          areas_for_improvement: fallback.areas_for_improvement,
          specific_feedback: fallback.specific_feedback,
          recommendations: fallback.recommendations
        },
        correctedText: fallback.correctedText,
        corrections: [],
        modelAnswer: fallback.modelAnswer,
        modelAnswerExplanation: fallback.modelAnswerExplanation,
        transcript: '', // Will be filled by the actual transcript
        improvements: [], // Add missing property
        passed: false, // Will be calculated based on scores
        memoId: undefined,
        vorteile: [],
        nachteile: []
      };
    }

    // Ensure scores object exists and has all required properties
    if (!results.scores) {
      results.scores = {
        interaction_reaction: 75,
        language_appropriateness: 75,
        fluency: 80,
        vocabulary: 75,
        grammar: 70,
        pronunciation: 74,
        task_completion: 72,
        overall: 74
      };
    }

    // Ensure all other required properties exist
    if (!results.feedback) {
      results.feedback = {
        strengths: [],
        areas_for_improvement: [],
        specific_feedback: '',
        recommendations: []
      };
    }

      // MANDATORY: Ensure all feedback properties are arrays with meaningful defaults
      if (!Array.isArray(results.feedback.strengths) || results.feedback.strengths.length === 0) {
        results.feedback.strengths = ['Gute Grundleistung', 'Zeigt Engagement'];
      }
      if (!Array.isArray(results.feedback.areas_for_improvement) || results.feedback.areas_for_improvement.length === 0) {
        results.feedback.areas_for_improvement = ['Weitere Übung empfohlen', 'Wortschatz erweitern'];
      }
      if (!Array.isArray(results.feedback.recommendations) || results.feedback.recommendations.length === 0) {
        results.feedback.recommendations = ['Regelmäßig üben', 'Mehr sprechen'];
      }
      if (typeof results.feedback.specific_feedback !== 'string' || !results.feedback.specific_feedback.trim()) {
        results.feedback.specific_feedback = 'Gute Grundleistung mit Raum für Verbesserungen.';
      }

    if (!results.corrections) {
      results.corrections = [];
    }

    if (!results.improvements) {
      results.improvements = [];
    }

    if (typeof results.passed !== 'boolean') {
      results.passed = false;
    }

    if (!results.vorteile) {
      results.vorteile = [];
    }

    if (!results.nachteile) {
      results.nachteile = [];
    }

    // Calculate overall score for Teil 3
    const scores = results.scores;
    const overallScore = Math.round(
      (scores.interaction_reaction + scores.language_appropriateness + scores.fluency + 
       scores.vocabulary + scores.grammar + scores.pronunciation + scores.task_completion) / 7
    );
    results.scores.overall = overallScore;

    // CRITICAL: Ensure mandatory feedback properties are ALWAYS present
    if (!results.feedback) {
      results.feedback = {
        strengths: ['Gute Grundleistung', 'Zeigt Engagement'],
        areas_for_improvement: ['Weitere Übung empfohlen', 'Wortschatz erweitern'],
        specific_feedback: 'Gute Grundleistung mit Raum für Verbesserungen.',
        recommendations: ['Regelmäßig üben', 'Mehr sprechen']
      };
    }
    
    // MANDATORY properties - these MUST exist
    if (!Array.isArray(results.feedback.strengths)) {
      results.feedback.strengths = ['Gute Grundleistung', 'Zeigt Engagement'];
    }
    if (!Array.isArray(results.feedback.areas_for_improvement)) {
      results.feedback.areas_for_improvement = ['Weitere Übung empfohlen', 'Wortschatz erweitern'];
    }
    if (!Array.isArray(results.feedback.recommendations)) {
      results.feedback.recommendations = ['Regelmäßig üben', 'Mehr sprechen'];
    }
    if (typeof results.feedback.specific_feedback !== 'string' || !results.feedback.specific_feedback) {
      results.feedback.specific_feedback = 'Gute Grundleistung mit Raum für Verbesserungen.';
    }

    // Ensure all required properties exist for the frontend
    const completeResults = {
      ...results,
      transcript: qaSessions[0]?.answer || '',
      presentation,
      qaSessions,
      userQuestions: qaSessions.map((session: QASession) => session.question),
      aiAnswers: qaSessions.map((session: QASession) => session.answer),
      // Add missing properties that frontend expects
      passed: (results.scores?.overall || 0) >= 60, // B1 passing score
      memoId: undefined, // Will be set by frontend if needed
      vorteile: [], // Not applicable for Teil 3
      nachteile: [], // Not applicable for Teil 3
      // Ensure corrections and improvements are arrays
      corrections: results.corrections || [],
      improvements: results.improvements || []
    };

    // FINAL VALIDATION: Double-check mandatory properties before sending response
    if (!completeResults.feedback) {
      completeResults.feedback = {
        strengths: ['Gute Grundleistung', 'Zeigt Engagement'],
        areas_for_improvement: ['Weitere Übung empfohlen', 'Wortschatz erweitern'],
        specific_feedback: 'Gute Grundleistung mit Raum für Verbesserungen.',
        recommendations: ['Regelmäßig üben', 'Mehr sprechen']
      };
    }
    
    // Guarantee these properties exist with meaningful content
    completeResults.feedback.strengths = Array.isArray(completeResults.feedback.strengths) && completeResults.feedback.strengths.length > 0 
      ? completeResults.feedback.strengths 
      : ['Gute Grundleistung', 'Zeigt Engagement'];
      
    completeResults.feedback.areas_for_improvement = Array.isArray(completeResults.feedback.areas_for_improvement) && completeResults.feedback.areas_for_improvement.length > 0 
      ? completeResults.feedback.areas_for_improvement 
      : ['Weitere Übung empfohlen', 'Wortschatz erweitern'];
      
    completeResults.feedback.recommendations = Array.isArray(completeResults.feedback.recommendations) && completeResults.feedback.recommendations.length > 0 
      ? completeResults.feedback.recommendations 
      : ['Regelmäßig üben', 'Mehr sprechen'];
      
    completeResults.feedback.specific_feedback = typeof completeResults.feedback.specific_feedback === 'string' && completeResults.feedback.specific_feedback.trim() 
      ? completeResults.feedback.specific_feedback 
      : 'Gute Grundleistung mit Raum für Verbesserungen.';

    // Save to database
    try {
      console.log("Saving Teil 3 results to database...");
      await dbConnect();
      
      if (!mongoose.connection.db) {
        throw new Error('MongoDB database not available');
      }
      const audioMemos = mongoose.connection.db.collection('audioMemos');
      
      // Get user ID from request headers
      const userId = request.headers.get('x-user-id');
      
      const testRecord = {
        _id: new ObjectId(),
        userId: userId,
        teilType: 'teil3',
        topic: topic,
        status: 'completed',
        audioUrl: null, // Teil 3 doesn't have audio URL
        createdAt: new Date(),
        updatedAt: new Date(),
        ...completeResults
      };
      
      await audioMemos.insertOne(testRecord);
      console.log("Teil 3 results saved to database:", testRecord._id);
      
    } catch (dbError) {
      console.error('Error saving to database:', dbError);
      // Continue with response even if database save fails
    }

    return NextResponse.json({
      success: true,
      results: completeResults
    });

  } catch (error) {
    console.error('Error in processTeil3Analysis:', error);
    return NextResponse.json({ error: 'Failed to process analysis' }, { status: 500 });
  }
}
