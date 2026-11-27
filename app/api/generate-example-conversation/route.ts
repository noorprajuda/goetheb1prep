import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ConversationTurn {
  speaker: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export async function POST(request: NextRequest) {
  try {
    const { userConversation, taskContext } = await request.json();

    if (!userConversation || !Array.isArray(userConversation)) {
      return NextResponse.json(
        { error: 'Invalid conversation data' },
        { status: 400 }
      );
    }

    // Extract key information from user conversation
    const userMessages = userConversation.filter(turn => turn.speaker === 'user');
    const allUserText = userMessages.map(msg => msg.text).join(' ');
    
    // Find mentions of names, times, and key details
    const nameMatch = allUserText.match(/(?:unser|unserer|unserem)\s+(\w+)/i);
    const timeMatch = allUserText.match(/(?:um|am)\s+(\d{1,2}:\d{2}|\d{1,2}\s+Uhr)/i);
    const dayMatch = allUserText.match(/(?:am|um)\s+(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag)/i);
    
    const personName = nameMatch ? nameMatch[1] : 'Bayu';
    const visitTime = timeMatch ? timeMatch[1] : '10 Uhr';
    const visitDay = dayMatch ? dayMatch[1] : 'Samstag';

    // Create a prompt for the AI to generate an improved example conversation
    const prompt = `Du bist ein Experte für B1 Goethe Zertifikat Prüfungen. Erstelle eine verbesserte Beispielkonversation für die Aufgabe "Gemeinsam etwas planen" basierend auf der tatsächlichen Benutzerkonversation.

TASK CONTEXT: ${taskContext}

USER'S ACTUAL CONVERSATION:
${userConversation.map(turn => `${turn.speaker === 'user' ? 'Sie' : 'KI'}: ${turn.text}`).join('\n')}

EXTRACTED DETAILS FROM USER CONVERSATION:
- Person: ${personName}
- Zeit: ${visitDay} um ${visitTime}
- Kontext: Krankenhausbesuch planen

Erstelle eine verbesserte, natürlichere Konversation, die:
1. Die gleichen Details verwendet (${personName}, ${visitDay} um ${visitTime})
2. B1-Level Redemittel und Struktur zeigt
3. Natürliche Gesprächsflüsse demonstriert
4. Zustimmung, Ablehnung, Vorschläge und Einigung enthält
5. Mindestens 8-12 Gesprächsrunden hat
6. Mit einer natürlichen Begrüßung beginnt und mit Verabschiedung endet

Antworte NUR mit dem JSON-Array der Konversation im Format:
[
  {"speaker": "user", "text": "Text hier", "timestamp": 1234567890},
  {"speaker": "ai", "text": "Text hier", "timestamp": 1234567890}
]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Du bist ein Experte für B1 Goethe Zertifikat Prüfungen. Erstelle verbesserte Beispielkonversationen basierend auf Benutzerinput. Antworte NUR mit gültigem JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let conversation: ConversationTurn[];
    try {
      // Clean the response to extract JSON
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        conversation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Raw response:', content);
      
      // Fallback to a basic conversation
      conversation = [
        { 
          speaker: 'user', 
          text: `Hallo! Weißt du was? Ich habe gehört, dass ${personName} vom Deutschkurs krank ist und im Krankenhaus liegt. Das tut mir wirklich leid. Ich möchte ihn gerne besuchen kommen. Können wir das zusammen planen?`, 
          timestamp: Date.now() 
        },
        { 
          speaker: 'ai', 
          text: `Hallo! Danke, dass du fragst. Ja, ich habe auch gehört, dass es ${personName} nicht gut geht. Ein Besuch würde ihn sicher sehr freuen! Wann hättest du denn Zeit? Und wie kommst du zum Krankenhaus?`, 
          timestamp: Date.now() 
        }
      ];
    }

    return NextResponse.json({ conversation });

  } catch (error) {
    console.error('Error generating example conversation:', error);
    return NextResponse.json(
      { error: 'Failed to generate example conversation' },
      { status: 500 }
    );
  }
}
