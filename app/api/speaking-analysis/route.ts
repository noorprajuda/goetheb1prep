import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { dbConnect } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import mongoose from "mongoose";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate presentation for Teil 3
async function generatePresentation(topic: string, description: string) {
  try {
    const prompt = `Generate a comprehensive 4-slide presentation in German for the topic "${topic}" following the B1 "Ein Thema präsentieren" structure.
    
    Description: ${description}
    
    This is a B1 "Ein Thema präsentieren" task that requires:
    1. Word count: 300+ words (3-minute presentation)
    2. Complete 5-step structure in EXACT order:
       1. Stellen Sie Ihr Thema vor. Erklären Sie den Inhalt und die Struktur Ihrer Präsentation. (Einstellung) - 50-70 words
       2. Berichten Sie von Ihrer Situation oder einem Erlebnis im Zusammenhang mit dem Thema. (Persönlichen Erfahrungen) - 50-70 words
       3. Berichten Sie von der Situation in Ihrem Heimatland und geben Sie Beispiele. (Rolle von … in Heimatland) - 50-70 words
       4. Nennen Sie die Vor- und Nachteile und sagen Sie dazu Ihre Meinung. Geben Sie auch Beispiele. - 70-90 words
       5. Beenden Sie Ihre Präsentation und bedanken Sie sich bei den Zuhörern. (Abschluss und Dank) - 30-50 words
    
    Create a structured presentation with 4 slides that cover these 5 steps:
    1. Slide 1: Einstellung (Topic introduction and structure overview)
    2. Slide 2: Persönlichen Erfahrungen (Personal experience) + Rolle in Heimatland (Situation in home country)
    3. Slide 3: Vor- und Nachteile (Advantages and disadvantages with personal opinion and examples)
    4. Slide 4: Abschluss und Dank (Conclusion and thanks to audience)
    
    Each slide should have:
    - A clear title matching the B1 structure
    - Detailed content following the B1 requirements
    - Appropriate B1 level German vocabulary
    - Natural German expressions and transitions
    - Specific examples and personal opinions
    
    The total presentation should be exactly 300+ words to match a proper B1 presentation length.
    
    IMPORTANT: Return ONLY a valid JSON array, no markdown code blocks, no additional text. The response must start with [ and end with ].
    
    [
      {
        "id": "slide-1",
        "title": "Einstellung", 
        "content": "Topic introduction and presentation structure overview (50-70 words)..."
      },
      {
        "id": "slide-2",
        "title": "Persönlichen Erfahrungen und Rolle in Heimatland",
        "content": "Personal experience and situation in home country with examples (100-140 words)..."
      },
      {
        "id": "slide-3", 
        "title": "Vor- und Nachteile",
        "content": "Advantages and disadvantages with personal opinion and examples (70-90 words)..."
      },
      {
        "id": "slide-4",
        "title": "Abschluss und Dank", 
        "content": "Conclusion and thanks to audience (30-50 words)..."
      }
    ]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert German language instructor creating B1 level presentations following the 'Ein Thema präsentieren' structure. You MUST respond with ONLY a valid JSON array. Do not include any markdown code blocks, explanations, or additional text. The response must be parseable JSON that starts with [ and ends with ]."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Clean the response to extract JSON from markdown code blocks if present
    let jsonString = response.trim();
    
    // Remove markdown code blocks if present
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Parse the JSON response
    let presentation;
    try {
      presentation = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', response);
      console.error('Cleaned JSON string:', jsonString);
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parse error';
      throw new Error(`Invalid JSON response from OpenAI: ${errorMessage}`);
    }
    
    // Validate the response structure
    if (!Array.isArray(presentation)) {
      throw new Error('Response is not an array');
    }
    
    if (presentation.length !== 4) {
      throw new Error(`Expected 4 slides, got ${presentation.length}`);
    }
    
    // Check total word count and extend if needed
    const totalContent = presentation.map(slide => slide.content || '').join(' ');
    const wordCount = totalContent.split(/\s+/).length;
    
    if (wordCount < 300) {
      try {
        console.log(`Presentation too short (${wordCount} words), extending to 300+ words...`);
        
        const extensionPrompt = `Extend this presentation to exactly 300+ words while maintaining the 4-slide structure and following the B1 "Ein Thema präsentieren" structure:

${JSON.stringify(presentation, null, 2)}

The presentation should follow this B1 structure:
1. Einstellung: Topic introduction and presentation structure overview (50-70 words)
2. Persönlichen Erfahrungen und Rolle in Heimatland: Personal experience and situation in home country with examples (100-140 words)
3. Vor- und Nachteile: Advantages and disadvantages with personal opinion and examples (70-90 words)
4. Abschluss und Dank: Conclusion and thanks to audience (30-50 words)

Make sure the extended version is exactly 300+ words and maintains natural German flow with the B1 structure.

Return ONLY the extended JSON array, no markdown code blocks, no additional text.`;

        const extensionCompletion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an expert German language instructor. Extend the presentation to exactly 300+ words while maintaining natural German flow and the B1 'Ein Thema präsentieren' structure with 4 slides."
            },
            {
              role: "user",
              content: extensionPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        });

        const extendedResponse = extensionCompletion.choices[0]?.message?.content;
        if (extendedResponse) {
          let extendedJsonString = extendedResponse.trim();
          
          // Remove markdown code blocks if present
          if (extendedJsonString.startsWith('```json')) {
            extendedJsonString = extendedJsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (extendedJsonString.startsWith('```')) {
            extendedJsonString = extendedJsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          
          try {
            const extendedPresentation = JSON.parse(extendedJsonString);
            if (Array.isArray(extendedPresentation) && extendedPresentation.length === 4) {
              presentation = extendedPresentation;
              console.log(`Presentation extended successfully to ${presentation.map(slide => slide.content || '').join(' ').split(/\s+/).length} words`);
            }
          } catch (parseError) {
            console.error("Error parsing extended presentation:", parseError);
          }
        }
      } catch (error) {
        console.error("Error extending presentation:", error);
      }
    }
    
    return NextResponse.json({ presentation });
  } catch (error) {
    console.error('Error generating presentation:', error);
    return NextResponse.json({ 
      error: 'Failed to generate presentation', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Generate analysis for speaking test
async function generateAnalysis(transcript: string, topic: string, vorteile: string, nachteile: string, language: string) {
  try {
    // Clean up the transcript - remove repetitive words
    const cleanedTranscript = transcript.replace(/\b(Mit|Mit\.\.\.)\s+/g, '').trim();

    // Generate language-specific prompt
    const languageInstructions = {
      de: {
        system: "Sie sind ein Experte für die Bewertung von Deutschkenntnissen auf B1-Niveau. Analysieren Sie die folgende deutsche Sprechtest-Antwort und geben Sie eine umfassende Bewertung.",
        prompt: `Sie sind ein Experte für die Bewertung von Deutschkenntnissen auf B1-Niveau. Analysieren Sie die folgende deutsche Sprechtest-Antwort und geben Sie eine umfassende Bewertung.`
      },
      id: {
        system: "Anda adalah ahli evaluasi kemampuan bahasa Jerman tingkat B1. Analisis respons tes berbicara bahasa Jerman berikut dan berikan evaluasi komprehensif.",
        prompt: `Anda adalah ahli evaluasi kemampuan bahasa Jerman tingkat B1. Analisis respons tes berbicara bahasa Jerman berikut dan berikan evaluasi komprehensif.`
      },
      en: {
        system: "You are an expert in German language assessment at B1 level. Analyze the following German speaking test response and provide a comprehensive assessment.",
        prompt: `You are an expert in German language assessment at B1 level. Analyze the following German speaking test response and provide a comprehensive assessment.`
      }
    };

    const lang = languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.de;

    // Language-specific instructions for feedback sections
    const feedbackLanguageInstructions = {
      de: {
        feedbackLanguage: "German",
        detailedAssessment: "Penilaian Detail",
        feedback: "Umpan Balik"
      },
      id: {
        feedbackLanguage: "Indonesian (Bahasa Indonesia)",
        detailedAssessment: "Penilaian Detail", 
        feedback: "Umpan Balik"
      },
      en: {
        feedbackLanguage: "English",
        detailedAssessment: "Detailed Assessment",
        feedback: "Feedback"
      }
    };

    const feedbackLang = feedbackLanguageInstructions[language as keyof typeof feedbackLanguageInstructions] || feedbackLanguageInstructions.de;

    // Create the analysis prompt
    const analysisPrompt = `Analyze this German B1 speaking test response about "${topic}":

TRANSCRIPT: "${cleanedTranscript}"

This is a B1 "Ein Thema präsentieren" task that requires:
1. Word count: 250-350 words (3-minute presentation)
2. Complete 5-step structure in EXACT order:
   1. Stellen Sie Ihr Thema vor. Erklären Sie den Inhalt und die Struktur Ihrer Präsentation. (Einstellung) - 50-70 words
   2. Berichten Sie von Ihrer Situation oder einem Erlebnis im Zusammenhang mit dem Thema. (Persönlichen Erfahrungen) - 50-70 words
   3. Berichten Sie von der Situation in Ihrem Heimatland und geben Sie Beispiele. (Rolle von … in Heimatland) - 50-70 words
   4. Nennen Sie die Vor- und Nachteile und sagen Sie dazu Ihre Meinung. Geben Sie auch Beispiele. - 70-90 words
   5. Beenden Sie Ihre Präsentation und bedanken Sie sich bei den Zuhörern. (Abschluss und Dank) - 30-50 words

SCORING CRITERIA:
- task_completion: Based on structure completeness (all 5 elements) and word count (250-350 words)
- content_structure: How well the 5-step B1 structure is followed
- word_count_adequacy: Whether the response has sufficient length for 3 minutes
- fluency: Natural flow and appropriate pace
- vocabulary: Range and accuracy for B1 level
- grammar: Correct use of B1-level structures
- pronunciation: Clarity and intonation (assessed from transcript quality)

Please first provide a corrected version of the student's text, then generate topic-specific vorteile and nachteile, and finally create a comprehensive model answer that incorporates these points.

IMPORTANT: The modelAnswer must be EXACTLY 300 words or more. This is a strict requirement for a 3-minute B1 presentation.

Please provide your assessment in the following JSON format:
{
  "scores": {
    "fluency": 84,
    "vocabulary": 76,
    "grammar": 70,
    "pronunciation": 80,
    "task_completion": 42,
    "content_structure": 36,
    "word_count_adequacy": 40,
    "interaction_reaction": 75,
    "language_appropriateness": 78,
    "overall": 56
  },
  "feedback": {
    "strengths": [
      "List specific strengths based on the actual response - MUST be in ${feedbackLang.feedbackLanguage}"
    ],
    "areas_for_improvement": [
      "List specific areas for improvement - MUST be in ${feedbackLang.feedbackLanguage}"
    ],
    "specific_feedback": "Detailed feedback in ${feedbackLang.feedbackLanguage}",
    "recommendations": [
      "Specific recommendations - MUST be in ${feedbackLang.feedbackLanguage}"
    ]
  },
  "transcript": "Original transcript",
  "correctedText": "Corrected version of the transcript",
  "corrections": [
    {
      "original": "Original text",
      "corrected": "Corrected text", 
      "explanation": "Explanation in ${feedbackLang.feedbackLanguage}"
    }
  ],
  "improvements": [
    {
      "original": "Original text",
      "improved": "Improved text",
      "explanation": "Explanation in ${feedbackLang.feedbackLanguage}"
    }
  ],
  "modelAnswer": "Comprehensive model answer (300+ words) following the 5-step B1 structure",
  "modelAnswerExplanation": [
    "Die Modellantwort folgt der geforderten 5-Schritte-Struktur: Einleitung, persönliche Meinung, Situation im Heimatland, Vor- und Nachteile, Abschluss und Dank",
    "Jeder Schritt ist klar formuliert und erfüllt die Wortanzahl von über 300 Wörtern"
  ],
  "passed": true
}

IMPORTANT: All feedback content (strengths, areas_for_improvement, specific_feedback, recommendations, corrections, improvements, modelAnswerExplanation) MUST be in ${feedbackLang.feedbackLanguage}.

WICHTIG für modelAnswerExplanation: 
- Geben Sie EXAKT 2 Array-Elemente zurück
- Erstes Element: "Die Modellantwort folgt der geforderten 5-Schritte-Struktur: Einleitung, persönliche Meinung, Situation im Heimatland, Vor- und Nachteile, Abschluss und Dank"
- Zweites Element: "Jeder Schritt ist klar formuliert und erfüllt die Wortanzahl von über 300 Wörtern"`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: lang.system
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 4000
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response with error handling
    let analysisData;
    try {
      // Clean the response text to extract JSON
      // Remove any text before the first { and after the last }
      const jsonStart = response.indexOf('{');
      const jsonEnd = response.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const cleanedResponse = response.substring(jsonStart, jsonEnd + 1);
        analysisData = JSON.parse(cleanedResponse);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (parseError) {
      console.error('generateAnalysis: JSON parse error:', parseError);
      console.error('generateAnalysis: Raw response:', response);
      
      // Return fallback data if JSON parsing fails
      analysisData = {
        scores: {
          fluency: 60,
          vocabulary: 60,
          grammar: 60,
          pronunciation: 60,
          task_completion: 60,
          content_structure: 60,
          word_count_adequacy: 60,
          interaction_reaction: 60,
          language_appropriateness: 60,
          overall: 60
        },
        feedback: {
          strengths: ['Gute Grundleistung'],
          areas_for_improvement: ['Weitere Übung empfohlen'],
          specific_feedback: 'Die Antwort wurde analysiert, aber es gab ein Problem bei der Verarbeitung.',
          recommendations: ['Weitere Übung mit der Struktur']
        },
        correctedText: transcript,
        corrections: [],
        improvements: [],
        modelAnswer: 'Beispielantwort für die Präsentation',
        modelAnswerExplanation: [
          'Die Modellantwort folgt der geforderten 5-Schritte-Struktur: Einleitung, persönliche Meinung, Situation im Heimatland, Vor- und Nachteile, Abschluss und Dank',
          'Jeder Schritt ist klar formuliert und erfüllt die Wortanzahl von über 300 Wörtern'
        ],
        passed: false
      };
    }

    // Extend model answer if needed
    if (analysisData.modelAnswer && analysisData.modelAnswer.length < 300) {
      try {
        const extensionPrompt = `Extend this model answer to exactly 300+ words while maintaining the 5-step B1 structure:

${analysisData.modelAnswer}

The model answer should follow this structure:
1. Einstellung: Topic introduction and presentation structure overview
2. Persönlichen Erfahrungen: Personal experience or situation related to the topic  
3. Rolle in Heimatland: Situation in home country with specific examples
4. Vor- und Nachteile: Advantages and disadvantages with personal opinion and examples
5. Abschluss und Dank: Conclusion and thanks to audience

Make sure the extended version is exactly 300+ words and maintains natural German flow.`;

        const extensionCompletion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an expert German language instructor. Extend the model answer to exactly 300+ words while maintaining natural German flow and the 5-step B1 structure."
            },
            {
              role: "user",
              content: extensionPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        });

        const extendedContent = extensionCompletion.choices[0]?.message?.content;
        if (extendedContent) {
          analysisData.modelAnswer = extendedContent.trim();
        }
      } catch (error) {
        console.error("Error extending model answer:", error);
      }
    }

    // Database save is now handled in the main POST function

    return {
      success: true,
      ...analysisData
    };

  } catch (error) {
    console.error("Error in generateAnalysis:", error);
    throw error; // Re-throw the error to be handled by the calling function
  }
}

// Process audio analysis for Teil 3
async function processAudioAnalysis(audio: File, type: string, topic: string) {
  try {
    // Use the audio file directly with OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
      language: "de"
    });

    const transcript = transcription.text;
    
    // Generate analysis using the existing logic
    return await generateAnalysis(transcript, topic, '', '', 'de');
  } catch (error) {
    console.error('Error processing audio analysis:', error);
    return NextResponse.json({ error: 'Failed to process audio' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    
    // Handle FormData (audio analysis)
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      const audio = formData.get('audio') as File;
      const type = formData.get('type') as string;
      const topic = formData.get('topic') as string;
      
      if (!audio) {
        return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
      }
      
      // Process audio analysis
      return await processAudioAnalysis(audio, type, topic);
    }
    
    // Handle JSON (presentation generation)
    const { type, transcript, topic, description, vorteile, nachteile, language = 'de' } = await request.json();
    
    // Handle presentation generation
    if (type === 'presentation') {
      if (!topic) {
        return NextResponse.json({ error: "No topic provided" }, { status: 400 });
      }
      return await generatePresentation(topic, description);
    }
    
    // Handle audio analysis with transcript
    if (!transcript) {
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
    }

    // Generate analysis using the new function
    const result = await generateAnalysis(transcript, topic, vorteile, nachteile, language);
    
    // Save to database
    try {
      console.log("Saving Teil 2 (Speaking) results to database...");
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
        teilType: 'teil2',
        topic: topic,
        status: 'completed',
        audioUrl: null, // Will be set by the calling function if available
        createdAt: new Date(),
        updatedAt: new Date(),
        ...result
      };
      
      await audioMemos.insertOne(testRecord);
      console.log("Teil 2 (Speaking) results saved to database:", testRecord._id);
      
    } catch (dbError) {
      console.error('Error saving to database:', dbError);
      console.error('Database error details:', {
        message: dbError instanceof Error ? dbError.message : String(dbError),
        stack: dbError instanceof Error ? dbError.stack : undefined
      });
      // Continue with response even if database save fails
    }
    
    return NextResponse.json(result);

  } catch (error) {
    console.error("Error in speaking analysis:", error);
    return NextResponse.json(
      { error: "Failed to analyze speaking performance" },
      { status: 500 }
    );
  }
}