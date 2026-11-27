import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SAMPLE_TOPICS = {
  'vegetarisch_essen': {
    title: 'Vegetarisch essen',
    Vorteile: ['Vegetarisch ist Gesund',
      'Man schützt sich vor gefährlichen Krankheiten wie: Krebs, Cholesterin und Diabetes', 'Man ist immer fit', 'Man bleibt schlank', 'Tiere haben auch Recht auf Leben'],
    Nachteile: [
      'der Körper braucht Eiweiß und wichtige Nahrungsstoffe',
      'Fleisch spielt eine große Rolle in der Ernährung besonders bei kleinen Kindern',
      'Vegetarisches Essen schmeckt nicht und macht nicht satt.']
  },
  'fleisch_essen': {
    title: 'Fleisch essen',
    Vorteile: ['liefert Eiweiß', 'wichtige Nährstoffe', 'besonders wichtig für Kinder'],
    Nachteile: ['ungesund bei Übermaß', 'verursacht Krankheiten', 'macht dick']
  },
  'fast_food': {
    title: 'Fast Food',
    Vorteile: [
      'FF schmeckt gut wenn man FF isst, spart man Zeit',
      'FF ist preiswert',
      'Man kann von zu Hause oder vom Büro etwas bestellen',
    ],
    Nachteile: ['FF ist ungesund und verursacht viele Krankheiten wie: Krebs und Diabetes', 'FF macht dick und faul', 'Man weiß nicht, woraus das besteht.']
  },
  'fertigessen': {
    title: 'Fertigessen',
    Vorteile: ['wenn man FE isst, spart man Zeit. Man kann es schnell in der Mikrowelle aufwärmen', 'FE ist preiswert und praktisch'],
    Nachteile: ['FE ist ungesund und verursacht viele Krankheiten wie: Krebs und Diabetes', 'FE macht dick und faul Man weiß nicht, woraus das besteht.']
  },
  'soziale_netzwerke/facebook': {
    title: 'Soziale Netzwerke/Facebook',
    Vorteile: [
      'Man kann mit Freunden und Familie in Kontakt bleiben',
      'Man kann neue Leute kennenlernen',
      'Man kann Informationen und Nachrichten teilen',
      'Man kann sich über verschiedene Themen informieren'
    ],
    Nachteile: [
      'Man verbringt zu viel Zeit vor dem Computer',
      'Man verliert die Privatsphäre',
      'Man kann süchtig werden',
      'Man kann gemobbt werden'
    ]
  },
  'smartphone': {
    title: 'Smartphone',
    Vorteile: [
      'Man kann überall telefonieren und Nachrichten schreiben',
      'Man hat Zugang zum Internet',
      'Man kann Apps für verschiedene Zwecke nutzen',
      'Man kann Fotos und Videos machen'
    ],
    Nachteile: [
      'Man wird abhängig vom Smartphone',
      'Man verbringt zu viel Zeit damit',
      'Es kann die Gesundheit beeinträchtigen',
      'Es kann teuer werden'
    ]
  },
  'auto_oder_fahrrad': {
    title: 'Auto oder Fahrrad?',
    Vorteile: [
      'Auto: Bequem und schnell',
      'Auto: Man kann bei jedem Wetter fahren',
      'Fahrrad: Gesund und umweltfreundlich',
      'Fahrrad: Günstig und flexibel'
    ],
    Nachteile: [
      'Auto: Teuer und umweltschädlich',
      'Auto: Staus und Parkplatzprobleme',
      'Fahrrad: Abhängig vom Wetter',
      'Fahrrad: Nicht für lange Strecken geeignet'
    ]
  },
  'dvd_oder_kino': {
    title: 'DVD oder Kino?',
    Vorteile: [
      'DVD: Man kann Filme jederzeit zu Hause sehen.',
      'DVD: Bequemer und günstiger, keine Anfahrtskosten.',
      'Kino: Große Leinwand und bessere Bild- und Tonqualität.',
      'Kino: Gemeinschaftserlebnis mit Freunden oder Familie.'
    ],
    Nachteile: [
      'DVD: Bild- und Tonqualität ist oft schlechter als im Kino.',
      'DVD: Weniger Atmosphäre.',
      'Kino: Teure Tickets und Snacks.',
      'Kino: Man muss Zeit und Fahrt einplanen.'
    ]
  }
};

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json();

    if (!topic || !SAMPLE_TOPICS[topic as keyof typeof SAMPLE_TOPICS]) {
      return NextResponse.json({ error: 'Invalid topic provided' }, { status: 400 });
    }

    const topicData = SAMPLE_TOPICS[topic as keyof typeof SAMPLE_TOPICS];

    // Generate presentation slides with detailed B1 instructions
    const presentationPrompt = `
Erstellen Sie eine 5-Folien-Präsentation zum Thema "${topicData.title}" für den Goethe B1 Test Teil 3.

KRITISCHE B1 GOETHE ZERTIFIKAT ANFORDERUNGEN:
Diese Präsentation muss der exakten 5-Schritt B1 Struktur folgen:

1. THEMA VORSTELLEN (50-70 Wörter):
   - Stellen Sie das Thema vor
   - Erklären Sie den Inhalt und die Struktur Ihrer Präsentation
   - Verwenden Sie Redemittel wie: "Heute spreche ich über...", "Ich möchte Ihnen...", "Meine Präsentation besteht aus..."

2. PERSÖNLICHE ERFAHRUNGEN (50-70 Wörter):
   - Berichten Sie von Ihrer Situation oder einem Erlebnis im Zusammenhang mit dem Thema
   - Verwenden Sie Redemittel wie: "In meiner Erfahrung...", "Ich habe bemerkt, dass...", "Als ich..."

3. ROLLE IN HEIMATLAND (50-70 Wörter):
   - Berichten Sie von der Situation in Ihrem Heimatland
   - Geben Sie konkrete Beispiele
   - Verwenden Sie Redemittel wie: "In meinem Heimatland...", "Zum Beispiel...", "Es ist üblich, dass..."

4. VOR- UND NACHTEILE (70-90 Wörter):
   - Nennen Sie die Vor- und Nachteile und sagen Sie dazu Ihre Meinung
   - Geben Sie auch Beispiele
   - Verwenden Sie die vorgegebenen Vorteile und Nachteile
   - Verwenden Sie Redemittel wie: "Ein Vorteil ist...", "Ein Nachteil ist...", "Meiner Meinung nach...", "Ich denke, dass..."

5. ABSCHLUSS UND DANK (30-50 Wörter):
   - Beenden Sie Ihre Präsentation und bedanken Sie sich bei den Zuhörern
   - Verwenden Sie Redemittel wie: "Zusammenfassend...", "Abschließend...", "Vielen Dank für Ihre Aufmerksamkeit"

VERWENDEN SIE DIESE VORTEILE UND NACHTEILE:

Vorteile:
${topicData.Vorteile.map((vorteil, index) => `${index + 1}. ${vorteil}`).join('\n')}

Nachteile:
${topicData.Nachteile.map((nachteil, index) => `${index + 1}. ${nachteil}`).join('\n')}

WICHTIGE B1 SPRACHANFORDERUNGEN:
- Verwenden Sie angemessenen B1-Wortschatz
- Verwenden Sie B1-Grammatikstrukturen (Präsens, Perfekt, Futur I, Konjunktiv II)
- Verwenden Sie Verbindungswörter (zunächst, außerdem, jedoch, deshalb, trotzdem)
- Zeigen Sie persönliche Meinung und Engagement
- Verwenden Sie Beispiele und Begründungen
- Jede Folie sollte 2-4 Sätze enthalten (insgesamt 250-350 Wörter für die gesamte Präsentation)

WICHTIG: Antworten Sie NUR mit einem gültigen JSON-Array. Verwenden Sie KEINE Markdown-Formatierung, keine Code-Blöcke, keine Erklärungen. Nur reines JSON.

KRITISCH WICHTIG: In der "content" dürfen Sie NIEMALS den Titel wiederholen. Schreiben Sie NUR den Inhalt der Präsentation. 
- FALSCH: "Thema vorstellen: Heute spreche ich über..."
- RICHTIG: "Heute spreche ich über..."
- FALSCH: "Persönliche Erfahrungen: In meiner Erfahrung..."
- RICHTIG: "In meiner Erfahrung..."
- FALSCH: "Vor- und Nachteile: Ein Vorteil ist..."
- RICHTIG: "Ein Vorteil ist..."

Der Titel wird automatisch angezeigt, wiederholen Sie ihn NICHT im Inhalt!

Format (BEISPIEL - beachten Sie, dass der Inhalt NIEMALS den Titel wiederholt):
[
  {
    "id": "slide_1",
    "title": "Thema vorstellen",
    "content": "Heute spreche ich über das Thema Ernährung. Meine Präsentation besteht aus fünf Teilen."
  },
  {
    "id": "slide_2", 
    "title": "Persönliche Erfahrungen",
    "content": "In meiner Erfahrung mit gesunder Ernährung habe ich verschiedene Aspekte bemerkt."
  },
  {
    "id": "slide_3",
    "title": "Rolle in Heimatland", 
    "content": "In meinem Heimatland ist gesunde Ernährung sehr wichtig. Es gibt verschiedene Meinungen dazu."
  },
  {
    "id": "slide_4",
    "title": "Vor- und Nachteile",
    "content": "Ein Vorteil ist, dass gesunde Ernährung gut für die Gesundheit ist. Ein Nachteil ist, dass es teurer sein kann."
  },
  {
    "id": "slide_5",
    "title": "Abschluss und Dank",
    "content": "Zusammenfassend ist gesunde Ernährung wichtig. Vielen Dank für Ihre Aufmerksamkeit."
  }
]

Stellen Sie sicher, dass die Präsentation:
- Der exakten B1 Goethe Zertifikat Struktur folgt
- Alle 5 Schritte in der richtigen Reihenfolge enthält
- Angemessenen B1-Wortschatz und -Grammatik verwendet
- Persönliche Meinung und Beispiele enthält
- Die vorgegebenen Vorteile und Nachteile einbezieht
- Insgesamt 250-350 Wörter umfasst
- In der "content" KEINE Titel wiederholt

NOCHMALS WICHTIG: Schreiben Sie in der "content" NUR den Inhalt der Präsentation. Wiederholen Sie NIEMALS den Titel wie "Thema vorstellen:", "Persönliche Erfahrungen:", etc. Der Titel wird automatisch angezeigt!
`;

    const presentationResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Sie sind ein Experte für Goethe B1 Testvorbereitung und erstellen strukturierte Präsentationen für Teil 3 des Tests. Sie kennen die exakte 5-Schritt B1 Struktur und verwenden angemessenen B1-Wortschatz, B1-Grammatik und Redemittel. Ihre Präsentationen folgen strikt den Goethe B1 Zertifikat Anforderungen und sind für 3-minütige Vorträge geeignet. WICHTIG: In der "content" schreiben Sie NUR den Inhalt der Präsentation, OHNE den Titel zu wiederholen.'
        },
        {
          role: 'user',
          content: presentationPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    let presentation;
    try {
      let content = presentationResponse.choices[0].message.content || '[]';
      
      // Remove markdown code blocks if present
      if (content.includes('```json')) {
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (content.includes('```')) {
        content = content.replace(/```\n?/g, '');
      }
      
      // Clean up any remaining whitespace
      content = content.trim();
      
      console.log('Raw AI response:', content);
      
      presentation = JSON.parse(content);
    } catch (error) {
      console.error('Error parsing presentation JSON:', error);
      console.error('Raw content that failed to parse:', presentationResponse.choices[0].message.content);
      
      // Fallback: Create a basic B1 presentation structure
      presentation = [
        {
          id: 'slide_1',
          title: 'Thema vorstellen',
          content: `Heute spreche ich über ${topicData.title}. Meine Präsentation besteht aus fünf Teilen: Einführung, persönliche Erfahrungen, Situation in meinem Heimatland, Vor- und Nachteile sowie einem Fazit.`
        },
        {
          id: 'slide_2',
          title: 'Persönliche Erfahrungen',
          content: `In meiner Erfahrung mit ${topicData.title} habe ich bemerkt, dass es verschiedene Aspekte gibt. Als ich mich damit beschäftigt habe, wurde mir klar, wie wichtig dieses Thema ist.`
        },
        {
          id: 'slide_3',
          title: 'Rolle in Heimatland',
          content: `In meinem Heimatland ist ${topicData.title} ein wichtiges Thema. Zum Beispiel ist es üblich, dass Menschen verschiedene Meinungen dazu haben. Es gibt spezifische Situationen, die zeigen, wie relevant es ist.`
        },
        {
          id: 'slide_4',
          title: 'Vor- und Nachteile',
          content: `Ein Vorteil ist, dass ${topicData.Vorteile[0]}. Ein weiterer Vorteil ist, dass ${topicData.Vorteile[1]}. Ein Nachteil ist jedoch, dass ${topicData.Nachteile[0]}. Meiner Meinung nach ist es wichtig, beide Seiten zu betrachten.`
        },
        {
          id: 'slide_5',
          title: 'Abschluss und Dank',
          content: 'Zusammenfassend ist es wichtig, alle Aspekte von diesem Thema zu verstehen. Vielen Dank für Ihre Aufmerksamkeit.'
        }
      ];
    }

    // Generate audio for each slide
    const presentationWithAudio = await Promise.all(
      presentation.map(async (slide: { id: string; title: string; content: string }, index: number) => {
        try {
          const audioResponse = await openai.audio.speech.create({
            model: 'tts-1',
            voice: 'alloy',
            input: slide.content,
            response_format: 'mp3'
          });

          const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
          
          // Convert audio to base64 for response
          const audioBase64 = audioBuffer.toString('base64');
          const audioUrl = `data:audio/mp3;base64,${audioBase64}`;

          return {
            ...slide,
            audioUrl
          };
        } catch (error) {
          console.error(`Error generating audio for slide ${index}:`, error);
          return slide; // Return slide without audio if generation fails
        }
      })
    );

    return NextResponse.json({
      success: true,
      presentation: presentationWithAudio
    });

  } catch (error) {
    console.error('Error generating presentation:', error);
    return NextResponse.json({ error: 'Failed to generate presentation' }, { status: 500 });
  }
}
