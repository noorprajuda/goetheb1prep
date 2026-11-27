import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { dbConnect } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

interface ConversationTurn {
  speaker: 'user' | 'ai';
  text: string;
  audioUrl?: string;
}
import { AudioMerger, AudioSegment } from '@/lib/audioMerger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { conversation, topic, conversationDurationMinutes, wordCount }: { 
      conversation: ConversationTurn[]; 
      topic: string;
      conversationDurationMinutes?: number;
      wordCount?: number;
    } = await request.json();

    if (!conversation || !Array.isArray(conversation)) {
      return NextResponse.json({ error: 'Invalid conversation data' }, { status: 400 });
    }

    // Extract user transcripts
    const userTranscripts = conversation
      .filter(turn => turn.speaker === 'user')
      .map(turn => turn.text)
      .join(' ');

    // Generate comprehensive feedback
    const feedback = await generateComprehensiveFeedback(userTranscripts, conversation, topic);

    // Create combined audio from conversation segments
    const combinedAudioUrl = await createCombinedAudio(conversation);

    // Calculate scores with time and word count criteria
    const scores = calculateScores(feedback, conversation, userTranscripts, conversationDurationMinutes, wordCount);

    // Generate example conversation
    let exampleConversation = [];
    try {
      console.log("Generating example conversation...");
      // Construct the proper base URL for the environment
      const baseUrl = process.env.BASE_URL || 
                     process.env.APP_URL || 
                     process.env.NEXT_PUBLIC_APP_URL || 
                     (process.env.NODE_ENV === 'production' ? 'https://www.goetheb1prep.com' : 'http://localhost:3000');
      
      const exampleResponse = await fetch(`${baseUrl}/api/generate-example-conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userConversation: conversation,
          taskContext: "Gemeinsam etwas planen - Ein Teilnehmer aus dem Deutschkurs hatte einen Unfall und liegt im Krankenhaus. Diese Woche möchten Sie ihn besuchen und ein Geschenk von der ganzen Gruppe mitbringen. Nächste Woche kann er das Krankenhaus verlassen. Da er allein lebt, wird er Hilfe brauchen.",
          taskType: 'teil1_planning'
        })
      });

      if (exampleResponse.ok) {
        const exampleData = await exampleResponse.json();
        exampleConversation = exampleData.conversation || [];
        console.log("Example conversation generated successfully");
      } else {
        console.log("Failed to generate example conversation, using fallback");
        // Fallback example conversation
        exampleConversation = [
          { speaker: 'user', text: 'Hallo! Weißt du was? Ich habe gehört, dass Bayu vom Deutschkurs krank ist und im Krankenhaus liegt. Das tut mir wirklich leid. Ich möchte ihn gerne besuchen kommen. Können wir das zusammen planen?', timestamp: Date.now() },
          { speaker: 'ai', text: 'Hallo! Danke, dass du fragst. Ja, ich habe auch gehört, dass es Bayu nicht gut geht. Ein Besuch würde ihn sicher sehr freuen! Wann hättest du denn Zeit? Und wie kommst du zum Krankenhaus?', timestamp: Date.now() },
          { speaker: 'user', text: 'Ich könnte am Samstag um 14 Uhr kommen. Mit dem Bus fahre ich zum Krankenhaus. Was denkst du, sollen wir ihm Blumen oder etwas anderes mitbringen?', timestamp: Date.now() },
          { speaker: 'ai', text: 'Blumen sind eine schöne Idee! Aber vielleicht wäre auch ein kleines Buch oder eine Zeitschrift gut, damit er sich nicht langweilt. Und wir könnten ihm auch eine Karte von der ganzen Gruppe schreiben.', timestamp: Date.now() },
          { speaker: 'user', text: 'Das ist eine super Idee! Ich bringe ein Buch mit und du könntest die Karte organisieren. Sollen wir auch noch andere aus dem Kurs fragen, ob sie mitkommen wollen?', timestamp: Date.now() },
          { speaker: 'ai', text: 'Ja, das wäre schön! Ich frage mal Anna und Tom, ob sie Zeit haben. Dann können wir alle zusammen gehen. Soll ich auch beim Krankenhaus anrufen und fragen, ob Besuch erlaubt ist?', timestamp: Date.now() },
          { speaker: 'user', text: 'Ja, das wäre sehr gut! Und wir sollten auch fragen, in welchem Zimmer er liegt. Dann können wir direkt dorthin gehen.', timestamp: Date.now() },
          { speaker: 'ai', text: 'Perfekt! Ich kümmere mich um die Karte und rufe das Krankenhaus an. Du bringst das Buch mit. Dann treffen wir uns am Samstag um 14 Uhr am Haupteingang?', timestamp: Date.now() },
          { speaker: 'user', text: 'Ja, das passt! Vielen Dank für deine Hilfe. Ich freue mich schon darauf, Bayu zu besuchen. Das wird ihn bestimmt aufmuntern!', timestamp: Date.now() },
          { speaker: 'ai', text: 'Gern geschehen! Ich auch. Bis Samstag dann!', timestamp: Date.now() }
        ];
      }
    } catch (error) {
      console.error('Error generating example conversation:', error);
      // Use fallback conversation
      exampleConversation = [
        { speaker: 'user', text: 'Hallo! Weißt du was? Ich habe gehört, dass Bayu vom Deutschkurs krank ist und im Krankenhaus liegt. Das tut mir wirklich leid. Ich möchte ihn gerne besuchen kommen. Können wir das zusammen planen?', timestamp: Date.now() },
        { speaker: 'ai', text: 'Hallo! Danke, dass du fragst. Ja, ich habe auch gehört, dass es Bayu nicht gut geht. Ein Besuch würde ihn sicher sehr freuen! Wann hättest du denn Zeit? Und wie kommst du zum Krankenhaus?', timestamp: Date.now() }
      ];
    }

    const results = {
      conversation,
      combinedAudioUrl,
      summary: feedback.summary,
      grammarCorrections: feedback.grammarCorrections,
      betterExpressions: feedback.betterExpressions,
      redemittelUsed: feedback.redemittelUsed,
      scores,
      passed: scores.overall >= 60,
      conversationMetrics: {
        durationMinutes: conversationDurationMinutes,
        wordCount: wordCount,
        minDurationRequired: 5,
        minWordsRequired: 200,
        targetDuration: 7,
        targetWords: 400
      },
      feedback: {
        strengths: feedback.strengths || [],
        areas_for_improvement: feedback.areas_for_improvement || [],
        specific_feedback: feedback.specific_feedback || feedback.summary,
        recommendations: feedback.recommendations || []
      },
      modelAnswer: feedback.modelAnswer || '',
      modelAnswerExplanation: feedback.modelAnswerExplanation || [],
      exampleConversation: exampleConversation
    };

    // Save to database
    try {
      console.log("Saving Teil 1 results to database...");
      await dbConnect();
      if (!mongoose.connection.db) {
        console.error('MongoDB database not available');
        throw new Error('MongoDB database not available');
      }
      
      const audioMemos = mongoose.connection.db.collection('audioMemos');
      
      // Get user ID from request headers
      const userId = request.headers.get('x-user-id');
      
      const testRecord = {
        _id: new ObjectId(),
        userId: userId,
        teilType: 'teil1',
        topic: topic,
        status: 'completed',
        audioUrl: combinedAudioUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...results
      };
      
      await audioMemos.insertOne(testRecord);
      console.log("Teil 1 results saved to database:", testRecord._id);
      
    } catch (dbError) {
      console.error('Error saving to database:', dbError);
      // Continue with response even if database save fails
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Error processing Teil 1 results:', error);
    return NextResponse.json(
      { error: 'Failed to process results' },
      { status: 500 }
    );
  }
}

async function generateComprehensiveFeedback(userTranscript: string, conversation: ConversationTurn[], topic: string) {
  const conversationText = conversation.map(turn => 
    `${turn.speaker === 'user' ? 'User' : 'AI'}: ${turn.text}`
  ).join('\n');

  const prompt = `Analysieren Sie den folgenden Teil 1 Gesprächstest für Goethe B1 Deutsch.

WICHTIG: Antworten Sie NUR mit gültigem JSON. Keine zusätzlichen Erklärungen oder Text vor oder nach dem JSON.

Thema: ${topic}
Gespräch:
${conversationText}

Bitte geben Sie eine detaillierte Analyse im folgenden JSON-Format zurück:

{
  "summary": "Kurze Zusammenfassung des Gesprächs und der Leistung",
  "grammarCorrections": [
    {
      "original": "Originaler Text mit Fehler",
      "corrected": "Korrigierter Text",
      "explanation": "Erklärung des Fehlers"
    }
  ],
  "betterExpressions": [
    {
      "original": "Originaler Ausdruck",
      "improved": "Verbesserter Ausdruck",
      "explanation": "Warum ist das besser?"
    }
  ],
  "redemittelUsed": [
    {
      "category": "agreement|disagreement|conclusion",
      "phrase": "Verwendete Redemittel",
      "context": "Kontext der Verwendung"
    }
  ],
  "strengths": [
    "Liste der Stärken des Kandidaten"
  ],
  "areas_for_improvement": [
    "Liste der Verbesserungsbereiche"
  ],
  "specific_feedback": "Detailliertes Feedback zur Gesamtleistung",
  "recommendations": [
    "Konkrete Empfehlungen für weitere Verbesserung"
  ],
  "modelAnswer": "Beispiel für eine gute Teil 1 Antwort mit allen erforderlichen Elementen",
  "modelAnswerExplanation": [
    "Die Modellantwort folgt der geforderten 5-Schritte-Struktur: Einleitung, persönliche Meinung, Situation im Heimatland, Vor- und Nachteile, Abschluss und Dank",
    "Jeder Schritt ist klar formuliert und erfüllt die Wortanzahl von über 300 Wörtern"
  ],
  "scores": {
    "fluency": 0-100,
    "vocabulary": 0-100,
    "grammar": 0-100,
    "pronunciation": 0-100,
    "task_completion": 0-100,
    "content_structure": 0-100,
    "overall": 0-100
  }
}

Bewertungskriterien:
- Fluency: Sprechfluss und Natürlichkeit
- Vocabulary: Wortschatz und Ausdrucksvielfalt
- Grammar: Grammatikgenauigkeit
- Pronunciation: Aussprache (basierend auf Text, schätzen Sie)
- Task Completion: Erfüllung der Gesprächsaufgabe
- Content Structure: Qualität der Gesprächsstruktur, Engagement, und Beteiligung am Gespräch
- Overall: Gesamtbewertung

WICHTIG für Content Structure:
- Sehr wenig Inhalt (nur 1-2 Wörter): 0-20 Punkte
- Minimaler Inhalt (3-10 Wörter): 20-40 Punkte
- Grundlegende Beteiligung (11-30 Wörter): 40-60 Punkte
- Gute Beteiligung (31-50 Wörter): 60-80 Punkte
- Ausgezeichnete Beteiligung (50+ Wörter): 80-100 Punkte

Bewerten Sie nach B1-Standards (60 = B1-Niveau, 80+ = über B1).

WICHTIG für modelAnswerExplanation: 
- Geben Sie EXAKT 2 Array-Elemente zurück
- Erstes Element: "Die Modellantwort folgt der geforderten 5-Schritte-Struktur: Einleitung, persönliche Meinung, Situation im Heimatland, Vor- und Nachteile, Abschluss und Dank"
- Zweites Element: "Jeder Schritt ist klar formuliert und erfüllt die Wortanzahl von über 300 Wörtern"

Antworten Sie NUR mit dem JSON-Objekt, ohne zusätzlichen Text.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'Sie sind ein Experte für Deutsch als Fremdsprache und Goethe B1 Prüfungen. Analysieren Sie den Gesprächstest und geben Sie detailliertes Feedback. WICHTIG: Antworten Sie NUR mit gültigem JSON, ohne zusätzlichen Text.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 2000,
    temperature: 0.1
  });

  try {
    let feedbackText = response.choices[0].message.content || '{}';
    
    // Clean the response text to extract JSON
    // Remove any text before the first { and after the last }
    const jsonStart = feedbackText.indexOf('{');
    const jsonEnd = feedbackText.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      feedbackText = feedbackText.substring(jsonStart, jsonEnd + 1);
    }
    
    // Log the cleaned JSON for debugging
    console.log('Cleaned JSON response:', feedbackText);
    
    const feedback = JSON.parse(feedbackText);
    return feedback;
  } catch (error) {
    console.error('Error parsing feedback JSON:', error);
    console.error('Raw response:', response.choices[0].message.content);
    
    // Return default feedback if parsing fails
    return {
      summary: "Gespräch wurde analysiert. Bitte überprüfen Sie die Details.",
      grammarCorrections: [],
      betterExpressions: [],
      redemittelUsed: [],
      scores: {
        fluency: 60,
        vocabulary: 60,
        grammar: 60,
        pronunciation: 60,
        task_completion: 60,
        overall: 60
      }
    };
  }
}

