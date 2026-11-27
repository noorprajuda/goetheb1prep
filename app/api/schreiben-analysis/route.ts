import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Language configurations
const languages = {
  de: {
    system: `Du bist ein Experte für das Goethe B1 Zertifikat Schreibprüfung. Du bewertest Texte nach den offiziellen B1-Kriterien und gibst detailliertes Feedback auf Deutsch.`,
    feedbackLanguage: 'Deutsch'
  },
  en: {
    system: `You are an expert for the Goethe B1 Certificate writing exam. You evaluate texts according to official B1 criteria and provide detailed feedback in English.`,
    feedbackLanguage: 'English'
  }
};

// Generate analysis for schreiben test
async function generateAnalysis(text: string, topic: string, vorteile: string, nachteile: string, language: string, teil: string) {
  const lang = languages[language as keyof typeof languages] || languages.de;
  
  const minWords = teil === 'teil1' ? 150 : 200;
  const maxWords = teil === 'teil1' ? 300 : 400;
  
  const analysisPrompt = `
Bewerten Sie den folgenden Text nach den Goethe B1 Schreibkriterien für ${teil.toUpperCase()}:

**Thema:** ${topic}
**Vorteile:** ${vorteile}
**Nachteile:** ${nachteile}

**Text des Lerners:**
"${text}"

**Bewertungskriterien für B1 Schreiben:**
1. **Grammatik (25%)**: Korrekte Verwendung von Grundgrammatik, Satzstrukturen, Zeiten
2. **Wortschatz (25%)**: Angemessener Wortschatz, Vielfalt, Präzision
3. **Inhalt und Struktur (25%)**: Logische Gliederung, Vollständigkeit der Aufgabe, Argumentation
4. **Aufgabenbewältigung (15%)**: Erfüllung der Schreibaufgabe, Bezug zum Thema
5. **Wortanzahl (10%)**: Angemessene Länge (${minWords}-${maxWords} Wörter)

**Aktuelle Wortanzahl:** ${text.trim().split(/\s+/).filter(word => word.length > 0).length} Wörter

Bitte geben Sie eine detaillierte Bewertung im folgenden JSON-Format zurück:

{
  "scores": {
    "grammar": [0-100],
    "vocabulary": [0-100],
    "content_structure": [0-100],
    "task_completion": [0-100],
    "word_count_adequacy": [0-100],
    "overall": [0-100]
  },
  "feedback": {
    "strengths": ["Stärke 1", "Stärke 2", "Stärke 3"],
    "areas_for_improvement": ["Verbesserungsbereich 1", "Verbesserungsbereich 2"],
    "specific_feedback": "Detaillierte Gesamtbewertung des Textes mit konkreten Beispielen",
    "recommendations": ["Empfehlung 1", "Empfehlung 2", "Empfehlung 3"]
  },
  "correctedText": "Korrigierte Version des Textes mit allen Grammatik- und Ausdrucksfehlern behoben",
  "corrections": [
    {
      "original": "Falscher Ausdruck",
      "corrected": "Korrigierter Ausdruck",
      "explanation": "Erklärung der Korrektur"
    }
  ],
  "improvements": [
    {
      "original": "Einfacher Ausdruck",
      "improved": "Verbesserter Ausdruck",
      "explanation": "Erklärung der Verbesserung"
    }
  ],
  "passed": true/false,
  "memoId": "unique_id_for_this_test"
}

**Wichtige Hinweise:**
- Bewerten Sie fair und konstruktiv
- Geben Sie konkrete Beispiele für Verbesserungen
- Berücksichtigen Sie das B1-Niveau (nicht zu streng, nicht zu nachsichtig)
- Die Gesamtpunktzahl sollte den Durchschnitt der Einzelbewertungen widerspiegeln
- "passed" sollte true sein, wenn die Gesamtpunktzahl >= 60 ist
- Korrigieren Sie alle offensichtlichen Grammatik- und Rechtschreibfehler
- Verbessern Sie Ausdrücke, um sie natürlicher und präziser zu machen
- Geben Sie eine vollständige, korrigierte Version des Textes zurück

Bewertungssprache: ${lang.feedbackLanguage}.`;

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
    const jsonStart = response.indexOf('{');
    const jsonEnd = response.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      const cleanedResponse = response.substring(jsonStart, jsonEnd + 1);
      analysisData = JSON.parse(cleanedResponse);
    } else {
      throw new Error('No valid JSON found in response');
    }
  } catch (parseError) {
    console.error('Error parsing OpenAI response:', parseError);
    console.error('Raw response:', response);
    
    // Fallback analysis if JSON parsing fails
    analysisData = {
      scores: {
        grammar: 50,
        vocabulary: 50,
        content_structure: 50,
        task_completion: 50,
        word_count_adequacy: 50,
        overall: 50
      },
      feedback: {
        strengths: ['Text zeigt grundlegende B1-Kompetenzen'],
        areas_for_improvement: ['Weitere Übung empfohlen'],
        specific_feedback: 'Der Text wurde analysiert, aber es gab ein Problem bei der detaillierten Bewertung.',
        recommendations: ['Weitere Übung mit ähnlichen Themen']
      },
      correctedText: text,
      corrections: [],
      improvements: [],
      passed: false,
      memoId: `schreiben-${Date.now()}`
    };
  }

  // Deterministic word count score and safe defaults
  try {
    const wordCount = (text || '').trim().split(/\s+/).filter(Boolean).length;
    const targetWords = teil === 'teil1' ? 80 : teil === 'teil2' ? 200 : 40; // Teil 3 targets 40 words
    const wordScore = Math.min(100, Math.round((wordCount / targetWords) * 100));

    // Ensure scores object exists
    analysisData.scores = analysisData.scores || {};
    analysisData.scores.word_count_adequacy = wordScore;

    // Ensure other score fields exist with reasonable defaults if missing
    const defaults = {
      grammar: 50,
      vocabulary: 50,
      content_structure: 50,
      task_completion: 50,
    } as Record<string, number>;
    for (const k of Object.keys(defaults)) {
      if (typeof analysisData.scores[k] !== 'number') {
        analysisData.scores[k] = defaults[k];
      }
    }

    // Recompute overall as average of available keys
    const keys = ['grammar','vocabulary','content_structure','task_completion','word_count_adequacy'];
    const sum = keys.reduce((acc, k) => acc + (Number(analysisData.scores[k]) || 0), 0);
    analysisData.scores.overall = Math.round(sum / keys.length);

    // Passed threshold: overall >= 60
    analysisData.passed = analysisData.scores.overall >= 60;
  } catch {
    // If anything goes wrong, do not block response
  }

  // Generate model answer based on task, user input, and feedback
  if (teil === 'teil1' || teil === 'teil2' || teil === 'teil3') {
    try {
      const modelPrompt = `Create a perfect model answer for this German B1 writing task:

Task: ${topic}
Task Description: ${vorteile || 'N/A'}
User's Text: ${text}

Based on the task requirements and considering the feedback areas for improvement, write a model answer that demonstrates:
- Perfect grammar and vocabulary
- Proper structure (Anrede, Einleitung, Hauptteil, Schluss)
- Appropriate word count (${teil === 'teil1' ? '80' : teil === 'teil2' ? '200' : '40'} words)
- All required elements from the task

Write the model answer in German:`;

      const modelResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert German B1 writing instructor. Create perfect model answers that demonstrate excellent German writing skills." },
          { role: "user", content: modelPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      analysisData.modelAnswer = modelResponse.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('Error generating model answer:', error);
      analysisData.modelAnswer = '';
    }
  }

  // Add transcript field for consistency
  analysisData.transcript = text;

  return analysisData;
}

export async function POST(request: NextRequest) {
  try {
    const { type, text, topic, vorteile, nachteile, language = 'de' } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    if (!topic) {
      return NextResponse.json({ error: "No topic provided" }, { status: 400 });
    }

    // Generate analysis using the new function
    const result = await generateAnalysis(text, topic, vorteile, nachteile, language, type);
    
    // Save to database
    try {
      console.log('Saving schreiben test results to database...');
      
      // Here you would save to your database
      // For now, we'll just log the results
      console.log('Schreiben test results:', {
        type,
        topic,
        textLength: text.length,
        scores: result.scores,
        passed: result.passed,
        memoId: result.memoId
      });
      
    } catch (dbError) {
      console.error('Error saving to database:', dbError);
      // Continue with the response even if database save fails
    }

    return NextResponse.json({ 
      results: result,
      success: true 
    });
    
  } catch (error) {
    console.error('Error in schreiben analysis API:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze text',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

