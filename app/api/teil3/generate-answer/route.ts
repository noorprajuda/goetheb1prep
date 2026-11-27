import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { question, topic, presentation, qaSessions } = await request.json();

    if (!question) {
      return NextResponse.json({ error: 'No question provided' }, { status: 400 });
    }

    console.log('Teil 3 Generate Answer API: Request received');
    console.log('Question:', question);
    console.log('Topic:', topic);

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

Aktuelle Frage: ${question}

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

    return NextResponse.json({
      success: true,
      answer: answer
    });

  } catch (error) {
    console.error('Error generating answer:', error);
    return NextResponse.json({ 
      error: 'Failed to generate answer',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