async function createCombinedAudio(conversation: ConversationTurn[]): Promise<string> {
  try {
    // Extract audio segments from conversation
    const audioSegments: AudioSegment[] = conversation
      .filter(turn => turn.audioUrl)
      .map(turn => ({
        audioUrl: turn.audioUrl!,
        speaker: turn.speaker
      }));

    if (audioSegments.length === 0) {
      // Return a placeholder URL for GridFS
      return '/api/audio-file?fileId=placeholder';
    }

    // Use AudioMerger to combine audio segments
    const combinedAudioUrl = await AudioMerger.mergeConversationAudio(audioSegments);
    
    return combinedAudioUrl;
  } catch (error) {
    console.error('Error creating combined audio:', error);
    return '/api/audio-file?fileId=placeholder';
  }
}

interface FeedbackData {
  summary: string;
  grammarCorrections: Array<{
    original: string;
    corrected: string;
    explanation: string;
  }>;
  betterExpressions: Array<{
    original: string;
    improved: string;
    explanation: string;
  }>;
  redemittelUsed: Array<{
    category: string;
    phrase: string;
    context: string;
  }>;
  strengths: string[];
  areas_for_improvement: string[];
  specific_feedback: string;
  recommendations: string[];
  scores: {
    fluency: number;
    vocabulary: number;
    grammar: number;
    pronunciation: number;
    task_completion: number;
    overall: number;
  };
}

function calculateContentStructureScore(conversation: ConversationTurn[], userTranscript: string, wordCount: number): number {
  // Count user turns and their content quality
  const userTurns = conversation.filter(turn => turn.speaker === 'user');
  const userTurnCount = userTurns.length;
  
  // Calculate word count per user turn
  const avgWordsPerTurn = userTurnCount > 0 ? wordCount / userTurnCount : 0;
  
  // Base score based on word count (following the criteria from the prompt)
  let baseScore = 0;
  if (wordCount <= 2) {
    baseScore = 10; // Very little content
  } else if (wordCount <= 10) {
    baseScore = 25; // Minimal content
  } else if (wordCount <= 30) {
    baseScore = 45; // Basic participation
  } else if (wordCount <= 50) {
    baseScore = 65; // Good participation
  } else {
    baseScore = 80; // Excellent participation
  }
  
  // Penalty for very short conversations
  if (userTurnCount < 2) {
    baseScore = Math.max(0, baseScore - 20); // Heavy penalty for minimal participation
  }
  
  // Bonus for longer, more meaningful responses
  if (avgWordsPerTurn > 10) {
    baseScore = Math.min(100, baseScore + 10);
  }
  
  // Penalty for very short responses per turn
  if (avgWordsPerTurn < 3 && userTurnCount > 1) {
    baseScore = Math.max(0, baseScore - 15);
  }
  
  return Math.round(baseScore);
}

function calculateScores(feedback: FeedbackData, conversation: ConversationTurn[], userTranscript: string, actualDurationMinutes?: number, actualWordCount?: number) {
  // Ensure scores are within valid range (0-100)
  const scores = feedback.scores || {};
  
  // Use actual metrics if provided, otherwise calculate from conversation
  const wordCount = actualWordCount || userTranscript.split(/\s+/).filter(word => word.length > 0).length;
  const conversationDuration = actualDurationMinutes || calculateConversationDuration(conversation);
  
  // B1 Goethe Teil 1 criteria
  const MIN_DURATION_MINUTES = 5; // 5 minutes minimum
  const MIN_WORD_COUNT = 200; // 200 words minimum
  // const TARGET_DURATION_MINUTES = 7; // 7 minutes target
  const TARGET_WORD_COUNT = 400; // 400 words target
  
  // Calculate duration and word count penalties/bonuses
  // const durationScore = calculateDurationScore(conversationDuration, MIN_DURATION_MINUTES, TARGET_DURATION_MINUTES);
  const wordCountScore = calculateWordCountScore(wordCount, MIN_WORD_COUNT, TARGET_WORD_COUNT);
  
  // Apply penalties for insufficient duration or word count
  const durationPenalty = conversationDuration < MIN_DURATION_MINUTES ? 20 : 0;
  // const wordCountPenalty = wordCount < MIN_WORD_COUNT ? 15 : 0;
  
  // Calculate content structure based on actual conversation quality
  const contentStructureScore = calculateContentStructureScore(conversation, userTranscript, wordCount);
  
  // Calculate base scores
  const baseScores = {
    fluency: Math.min(100, Math.max(0, scores.fluency || 60)),
    vocabulary: Math.min(100, Math.max(0, scores.vocabulary || 60)),
    grammar: Math.min(100, Math.max(0, scores.grammar || 60)),
    pronunciation: Math.min(100, Math.max(0, scores.pronunciation || 60)),
    task_completion: Math.min(100, Math.max(0, scores.task_completion || 60)),
    content_structure: Math.min(100, Math.max(0, contentStructureScore)),
    word_count: Math.min(100, Math.max(0, wordCountScore + 50)) // Convert word count score to 0-100 scale
  };
  
  // Apply penalties to task completion (most affected by duration)
  baseScores.task_completion = Math.max(0, baseScores.task_completion - durationPenalty);
  
  // Calculate overall score with duration and word count factors
  const overallScore = Math.round(
    (baseScores.fluency * 0.2 + 
     baseScores.vocabulary * 0.2 + 
     baseScores.grammar * 0.2 + 
     baseScores.pronunciation * 0.15 + 
     baseScores.task_completion * 0.1 +
     baseScores.content_structure * 0.1 + // 10% weight for content structure
     baseScores.word_count * 0.05) // 5% weight for word count
  );
  
  return {
    ...baseScores,
    overall: Math.min(100, Math.max(0, overallScore))
  };
}

function calculateConversationDuration(conversation: ConversationTurn[]): number {
  // Estimate conversation duration based on text length and typical speaking rates
  // Average German B1 speaker: ~120-150 words per minute
  const totalWords = conversation
    .map(turn => turn.text.split(/\s+/).filter(word => word.length > 0).length)
    .reduce((sum, count) => sum + count, 0);
  
  // Use conservative estimate of 120 words per minute
  return totalWords / 120;
}

// function calculateDurationScore(duration: number, minDuration: number, targetDuration: number): number {
//   if (duration < minDuration) {
//     // Severe penalty for insufficient duration
//     return -30;
//   } else if (duration >= targetDuration) {
//     // Bonus for meeting or exceeding target
//     return 10;
//   } else {
//     // Gradual improvement from min to target
//     const progress = (duration - minDuration) / (targetDuration - minDuration);
//     return Math.round(progress * 10);
//   }
// }

function calculateWordCountScore(wordCount: number, minWords: number, targetWords: number): number {
  if (wordCount < minWords) {
    // Severe penalty for insufficient word count
    return -25;
  } else if (wordCount >= targetWords) {
    // Bonus for meeting or exceeding target
    return 8;
  } else {
    // Gradual improvement from min to target
    const progress = (wordCount - minWords) / (targetWords - minWords);
    return Math.round(progress * 8);
  }
}
