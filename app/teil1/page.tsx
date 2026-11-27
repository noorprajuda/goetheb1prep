"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MessageSquare, User, Bot, Download, CheckCircle, XCircle, Copy, Square, Volume2 } from "lucide-react";
import Link from "next/link";
// import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
// import { useApi } from "@/hooks/useApi";
import TranslatedText from "@/components/TranslatedText";
import TopicSelection from "@/components/shared/TopicSelection";
import { usePagination } from "@/hooks/usePagination";
import { copyToClipboard } from "@/lib/sharedUtils";
import LoadingCard from "@/components/shared/LoadingCard";

// Import Topic type from TopicSelection component
type Topic = {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  [key: string]: string | number | boolean | string[] | undefined;
};

interface Teil1Topic {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  conversationPoints: string[];
  agreePoints: string[];
  disagreePoints: string[];
  redemittel: {
    agreement: string[];
    disagreement: string[];
    conclusion: string[];
  };
  [key: string]: string | number | boolean | string[] | undefined | { agreement: string[]; disagreement: string[]; conclusion: string[]; };
}

interface ConversationTurn {
  speaker: 'user' | 'ai';
  text: string;
  audioUrl?: string;
  timestamp: number;
}

interface Teil1Results {
  conversation: ConversationTurn[];
  combinedAudioUrl?: string;
  summary: string;
  grammarCorrections: {
    original: string;
    corrected: string;
    explanation: string;
  }[];
  betterExpressions: {
    original: string;
    improved: string;
    explanation: string;
  }[];
  redemittelUsed: {
    category: 'agreement' | 'disagreement' | 'conclusion';
    phrase: string;
    context: string;
  }[];
  scores: {
    fluency: number;
    vocabulary: number;
    grammar: number;
    pronunciation: number;
    task_completion: number;
    overall: number;
  };
  passed: boolean;
  feedback?: {
    strengths: string[];
    areas_for_improvement: string[];
    specific_feedback: string;
    recommendations: string[];
  };
  modelAnswer?: string;
  modelAnswerExplanation?: string[];
}

const TEIL1_TOPICS: Teil1Topic[] = [
  {
    id: 'krankenhaus_besuch',
    title: 'Krankenhausbesuch planen',
    description: 'Dauer: circa drei Minuten',
    keywords: ['Krankenhaus', 'Besuch', 'Geschenk', 'Hilfe', 'Planung'],
    conversationPoints: [
      'Ein Teilnehmer aus dem Deutschkurs hatte einen Unfall und liegt im Krankenhaus.',
      'Diese Woche möchten Sie ihn besuchen und ein Geschenk von der ganzen Gruppe mitbringen.',
      'Nächste Woche kann er das Krankenhaus verlassen.',
      'Da er allein lebt, wird er Hilfe brauchen.',
      'Überlegen Sie, wie Sie ihn unterstützen können.'
    ],
    agreePoints: [
      'Besuch am Wochenende ist am besten',
      'Blumen sind ein schönes Geschenk',
      'Wir sollten ihn vom Krankenhaus abholen',
      'Einkaufen helfen ist wichtig'
    ],
    disagreePoints: [
      'Besuch unter der Woche ist besser',
      'Süßigkeiten sind ungesund',
      'Er kann allein nach Hause fahren',
      'Hilfe ist nicht nötig'
    ],
    redemittel: {
      agreement: [
        'Das ist eine gute Idee!',
        'Genau, das sollten wir machen.',
        'Ich bin dafür.',
        'Das finde ich auch gut.',
        'Ja, das ist sinnvoll.'
      ],
      disagreement: [
        'Ich denke anders darüber.',
        'Das sehe ich nicht so.',
        'Ich würde vorschlagen...',
        'Das ist vielleicht nicht die beste Idee.',
        'Lass uns überlegen...'
      ],
      conclusion: [
        'Also, wir machen folgendes...',
        'Zusammenfassend...',
        'Wir haben uns geeinigt...',
        'Das ist unser Plan...',
        'Alles klar, dann...'
      ]
    }
  },
  {
    id: 'geburtstag_party',
    title: 'Geburtstagsparty organisieren',
    description: 'Dauer: circa drei Minuten',
    keywords: ['Geburtstag', 'Party', 'Organisation', 'Feier', 'Gäste'],
    conversationPoints: [
      'Ihr Freund/ Ihre Freundin hat nächste Woche Geburtstag.',
      'Sie möchten eine Überraschungsparty organisieren.',
      'Es soll eine kleine Feier mit engen Freunden werden.',
      'Sie müssen Ort, Zeit, Essen und Geschenke planen.',
      'Überlegen Sie gemeinsam, wie die Party ablaufen soll.'
    ],
    agreePoints: [
      'Party am Abend ist am besten',
      'Zu Hause feiern ist gemütlicher',
      'Kuchen backen ist eine gute Idee',
      'Geschenke zusammen kaufen'
    ],
    disagreePoints: [
      'Nachmittag ist besser',
      'Restaurant ist praktischer',
      'Kuchen kaufen ist einfacher',
      'Jeder kauft sein eigenes Geschenk'
    ],
    redemittel: {
      agreement: [
        'Das ist eine super Idee!',
        'Genau, das passt perfekt.',
        'Ich bin einverstanden.',
        'Das finde ich auch gut.',
        'Ja, das ist praktisch.'
      ],
      disagreement: [
        'Ich denke, das ist nicht ideal.',
        'Das sehe ich anders.',
        'Ich würde lieber...',
        'Das ist vielleicht zu kompliziert.',
        'Lass uns das nochmal überlegen...'
      ],
      conclusion: [
        'Also, wir organisieren folgendes...',
        'Zusammenfassend...',
        'Wir haben uns geeinigt...',
        'Das ist unser Plan...',
        'Alles klar, dann...'
      ]
    }
  },
  {
    id: 'urlaub_planen',
    title: 'Gemeinsamen Urlaub planen',
    description: 'Dauer: circa drei Minuten',
    keywords: ['Urlaub', 'Reise', 'Planung', 'Ziel', 'Budget'],
    conversationPoints: [
      'Sie und Ihr Freund/ Ihre Freundin möchten in den Sommerferien verreisen.',
      'Sie haben beide zwei Wochen frei.',
      'Das Budget ist begrenzt, aber Sie möchten trotzdem etwas Schönes erleben.',
      'Sie müssen Ziel, Unterkunft, Transport und Aktivitäten planen.',
      'Überlegen Sie gemeinsam, wohin die Reise gehen soll.'
    ],
    agreePoints: [
      'Deutschland ist günstiger',
      'Zug fahren ist umweltfreundlich',
      'Camping spart Geld',
      'Städtereise ist interessant'
    ],
    disagreePoints: [
      'Ausland ist spannender',
      'Flugzeug ist schneller',
      'Hotel ist bequemer',
      'Strandurlaub ist entspannender'
    ],
    redemittel: {
      agreement: [
        'Das ist eine tolle Idee!',
        'Genau, das gefällt mir.',
        'Ich bin dabei.',
        'Das finde ich auch gut.',
        'Ja, das ist eine gute Wahl.'
      ],
      disagreement: [
        'Ich denke, das ist nicht das Beste.',
        'Das sehe ich nicht so.',
        'Ich würde vorschlagen...',
        'Das ist vielleicht zu teuer.',
        'Lass uns andere Optionen überlegen...'
      ],
      conclusion: [
        'Also, wir fahren nach...',
        'Zusammenfassend...',
        'Wir haben uns geeinigt...',
        'Das ist unser Plan...',
        'Alles klar, dann...'
      ]
    }
  },
  {
    id: 'wohnung_suchen',
    title: 'Wohnungssuche besprechen',
    description: 'Dauer: circa drei Minuten',
    keywords: ['Wohnung', 'Suche', 'Miete', 'Lage', 'Größe'],
    conversationPoints: [
      'Sie suchen eine neue Wohnung und haben eine interessante Anzeige gefunden.',
      'Die Wohnung ist in einem guten Viertel, aber etwas teuer.',
      'Sie möchten die Wohnung besichtigen und brauchen jemanden, der mitkommt.',
      'Überlegen Sie gemeinsam, ob die Wohnung geeignet ist.',
      'Besprechen Sie Vor- und Nachteile der Wohnung.'
    ],
    agreePoints: [
      'Gute Lage ist wichtig',
      'Besichtigung ist sinnvoll',
      'Teuer, aber es lohnt sich',
      'Schnell entscheiden ist nötig'
    ],
    disagreePoints: [
      'Zu teuer für das Budget',
      'Wohnung ist zu klein',
      'Viertel ist nicht sicher',
      'Noch andere Optionen prüfen'
    ],
    redemittel: {
      agreement: [
        'Das ist eine gute Entscheidung!',
        'Genau, das sollten wir machen.',
        'Ich bin dafür.',
        'Das finde ich auch richtig.',
        'Ja, das ist vernünftig.'
      ],
      disagreement: [
        'Ich denke, das ist nicht klug.',
        'Das sehe ich anders.',
        'Ich würde empfehlen...',
        'Das ist vielleicht zu riskant.',
        'Lass uns das nochmal überdenken...'
      ],
      conclusion: [
        'Also, wir machen folgendes...',
        'Zusammenfassend...',
        'Wir haben uns geeinigt...',
        'Das ist unser Plan...',
        'Alles klar, dann...'
      ]
    }
  },
  {
    id: 'studium_beratung',
    title: 'Studienwahl besprechen',
    description: 'Dauer: circa drei Minuten',
    keywords: ['Studium', 'Beratung', 'Zukunft', 'Karriere', 'Entscheidung'],
    conversationPoints: [
      'Sie stehen vor der Entscheidung, was Sie studieren möchten.',
      'Sie haben zwei Fächer im Kopf: Informatik und Psychologie.',
      'Beide Fächer interessieren Sie, aber Sie können sich nicht entscheiden.',
      'Sie möchten mit jemandem über die Vor- und Nachteile sprechen.',
      'Überlegen Sie gemeinsam, welches Studium besser geeignet ist.'
    ],
    agreePoints: [
      'Informatik hat gute Jobchancen',
      'Psychologie ist interessant',
      'Praktika helfen bei der Entscheidung',
      'Beratung an der Uni ist sinnvoll'
    ],
    disagreePoints: [
      'Informatik ist zu technisch',
      'Psychologie ist zu schwer',
      'Entscheidung ist zu früh',
      'Andere Fächer auch prüfen'
    ],
    redemittel: {
      agreement: [
        'Das ist eine kluge Überlegung!',
        'Genau, das ist wichtig.',
        'Ich bin einverstanden.',
        'Das finde ich auch gut.',
        'Ja, das ist vernünftig.'
      ],
      disagreement: [
        'Ich denke, das ist nicht richtig.',
        'Das sehe ich nicht so.',
        'Ich würde vorschlagen...',
        'Das ist vielleicht zu vorschnell.',
        'Lass uns das nochmal überlegen...'
      ],
      conclusion: [
        'Also, wir machen folgendes...',
        'Zusammenfassend...',
        'Wir haben uns geeinigt...',
        'Das ist unser Plan...',
        'Alles klar, dann...'
      ]
    }
  }
];

const CONVERSATION_PHASES = {
  TOPIC_SELECTION: 'topic_selection',
  INTRODUCTION: 'introduction',
  DISCUSSION: 'discussion',
  DISAGREEMENT: 'disagreement',
  AGREEMENT: 'agreement',
  CONCLUSION: 'conclusion',
  FINISHED: 'finished',
  RESULTS: 'results'
};

export default function Teil1Page() {
  // const { t } = useTranslation();
  const { user } = useAuth();
  // const { apiCall } = useApi();

  // State management
  const [selectedTopic, setSelectedTopic] = useState<Teil1Topic | null>(null);
  const [currentPhase, setCurrentPhase] = useState(CONVERSATION_PHASES.TOPIC_SELECTION);

  // Use pagination hook
  const pagination = usePagination({
    itemsPerPage: 3,
    totalItems: TEIL1_TOPICS.length,
    initialPage: 1
  });
  const [isRecording, setIsRecording] = useState(false);
  // const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [isConversationFinished, setIsConversationFinished] = useState(false);
  const [hasTimerStarted, setHasTimerStarted] = useState(false);
  const [isExamining, setIsExamining] = useState(false);
  const [results, setResults] = useState<Teil1Results | null>(null);
  const [speakingTime, setSpeakingTime] = useState(0);
  // Timer runs for 3 minutes then automatically examines conversation
  const [isMicSupported, setIsMicSupported] = useState<boolean | null>(null);
  // Removed useRealtimeMode - using traditional recording mode only

  // Button states for results sections
  // const [copiedGrammar, setCopiedGrammar] = useState(false);
  // const [copiedCorrected, setCopiedCorrected] = useState(false);
  // const [copiedSpeaking, setCopiedSpeaking] = useState(false);
  const [speakingGrammar, setSpeakingGrammar] = useState(false);
  const [speakingCorrected, setSpeakingCorrected] = useState(false);
  const [speakingSpeaking, setSpeakingSpeaking] = useState(false);
  const [isLoadingSpeakingIdeas, setIsLoadingSpeakingIdeas] = useState(false);
  const speakingRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const [speakingConversation, setSpeakingConversation] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const conversationRef = useRef(false);
  const [speakingOriginal, setSpeakingOriginal] = useState(false);
  // const [isDownloadingGrammar, setIsDownloadingGrammar] = useState(false);
  const [isDownloadingCorrected, setIsDownloadingCorrected] = useState(false);
  const [isDownloadingSpeaking, setIsDownloadingSpeaking] = useState(false);
  const [isDownloadingSpeakingIdeas, setIsDownloadingSpeakingIdeas] = useState(false);
  const [isDownloadingOriginal, setIsDownloadingOriginal] = useState(false);
  const [exampleConversation, setExampleConversation] = useState<ConversationTurn[]>([]);
  const [isGeneratingExample, setIsGeneratingExample] = useState(false);
  const [isClearingConversation, setIsClearingConversation] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentAIAudioRef = useRef<HTMLAudioElement | null>(null);
  const speakingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to clean up GridFS audio files from the current test session
  const cleanupTestAudioFiles = async () => {
    try {
      console.log('Cleaning up test audio files...');
      
      // Extract file IDs from conversation turns
      const fileIds: string[] = [];
      
      // Get file IDs from user audio URLs
      conversation.forEach(turn => {
        if (turn.audioUrl && turn.audioUrl.includes('fileId=')) {
          const fileId = turn.audioUrl.split('fileId=')[1];
          // Basic validation - check if it looks like a valid ObjectId (24 hex characters)
          if (fileId && fileId.length === 24 && /^[0-9a-fA-F]+$/.test(fileId)) {
            fileIds.push(fileId);
          }
        }
      });
      
      // Note: The main conversation state should contain all audio files we need to clean up
      // The results conversation is a copy of the main conversation, so we don't need to check it separately
      
      console.log('Found audio file IDs to clean up:', fileIds);
      
      if (fileIds.length > 0) {
        // Call cleanup API
        const response = await fetch('/api/cleanup-test-audio', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fileIds }),
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Audio cleanup successful:', result);
        } else {
          console.error('Audio cleanup failed:', response.statusText);
        }
      }
    } catch (error) {
      console.error('Error cleaning up audio files:', error);
    }
  };

  // Check microphone support after component mounts
  useEffect(() => {
    const checkMicrophoneSupport = async () => {
      try {
        if (typeof window !== 'undefined') {
          if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
            // Just check if the API is available, don't request permission yet
            setIsMicSupported(true);
            console.log('MediaDevices API available');
          } else {
            console.log('MediaDevices API not available');
            setIsMicSupported(false);
          }
        } else {
          console.log('Not in browser environment');
          setIsMicSupported(false);
        }
      } catch (error: unknown) {
        const err = error as Error;
        console.log('Microphone check result:', err.name);
        setIsMicSupported(false);
      }
    };

    const timer = setTimeout(checkMicrophoneSupport, 100);
    return () => clearTimeout(timer);
  }, []);

  // Start directly with discussion phase
  useEffect(() => {
    if (selectedTopic && currentPhase === CONVERSATION_PHASES.INTRODUCTION) {
      setCurrentPhase(CONVERSATION_PHASES.DISCUSSION);
    }
  }, [selectedTopic, currentPhase]);

  // Load voices for TTS
  useEffect(() => {
    const loadVoices = () => {
      // Voices are loaded asynchronously, so we need to wait for them
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        // If no voices are loaded yet, wait a bit and try again
        setTimeout(loadVoices, 100);
      }
    };

    loadVoices();

    // Also listen for voice changes
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // Fallback conversation generator
  const generateFallbackConversation = useCallback((userConversation: ConversationTurn[]) => {
    // Extract key information from user conversation
    const userMessages = userConversation.filter(turn => turn.speaker === 'user');
    // const aiMessages = userConversation.filter(turn => turn.speaker === 'ai');

    // Find mentions of names, times, and key details
    const allUserText = userMessages.map(msg => msg.text).join(' ');
    const nameMatch = allUserText.match(/(?:unser|unserer|unserem)\s+(\w+)/i);
    const timeMatch = allUserText.match(/(?:um|am)\s+(\d{1,2}:\d{2}|\d{1,2}\s+Uhr)/i);
    const dayMatch = allUserText.match(/(?:am|um)\s+(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag)/i);

    const personName = nameMatch ? nameMatch[1] : 'Bayu';
    const visitTime = timeMatch ? timeMatch[1] : '10 Uhr';
    const visitDay = dayMatch ? dayMatch[1] : 'Samstag';

    // Generate a more natural conversation based on the actual user input
    return [
      {
        speaker: 'user' as const,
        text: `Hallo! Weißt du was? Ich habe gehört, dass ${personName} vom Deutschkurs krank ist und im Krankenhaus liegt. Das tut mir wirklich leid. Ich möchte ihn gerne besuchen kommen. Können wir das zusammen planen?`,
        timestamp: Date.now()
      },
      {
        speaker: 'ai' as const,
        text: `Hallo! Danke, dass du fragst. Ja, ich habe auch gehört, dass es ${personName} nicht gut geht. Ein Besuch würde ihn sicher sehr freuen! Wann hättest du denn Zeit? Und wie kommst du zum Krankenhaus?`,
        timestamp: Date.now()
      },
      {
        speaker: 'user' as const,
        text: `Das freut mich zu hören! ${visitDay} um ${visitTime} wäre gut für mich. Ich bin der Meinung, dass wir das gut organisieren können. Ich fahre mit dem Auto, aber ich kenne den Weg nicht so gut. Können Sie mir dabei helfen, die Route zu finden?`,
        timestamp: Date.now()
      },
      {
        speaker: 'ai' as const,
        text: `Das ist eine gute Idee! ${visitDay} um ${visitTime} ist perfekt. Ich schlage vor, wir schauen uns die Route zusammen an. Es gibt ein Parkhaus direkt neben dem Krankenhaus, das kostet etwa 2 Euro pro Stunde. Was hälst du davon, wenn ich dir die Wegbeschreibung gebe?`,
        timestamp: Date.now()
      },
      {
        speaker: 'user' as const,
        text: `Das ist sehr hilfreich! Ich bin damit einverstanden. Ich möchte Blumen für ${personName} mitbringen, aber ich bin mir nicht sicher, ob das erlaubt ist. Wärst du damit einverstanden, dass wir auch über die Besuchszeiten sprechen?`,
        timestamp: Date.now()
      },
      {
        speaker: 'ai' as const,
        text: `Ich bin dafür, dass wir das klären. Blumen für ${personName} sind normalerweise erlaubt, aber frag am besten nochmal an der Information nach. Die Besuchszeiten sind von 14:00 bis 18:00 Uhr. Mein Vorschlag wäre, dass du um ${visitTime} kommst, wie du gesagt hast. Was denkst du?`,
        timestamp: Date.now()
      },
      {
        speaker: 'user' as const,
        text: `Das stimmt! Auch ich bin der Meinung, dass ${visitTime} eine gute Zeit ist. Ich bin dafür, dass ich etwa eine Stunde bei ${personName} bleibe. Aber ich brauche auch Hilfe danach - wir könnten vielleicht überlegen, was ich nach dem Besuch machen soll?`,
        timestamp: Date.now()
      },
      {
        speaker: 'ai' as const,
        text: `Genau, das finde ich auch! Nach dem Besuch gibt es ein schönes Café im Krankenhaus, oder du kannst in die Innenstadt fahren. Ich bin der Ansicht, dass einkaufen gehen praktisch wäre. Du hast recht, das ist ein guter Vorschlag. Wie findest du die Idee, in die Innenstadt zu fahren?`,
        timestamp: Date.now()
      },
      {
        speaker: 'user' as const,
        text: `Ich stimme zu, dass einkaufen gehen praktisch ist. Ich bin der Meinung, dass wir das so machen können. Können wir nochmal alles zusammenfassen? Am ${visitDay} um ${visitTime}, mit dem Auto, Blumen für ${personName} mitbringen, und danach einkaufen gehen?`,
        timestamp: Date.now()
      },
      {
        speaker: 'ai' as const,
        text: `Ja, das könnten wir so machen! Zusammenfassung: ${visitDay}, ${visitTime}, mit dem Auto zum Krankenhaus, Parkhaus nutzen, Blumen für ${personName} mitbringen, etwa eine Stunde bei ${personName} bleiben, und nach dem Besuch in die Innenstadt zum Einkaufen fahren. Gut, damit bin ich einverstanden. Alles klar?`,
        timestamp: Date.now()
      },
      {
        speaker: 'user' as const,
        text: `Ja, so machen wir es! Das ist perfekt geplant. Vielen Dank für deine Hilfe und die guten Tipps. Das hat mir sehr geholfen, und ich fühle mich jetzt viel besser vorbereitet. Ich freue mich schon auf den Besuch bei ${personName}! Auf Wiedersehen!`,
        timestamp: Date.now()
      },
      {
        speaker: 'ai' as const,
        text: `Gerne geschehen! Ich wünsche dir einen schönen Besuch bei ${personName} und hoffe, dass er sich bald besser fühlt. Falls du noch Fragen hast, kannst du mich gerne fragen. Auf Wiedersehen und alles Gute!`,
        timestamp: Date.now()
      }
    ];
  }, []);

  // Generate example conversation function
  const generateExampleConversation = useCallback(async (userConversation: ConversationTurn[], taskContext: string) => {
    try {
      setIsGeneratingExample(true);
      const response = await fetch('/api/generate-example-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userConversation,
          taskContext,
          taskType: 'teil1_planning'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate example conversation');
      }

      const data = await response.json();
      setExampleConversation(data.conversation);
      return data.conversation;
    } catch (error) {
      console.error('Error generating example conversation:', error);
      // Fallback to a basic example if API fails
      const fallbackConversation = generateFallbackConversation(userConversation);
      setExampleConversation(fallbackConversation);
      return fallbackConversation;
    } finally {
      setIsGeneratingExample(false);
    }
  }, [generateFallbackConversation]);

  // Process final results function
  const processFinalResults = useCallback(async () => {
    try {
      const response = await fetch('/api/teil1/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user && { 'x-user-id': user.id }),
        },
        body: JSON.stringify({
          conversation,
          topic: selectedTopic?.id
        })
      });

      if (!response.ok) {
        let errorMessage = 'Failed to process results';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setResults(data);

      // Generate example conversation and wait for it to complete before showing results
      const taskContext = "Gemeinsam etwas planen - Ein Teilnehmer aus dem Deutschkurs hatte einen Unfall und liegt im Krankenhaus. Diese Woche möchten Sie ihn besuchen und ein Geschenk von der ganzen Gruppe mitbringen. Nächste Woche kann er das Krankenhaus verlassen. Da er allein lebt, wird er Hilfe brauchen.";
      await generateExampleConversation(data.conversation, taskContext);

      setIsExamining(false); // Hide loading animation and show results only after everything is ready
    } catch {
      console.error('Error processing results');
      setIsExamining(false); // Hide loading animation even on error

      // Show user-friendly error message
      alert('Error: Failed to process results. Please try again.');
    }
  }, [conversation, selectedTopic?.id, user, generateExampleConversation]);

  // Timer runs continuously once started (conversation duration) and auto-examines at 3 minutes
  useEffect(() => {
    if (hasTimerStarted && !isConversationFinished) {
      speakingTimerRef.current = setTimeout(() => {
        setSpeakingTime(prev => {
          const newTime = prev + 1;
          
          // Auto-examine conversation when timer reaches 3 minutes (180 seconds)
          if (newTime >= 180 && conversation.length > 0) {
            console.log('Timer reached 3 minutes - auto-examining conversation');
            // Stop all audio immediately
            stopAllAudio();
            // Set examining state to show loading and disable recording
            setIsExamining(true);
            // Mark conversation as finished to stop timer
            setIsConversationFinished(true);
            // Reset timer and timer state for next conversation
            setSpeakingTime(0);
            setHasTimerStarted(false);
            // Process the conversation automatically
            processFinalResults();
          }
          
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (speakingTimerRef.current) {
        clearTimeout(speakingTimerRef.current);
      }
    };
  }, [hasTimerStarted, isConversationFinished, speakingTime, conversation.length, processFinalResults]);

  // Auto-scroll to last user message when new messages are added
  useEffect(() => {
    // Find the last user message and scroll to it
    const lastUserMessageIndex = conversation.findLastIndex(turn => turn.speaker === 'user');
    if (lastUserMessageIndex !== -1) {
      // Create a temporary ref for the last user message
      const lastUserMessageElement = document.querySelector(`[data-message-index="${lastUserMessageIndex}"]`);
      if (lastUserMessageElement) {
        lastUserMessageElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      }
    }
  }, [conversation]);

  // Auto-scroll to transcribing indicator when it appears
  useEffect(() => {
    if (isTranscribing) {
      // Small delay to ensure the transcribing indicator is rendered
      setTimeout(() => {
        const transcribingElement = document.querySelector('[data-transcribing="true"]');
        if (transcribingElement) {
          transcribingElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          });
        }
      }, 100);
    }
  }, [isTranscribing]);

  // Example conversation is now generated directly in processFinalResults
  // No separate useEffect needed


  const startRecording = async () => {
    try {
      console.log('Starting recording...');

      // Stop any currently playing AI audio immediately
      if (currentAIAudioRef.current) {
        console.log('Stopping current AI audio...');
        currentAIAudioRef.current.pause();
        currentAIAudioRef.current.currentTime = 0;
        currentAIAudioRef.current = null;
      }

      console.log('MediaDevices available:', !!navigator.mediaDevices);
      console.log('getUserMedia available:', !!navigator.mediaDevices?.getUserMedia);
      console.log('Current URL:', window.location.href);
      console.log('Is HTTPS:', window.location.protocol === 'https:');
      console.log('Is localhost:', window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not supported');
      }

      // Check current permission state
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        console.log('Current microphone permission:', permissionStatus.state);
        
        if (permissionStatus.state === 'denied') {
          throw new Error('Microphone permission was previously denied. Please reset permissions in your browser settings.');
        }
      } catch (e) {
        console.log('Could not check permission state:', e);
      }

      console.log('Requesting microphone permission...');
      // Try with minimal constraints first to ensure permission prompt appears
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permission granted, stream:', stream);

      const options = {
        mimeType: "audio/webm;codecs=opus"
      };
      let mediaRecorder: MediaRecorder;

      if (MediaRecorder.isTypeSupported(options.mimeType)) {
        mediaRecorder = new MediaRecorder(stream, options);
      } else {
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleAudioSubmission(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100); // Request data every 100ms for better audio capture
      setIsRecording(true);
      // Start conversation timer on first recording click (runs continuously until examine button)
      if (!hasTimerStarted) {
        setHasTimerStarted(true);
      }
    } catch (error: unknown) {
      console.error('Error accessing microphone:', error);
      const err = error as Error;
      console.log('Error name:', err.name);
      console.log('Error message:', err.message);
      
      if (err.name === 'NotAllowedError') {
        const isHttps = window.location.protocol === 'https:';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        let errorMessage = 'Microphone access was denied. ';
        
        if (!isHttps && !isLocalhost) {
          errorMessage += 'This site requires HTTPS for microphone access. Please use https:// or localhost. ';
        }
        
        errorMessage += 'Please:\n\n';
        errorMessage += '1. Click the microphone icon in your browser\'s address bar\n';
        errorMessage += '2. Select "Allow" for microphone access\n';
        errorMessage += '3. Refresh the page and try again\n\n';
        errorMessage += 'If the issue persists, check your browser\'s microphone settings.';
        
        alert(errorMessage);
      } else if (err.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.');
      } else if (err.name === 'NotSupportedError') {
        alert('Microphone access is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Safari.');
      } else if (err.message.includes('previously denied')) {
        alert('Microphone permission was previously denied. Please:\n\n1. Click the microphone icon in your browser\'s address bar\n2. Select "Allow" for microphone access\n3. Refresh the page and try again');
      } else {
        alert('Could not access microphone. Please ensure you have granted permission and try again.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioSubmission = async (audioBlob: Blob) => {
    setIsTranscribing(true);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('topic', selectedTopic?.id || '');
      formData.append('phase', currentPhase);
      formData.append('conversation', JSON.stringify(conversation));

      console.log('Sending audio to Teil 1 API...');
      console.log('Audio blob size:', audioBlob.size);
      console.log('Audio blob type:', audioBlob.type);
      console.log('Topic:', selectedTopic?.id);
      console.log('Phase:', currentPhase);

      const response = await fetch('/api/teil1/process', {
        method: 'POST',
        body: formData,
        headers: {
          ...(user && { 'x-user-id': user.id }),
        },
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = 'Failed to process audio';
        try {
          const errorData = await response.json();
          console.log('Error response data:', errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.log('Failed to parse error response as JSON:', e);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        console.error('API Error:', errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Teil 1 API response:', data);

      // Switch from transcribing to processing
      setIsTranscribing(false);
      setIsProcessing(true);

      const newTurn: ConversationTurn = {
        speaker: 'user',
        text: data.userTranscript || '',
        audioUrl: data.userAudioUrl,
        timestamp: Date.now()
      };

      // Add user message first
      setConversation(prev => [...prev, newTurn]);

      // Add a delay to show AI thinking indicator
      await new Promise(resolve => setTimeout(resolve, 1000));

      const aiTurn: ConversationTurn = {
        speaker: 'ai',
        text: data.aiResponse || '',
        audioUrl: data.aiAudioUrl,
        timestamp: Date.now()
      };

      // Stop processing BEFORE adding AI response to prevent race condition
      setIsProcessing(false);

      // Add AI response after processing is stopped
      setConversation(prev => [...prev, aiTurn]);

      // Generate and play AI response audio using TTS API like realtime demo
      if (data.aiResponse) {
        console.log('Generating TTS audio for AI response:', data.aiResponse);
        try {
          const ttsResponse = await fetch('/api/tts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: data.aiResponse, voice: 'alloy' })
          });

          if (ttsResponse.ok) {
            const audioBlob = await ttsResponse.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            console.log('TTS audio generated, attempting to play...');

            const audio = new Audio(audioUrl);

            // Stop any currently playing AI audio
            if (currentAIAudioRef.current) {
              currentAIAudioRef.current.pause();
              currentAIAudioRef.current.currentTime = 0;
            }

            // Store reference to current AI audio
            currentAIAudioRef.current = audio;

            audio.play().then(() => {
              console.log('AI audio started playing successfully');
            }).catch(error => {
              console.error('Could not play AI audio:', error);
            });
          } else {
            console.error('TTS generation failed:', ttsResponse.status);
          }
        } catch (error) {
          console.error('Error generating TTS audio:', error);
        }
      } else {
        console.log('No AI response received for TTS');
      }

      // Progress through conversation phases
      if (currentPhase === CONVERSATION_PHASES.DISCUSSION) {
        setCurrentPhase(CONVERSATION_PHASES.DISAGREEMENT);
      } else if (currentPhase === CONVERSATION_PHASES.DISAGREEMENT) {
        setCurrentPhase(CONVERSATION_PHASES.AGREEMENT);
      } else if (currentPhase === CONVERSATION_PHASES.AGREEMENT) {
        setCurrentPhase(CONVERSATION_PHASES.CONCLUSION);
      } else if (currentPhase === CONVERSATION_PHASES.CONCLUSION) {
        setCurrentPhase(CONVERSATION_PHASES.FINISHED);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      setIsTranscribing(false);
      setIsProcessing(false);

      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to process audio. Please try again.';
      alert(`Error: ${errorMessage}`);
    }
  };



  // Removed real-time conversation handlers - using traditional recording mode only

  // const playCombinedAudio = () => {
  //   if (results?.combinedAudioUrl && audioRef.current) {
  //     audioRef.current.play();
  //     setIsPlaying(true);
  //   }
  // };

  // const pauseAudio = () => {
  //   if (audioRef.current) {
  //     audioRef.current.pause();
  //     setIsPlaying(false);
  //   }
  // };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // const getScoreGrade = (score: number) => {
  //   if (score >= 90) return { grade: "Sehr gut", color: "text-green-600", bgColor: "bg-green-100" };
  //   if (score >= 80) return { grade: "Gut", color: "text-green-600", bgColor: "bg-green-100" };
  //   if (score >= 70) return { grade: "Befriedigend", color: "text-blue-600", bgColor: "bg-blue-100" };
  //   if (score >= 60) return { grade: "Ausreichend", color: "text-orange-600", bgColor: "bg-orange-100" };
  //   return { grade: "Nicht bestanden", color: "text-red-600", bgColor: "bg-red-100" };
  // };

  // const getPhaseInstructions = () => {
  //   switch (currentPhase) {
  //     case CONVERSATION_PHASES.DISCUSSION:
  //       return "Beginnen Sie das Gespräch. Sprechen Sie über die Situation und machen Sie erste Vorschläge.";
  //     case CONVERSATION_PHASES.DISAGREEMENT:
  //       return "Äußern Sie eine andere Meinung zu einem Vorschlag. Verwenden Sie Redemittel der Meinungsäußerung.";
  //     case CONVERSATION_PHASES.AGREEMENT:
  //       return "Stimmen Sie einem Vorschlag zu. Verwenden Sie Redemittel der Zustimmung.";
  //     case CONVERSATION_PHASES.CONCLUSION:
  //       return "Fassen Sie Ihre gemeinsamen Entscheidungen zusammen. Verwenden Sie Redemittel der Zusammenfassung.";
  //     default:
  //       return "";
  //   }
  // };

  // Live Conversation functions

  const stopAllAudio = () => {
    // Stop any currently playing AI audio
    if (currentAIAudioRef.current) {
      currentAIAudioRef.current.pause();
      currentAIAudioRef.current.currentTime = 0;
      currentAIAudioRef.current = null;
    }

    // Stop any other audio elements
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Stop any speech synthesis
    window.speechSynthesis.cancel();

    // Reset all speaking states
    setSpeakingConversation(false);
    setSpeakingSpeaking(false);
    setSpeakingGrammar(false);
    setSpeakingCorrected(false);
    setSpeakingOriginal(false);
  };

  const renderProcessing = () => (
    <LoadingCard type="processing" />
  );

  const clearConversation = async () => {
    setIsClearingConversation(true);

    try {
      // Call API to delete conversation data if there's any conversation to delete
      if (conversation.length > 0) {
        const response = await fetch('/api/teil1/clear-conversation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: selectedTopic?.id || 'current',
            phase: currentPhase
          }),
        });

        if (!response.ok) {
          console.error('Failed to clear conversation on server');
          // Continue with local clearing even if API fails
        }
      }
    } catch (error) {
      console.error('Error clearing conversation:', error);
      // Continue with local clearing even if API fails
    }

    // Stop any currently playing AI audio
    if (currentAIAudioRef.current) {
      currentAIAudioRef.current.pause();
      currentAIAudioRef.current.currentTime = 0;
      currentAIAudioRef.current = null;
    }

    // Stop any speech synthesis
    window.speechSynthesis.cancel();

    // Reset all speaking states
    setSpeakingConversation(false);
    setSpeakingSpeaking(false);
    setSpeakingGrammar(false);
    setSpeakingCorrected(false);
    setSpeakingOriginal(false);

    // Reset timer
    setSpeakingTime(0);
    setHasTimerStarted(false);
    if (speakingTimerRef.current) {
      clearTimeout(speakingTimerRef.current);
      speakingTimerRef.current = null;
    }

    // Clear conversation and reset phase
    setConversation([]);
    setCurrentPhase(CONVERSATION_PHASES.DISCUSSION);

    setIsClearingConversation(false);
  };


  // Helper functions for results sections
  const handleCopyToClipboard = async (text: string, setCopied: (value: boolean) => void) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const speakText = async (text: string, setSpeaking: (value: boolean) => void, voiceType?: 'user' | 'ai') => {
    if (speakingGrammar || speakingCorrected || speakingSpeaking || speakingOriginal || speakingConversation) {
      // Stop any current speech
      window.speechSynthesis.cancel();
      setSpeakingGrammar(false);
      setSpeakingCorrected(false);
      setSpeakingSpeaking(false);
      setSpeakingOriginal(false);
      setSpeakingConversation(false);
      conversationRef.current = false;
      return;
    }

    setSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';

    // Set different voices for user vs AI
    if (voiceType === 'user') {
      // Try to find a female voice for Sie
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice =>
        voice.lang.startsWith('de') &&
        (voice.name.includes('Female') || voice.name.includes('Woman') || voice.name.includes('Anna') || voice.name.includes('Petra'))
      );
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
    } else if (voiceType === 'ai') {
      // Try to find a male voice for KI
      const voices = window.speechSynthesis.getVoices();
      const maleVoice = voices.find(voice =>
        voice.lang.startsWith('de') &&
        (voice.name.includes('Male') || voice.name.includes('Man') || voice.name.includes('Hans') || voice.name.includes('Klaus'))
      );
      if (maleVoice) {
        utterance.voice = maleVoice;
      }
    }

    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeakingIdeas = () => {
    console.log('Force stopping all speech...');
    // Cancel all speech synthesis immediately
    window.speechSynthesis.cancel();
    // Stop current audio if playing
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch (error) {
        console.log('Audio already stopped or error during stop:', error);
      }
      currentAudioRef.current = null;
    }
    // Reset all states
    setSpeakingSpeaking(false);
    setIsLoadingSpeakingIdeas(false);
    speakingRef.current = false;
    // Force stop any ongoing speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  };

  const stopSpeakingConversation = () => {
    console.log('Force stopping conversation speech...');
    // Stop any currently playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    // Cancel all speech synthesis immediately (fallback)
    window.speechSynthesis.cancel();
    // Reset all states
    setSpeakingConversation(false);
    setIsLoadingConversation(false);
    conversationRef.current = false;
  };



  const speakSpeakingIdeasConversation = async () => {
    console.log('speakSpeakingIdeasConversation called, speakingSpeaking:', speakingSpeaking);

    if (speakingSpeaking) {
      console.log('Stopping speech...');
      stopSpeakingIdeas();
      return;
    }

    console.log('Starting speech...');
    setSpeakingSpeaking(true);
    setIsLoadingSpeakingIdeas(true);
    speakingRef.current = true;

    try {
      // Use the dynamically generated conversation from the chat box
      const conversation = exampleConversation.length > 0 ? exampleConversation : [
        { speaker: 'user', text: 'Hallo! Weißt du was? Ich habe gehört, dass Bayu vom Deutschkurs krank ist und im Krankenhaus liegt. Das tut mir wirklich leid. Ich möchte ihn gerne besuchen kommen. Können wir das zusammen planen?', timestamp: Date.now() },
        { speaker: 'ai', text: 'Hallo! Danke, dass du fragst. Ja, ich habe auch gehört, dass es Bayu nicht gut geht. Ein Besuch würde ihn sicher sehr freuen! Wann hättest du denn Zeit? Und wie kommst du zum Krankenhaus?', timestamp: Date.now() }
      ];

      // Stop any currently playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      // Generate audio for each conversation turn using TTS API (same as download button)
      const audioBlobs: Blob[] = [];

      for (const turn of conversation) {
        // Check if speaking was stopped
        if (!speakingRef.current) {
          console.log('Speaking stopped during generation');
          return;
        }

        const voice = turn.speaker === 'user' ? 'alloy' : 'nova'; // Same voices as download button
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: turn.text, voice })
        });

        if (response.ok) {
          const blob = await response.blob();
          audioBlobs.push(blob);
        } else {
          console.error('Failed to generate audio for turn:', turn);
        }

        // Add pause between turns (except for the last one)
        if (turn !== conversation[conversation.length - 1]) {
          // Create a short silence blob (0.2 seconds)
          const silenceBlob = new Blob([new ArrayBuffer(44100 * 0.2)], { type: 'audio/wav' });
          audioBlobs.push(silenceBlob);
        }
      }

      // Check if speaking was stopped before playing
      if (!speakingRef.current) {
        console.log('Speaking stopped before playing');
        return;
      }

      // Merge all audio blobs and play
      const mergedBlob = new Blob(audioBlobs, { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(mergedBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      // Set up event listeners
      audio.onended = () => {
        console.log('Speaking ideas audio playback completed');
        setSpeakingSpeaking(false);
        speakingRef.current = false;
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };

      audio.onerror = (error) => {
        console.error('Error playing speaking ideas audio:', error);
        setSpeakingSpeaking(false);
        speakingRef.current = false;
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };

      // Start playing
      await audio.play();
      console.log('Speaking ideas audio playback started');
      setIsLoadingSpeakingIdeas(false); // Hide loading spinner when audio starts playing

    } catch (error) {
      console.error('Error in speakSpeakingIdeasConversation:', error);
      setSpeakingSpeaking(false);
      setIsLoadingSpeakingIdeas(false);
      speakingRef.current = false;
    }
  };

  const speakConversation = async () => {
    console.log('speakConversation called, speakingConversation:', speakingConversation);

    if (speakingConversation) {
      console.log('Stopping conversation speech...');
      stopSpeakingConversation();
      return;
    }

    console.log('Starting conversation speech...');
    setSpeakingConversation(true);
    setIsLoadingConversation(true);
    conversationRef.current = true;

    try {
      if (!results?.conversation) {
        console.error('No conversation data available');
        setSpeakingConversation(false);
        conversationRef.current = false;
        return;
      }

      // Stop any currently playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      // Generate audio for each conversation turn using TTS API (same as download button)
      const audioBlobs: Blob[] = [];

      for (const turn of results.conversation) {
        // Check if speaking was stopped
        if (!conversationRef.current) {
          console.log('Conversation speaking stopped during generation');
          return;
        }

        const voice = turn.speaker === 'user' ? 'alloy' : 'nova'; // Same voices as download button
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: turn.text, voice })
        });

        if (response.ok) {
          const blob = await response.blob();
          audioBlobs.push(blob);
        } else {
          console.error('Failed to generate audio for turn:', turn);
        }

        // Add pause between turns (except for the last one)
        if (turn !== results.conversation[results.conversation.length - 1]) {
          // Create a short silence blob (0.5 seconds)
          const silenceBlob = new Blob([new ArrayBuffer(44100 * 0.5)], { type: 'audio/wav' });
          audioBlobs.push(silenceBlob);
        }
      }

      // Check if speaking was stopped before playing
      if (!conversationRef.current) {
        console.log('Conversation speaking stopped before playing');
        return;
      }

      // Merge all audio blobs and play
      const mergedBlob = new Blob(audioBlobs, { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(mergedBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      // Set up event listeners
      audio.onended = () => {
        console.log('Conversation audio playback completed');
        setSpeakingConversation(false);
        conversationRef.current = false;
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };

      audio.onerror = (error) => {
        console.error('Error playing conversation audio:', error);
        setSpeakingConversation(false);
        conversationRef.current = false;
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };

      // Start playing
      await audio.play();
      console.log('Conversation audio playback started');
      setIsLoadingConversation(false); // Hide loading spinner when audio starts playing

    } catch (error) {
      console.error('Error in speakConversation:', error);
      setSpeakingConversation(false);
      conversationRef.current = false;
    }
  };

  // Helper function to convert WebM to MP3
  const convertWebMToMP3 = async (audioBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const fileReader = new FileReader();

      fileReader.onload = async () => {
        try {
          const arrayBuffer = fileReader.result as ArrayBuffer;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          // Convert to MP3 using a simple approach
          // For better MP3 encoding, we'd need a library like lamejs
          // For now, we'll create a compressed audio format
          const mp3Blob = await audioBufferToMP3(audioBuffer);
          resolve(mp3Blob);
        } catch (error) {
          reject(error);
        }
      };

      fileReader.onerror = () => reject(new Error('Failed to read audio file'));
      fileReader.readAsArrayBuffer(audioBlob);
    });
  };

  // Helper function to convert AudioBuffer to MP3 format
  const audioBufferToMP3 = async (audioBuffer: AudioBuffer): Promise<Blob> => {
    // Since proper MP3 encoding requires a library like lamejs,
    // we'll create a compressed audio format that's more compatible
    // This is a simplified approach - for production, consider using lamejs

    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;

    // Create a simple compressed format (similar to MP3 but simpler)
    const buffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(buffer);

    // WAV header (we'll use WAV format but with MP3 MIME type for compatibility)
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);

    // Convert audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    // Return as MP3-like blob (in practice, this is still WAV format)
    // For true MP3, you'd need to integrate lamejs library
    return new Blob([buffer], { type: 'audio/mpeg' });
  };

  // Helper function to convert AudioBuffer to WAV format
  // const audioBufferToWav = (buffer: AudioBuffer): Blob => {
  //   const numberOfChannels = buffer.numberOfChannels;
  //   const sampleRate = buffer.sampleRate;
  //   const length = buffer.length;

  //   // Create WAV header
  //   const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
  //   const view = new DataView(arrayBuffer);

  //   // WAV header
  //   const writeString = (offset: number, string: string) => {
  //     for (let i = 0; i < string.length; i++) {
  //       view.setUint8(offset + i, string.charCodeAt(i));
  //     }
  //   };

  //   writeString(0, 'RIFF');
  //   view.setUint32(4, 36 + length * numberOfChannels * 2, true);
  //   writeString(8, 'WAVE');
  //   writeString(12, 'fmt ');
  //   view.setUint32(16, 16, true);
  //   view.setUint16(20, 1, true);
  //   view.setUint16(22, numberOfChannels, true);
  //   view.setUint32(24, sampleRate, true);
  //   view.setUint32(28, sampleRate * numberOfChannels * 2, true);
  //   view.setUint16(32, numberOfChannels * 2, true);
  //   view.setUint16(34, 16, true);
  //   writeString(36, 'data');
  //   view.setUint32(40, length * numberOfChannels * 2, true);

  //   // Convert audio data
  //   let offset = 44;
  //   for (let i = 0; i < length; i++) {
  //     for (let channel = 0; channel < numberOfChannels; channel++) {
  //       const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
  //       view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
  //       offset += 2;
  //     }
  //   }

  //   return new Blob([arrayBuffer], { type: 'audio/wav' });
  // };

  const downloadTextAsAudio = async (text: string, filename: string, setIsDownloading: (value: boolean) => void) => {
    setIsDownloading(true);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'alloy' })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading audio:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadUserOriginalAudio = async (setIsDownloading: (value: boolean) => void) => {
    setIsDownloading(true);
    try {
      // Get all user turns with audio URLs
      const userTurns = results?.conversation.filter(turn => turn.speaker === 'user' && turn.audioUrl) || [];

      console.log('DownloadUserOriginalAudio: Found user turns:', userTurns.length);
      console.log('DownloadUserOriginalAudio: User turns with audio URLs:', userTurns.map(turn => ({ text: turn.text, audioUrl: turn.audioUrl })));

      if (userTurns.length === 0) {
        console.log('No user audio found - cannot download original recording');
        alert('No recorded audio available for download');
        return;
      }

      // If only one audio file, convert it to MP3 and download
      if (userTurns.length === 1) {
        const turn = userTurns[0];
        console.log('DownloadUserOriginalAudio: Converting single audio file to MP3:', turn.audioUrl);

        const response = await fetch(turn.audioUrl!);
        if (response.ok) {
          const webmBlob = await response.blob();
          const mp3Blob = await convertWebMToMP3(webmBlob);
          const url = URL.createObjectURL(mp3Blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'original-recording.mp3';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } else {
          console.error('DownloadUserOriginalAudio: Failed to fetch audio:', response.status, response.statusText);
          alert('Error downloading recorded audio. Please try again.');
        }
        return;
      }

      // For multiple audio files, merge them properly using Web Audio API
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const audioBuffers: AudioBuffer[] = [];

      // Load all audio files
      for (const turn of userTurns) {
        try {
          console.log('DownloadUserOriginalAudio: Loading audio from URL:', turn.audioUrl);
          const response = await fetch(turn.audioUrl!);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            audioBuffers.push(audioBuffer);
            console.log('DownloadUserOriginalAudio: Loaded audio buffer, duration:', audioBuffer.duration);
          } else {
            console.error('DownloadUserOriginalAudio: Failed to fetch audio:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('Error loading user audio:', error);
        }
      }

      if (audioBuffers.length > 0) {
        // Calculate total duration
        const totalDuration = audioBuffers.reduce((sum, buffer) => sum + buffer.duration, 0);
        console.log('DownloadUserOriginalAudio: Total duration:', totalDuration);

        // Create a new audio buffer with the total duration
        const mergedBuffer = audioContext.createBuffer(
          audioBuffers[0].numberOfChannels,
          Math.ceil(totalDuration * audioBuffers[0].sampleRate),
          audioBuffers[0].sampleRate
        );

        // Copy audio data from each buffer to the merged buffer
        let offset = 0;
        for (const buffer of audioBuffers) {
          for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const sourceData = buffer.getChannelData(channel);
            const targetData = mergedBuffer.getChannelData(channel);
            targetData.set(sourceData, offset);
          }
          offset += buffer.length;
        }

        // Convert merged buffer to MP3 format for download
        const mp3Blob = await audioBufferToMP3(mergedBuffer);
        const url = URL.createObjectURL(mp3Blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'original-recording.mp3';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

      } else {
        console.log('No audio buffers found - cannot download original recording');
        alert('No recorded audio available for download');
      }
    } catch (error) {
      console.error('Error downloading user original audio:', error);
      alert('Error downloading recorded audio. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const playUserOriginalAudio = async () => {
    try {
      // Get all user turns with audio URLs
      const userTurns = results?.conversation.filter(turn => turn.speaker === 'user' && turn.audioUrl) || [];

      console.log('PlayUserOriginalAudio: Found user turns:', userTurns.length);
      console.log('PlayUserOriginalAudio: User turns with audio URLs:', userTurns.map(turn => ({ text: turn.text, audioUrl: turn.audioUrl })));

      if (userTurns.length === 0) {
        console.log('No user audio found - cannot play original recording');
        alert('No recorded audio available for playback');
        return;
      }

      // If only one audio file, play it directly without merging
      if (userTurns.length === 1) {
        const turn = userTurns[0];
        console.log('PlayUserOriginalAudio: Playing single audio file:', turn.audioUrl);

        // Stop any currently playing audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }

        const audio = new Audio(turn.audioUrl!);
        audioRef.current = audio;
        setSpeakingOriginal(true);

        audio.onended = () => {
          setSpeakingOriginal(false);
        };

        audio.play().catch(error => {
          console.error('Error playing user audio:', error);
          setSpeakingOriginal(false);
        });
        return;
      }

      // For multiple audio files, merge them properly using Web Audio API
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const audioBuffers: AudioBuffer[] = [];

      // Load all audio files
      for (const turn of userTurns) {
        try {
          console.log('PlayUserOriginalAudio: Loading audio from URL:', turn.audioUrl);
          const response = await fetch(turn.audioUrl!);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            audioBuffers.push(audioBuffer);
            console.log('PlayUserOriginalAudio: Loaded audio buffer, duration:', audioBuffer.duration);
          } else {
            console.error('PlayUserOriginalAudio: Failed to fetch audio:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('Error loading user audio:', error);
        }
      }

      if (audioBuffers.length > 0) {
        // Calculate total duration
        const totalDuration = audioBuffers.reduce((sum, buffer) => sum + buffer.duration, 0);
        console.log('PlayUserOriginalAudio: Total duration:', totalDuration);

        // Create a new audio buffer with the total duration
        const mergedBuffer = audioContext.createBuffer(
          audioBuffers[0].numberOfChannels,
          Math.ceil(totalDuration * audioBuffers[0].sampleRate),
          audioBuffers[0].sampleRate
        );

        // Copy audio data from each buffer to the merged buffer
        let offset = 0;
        for (const buffer of audioBuffers) {
          for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const sourceData = buffer.getChannelData(channel);
            const targetData = mergedBuffer.getChannelData(channel);
            targetData.set(sourceData, offset);
          }
          offset += buffer.length;
        }

        // Create audio source and play
        const source = audioContext.createBufferSource();
        source.buffer = mergedBuffer;
        source.connect(audioContext.destination);

        // Stop any currently playing audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }

        setSpeakingOriginal(true);

        source.onended = () => {
          setSpeakingOriginal(false);
        };

        source.start();

        // Store reference for stopping
        (audioRef as React.MutableRefObject<{ pause: () => void } | null>).current = { pause: () => source.stop() };

      } else {
        console.log('No audio buffers found - cannot play original recording');
        alert('No recorded audio available for playback');
        setSpeakingOriginal(false);
      }
    } catch (error) {
      console.error('Error playing user original audio:', error);
      alert('Error playing recorded audio. Please try again.');
      setSpeakingOriginal(false);
    }
  };

  const downloadConversationWithVoices = async (conversation: ConversationTurn[], filename: string, setIsDownloading: (value: boolean) => void) => {
    setIsDownloading(true);
    try {
      // Get available voices
      const voices = window.speechSynthesis.getVoices();
      console.log('Available voices for download:', voices);

      // Find German voices for differentiation
      const germanVoices = voices.filter(voice =>
        voice.lang.startsWith('de') ||
        voice.name.toLowerCase().includes('german') ||
        voice.name.toLowerCase().includes('deutsch')
      );

      const userVoice = germanVoices.find(voice =>
        voice.name.toLowerCase().includes('anna') ||
        voice.name.toLowerCase().includes('petra') ||
        voice.name.toLowerCase().includes('female')
      ) || germanVoices[0] || voices[0];

      const aiVoice = germanVoices.find(voice =>
        voice.name.toLowerCase().includes('hans') ||
        voice.name.toLowerCase().includes('klaus') ||
        voice.name.toLowerCase().includes('male')
      ) || (germanVoices[1] && germanVoices[1] !== userVoice ? germanVoices[1] : userVoice);

      console.log('Selected voices for download - User:', userVoice?.name, 'AI:', aiVoice?.name);

      // Generate audio for each conversation turn using TTS API
      const audioBlobs: Blob[] = [];

      for (const turn of conversation) {
        const voice = turn.speaker === 'user' ? 'alloy' : 'nova'; // Use different OpenAI voices
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: turn.text, voice })
        });

        if (response.ok) {
          const blob = await response.blob();
          audioBlobs.push(blob);
        } else {
          console.error('Failed to generate audio for turn:', turn);
        }

        // Add pause between turns (except for the last one)
        if (turn !== conversation[conversation.length - 1]) {
          // Create a short silence blob
          const silenceBlob = new Blob([new ArrayBuffer(44100 * 0.5)], { type: 'audio/wav' });
          audioBlobs.push(silenceBlob);
        }
      }

      // Merge all audio blobs into one file
      const mergedBlob = new Blob(audioBlobs, { type: 'audio/wav' });
      const url = URL.createObjectURL(mergedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error downloading conversation with voices:', error);
      // Fallback to simple TTS
      const conversationText = conversation.map(turn =>
        `${turn.speaker === 'user' ? 'Sie' : 'KI-Partner'}: ${turn.text}`
      ).join('. ');
      await downloadTextAsAudio(conversationText, filename, setIsDownloading);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-4">Anmeldung erforderlich</h2>
          <p className="text-gray-600 mb-6">Bitte melden Sie sich an, um den Teil 1 Test zu absolvieren.</p>
          <Link href="/login" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Anmelden
          </Link>
        </div>
      </div>
    );
  }

  // Show loading state when examining conversation
  if (isExamining) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 lg:p-12 xl:p-16">
        <div className="max-w-7xl mx-auto h-full flex min-h-0">
          <div className="w-full h-full min-h-0 overflow-hidden">
            {renderProcessing()}
          </div>
        </div>
      </div>
    );
  }

  if (results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-responsive">
        <div >

          {/* Test Results and Status */}
          <div className="shadow-xl bg-white/90 backdrop-blur-sm rounded-lg mb-8 pb-8">
            <div className="text-center p-responsive-half">
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-900 mb-4">Test Results</h2>
              <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm sm:text-base font-semibold ${results.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                {results.passed ? (
                  <>
                    <CheckCircle className="w-6 h-6" />
                    <span>BESTANDEN</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6" />
                    <span>NICHT BESTANDEN</span>
                  </>
                )}
              </div>
            </div>

            {/* Scores Section */}
            <div className="bg-slate-50 p-responsive-half rounded-xl mb-3 mx-3 lg:mb-8 lg:mx-8">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-800 mb-4">
                <TranslatedText
                  translationKey="results.scores"
                  fallback="Skor dan Penilaian Anda"
                />
              </h3>
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700 font-medium text-sm sm:text-base">
                      Flüssigkeit:
                    </span>
                    <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(results.scores.fluency)}/100</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700 font-medium text-sm sm:text-base">
                      Wortschatz:
                    </span>
                    <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(results.scores.vocabulary)}/100</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700 font-medium text-sm sm:text-base">
                      Grammatik:
                    </span>
                    <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(results.scores.grammar)}/100</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700 font-medium text-sm sm:text-base">
                      Aussprache:
                    </span>
                    <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(results.scores.pronunciation)}/100</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700 font-medium text-sm sm:text-base">
                      Aufgabenbewältigung:
                    </span>
                    <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(results.scores.task_completion)}/100</span>
                  </div>

                  {/* Overall Score */}
                  <div className="border-t border-slate-300 pt-3 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-800 font-bold text-base sm:text-lg">
                        Gesamt:
                      </span>
                      <span className={`font-bold text-lg sm:text-xl ${Math.round(results.scores?.overall || 0) >= 80 ? 'text-green-600' :
                          Math.round(results.scores?.overall || 0) >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                        }`}>{Math.round(results.scores?.overall || 0)}/100</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-slate-800 font-bold text-base sm:text-lg">
                        Prädikat:
                      </span>
                      <span className={`font-bold text-base sm:text-lg ${Math.round(results.scores?.overall || 0) >= 90 ? 'text-green-600' :
                        Math.round(results.scores?.overall || 0) >= 80 ? 'text-blue-600' :
                          Math.round(results.scores?.overall || 0) >= 70 ? 'text-yellow-600' :
                            Math.round(results.scores?.overall || 0) >= 60 ? 'text-orange-600' :
                              'text-red-600'
                          }`}>
                        {Math.round(results.scores?.overall || 0) >= 90 ? 'Sehr gut' :
                          Math.round(results.scores?.overall || 0) >= 80 ? 'Gut' :
                            Math.round(results.scores?.overall || 0) >= 70 ? 'Befriedigend' :
                              Math.round(results.scores?.overall || 0) >= 60 ? 'Ausreichend' :
                                'Nicht bestanden'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback Section */}
            <div className="bg-slate-50 p-responsive-half rounded-xl mb-3 mx-3 lg:mb-8 lg:mx-8">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-800 mb-4">
                <TranslatedText
                  translationKey="results.detailed_feedback"
                  fallback="Penilaian Anda"
                />
              </h3>
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <div className="space-y-4">
                  {/* Strengths */}
                  <div>
                    <h4 className="text-xs sm:text-sm lg:text-base font-medium text-green-700 mb-2">
                      Stärken:
                    </h4>
                    <ul className="text-xs sm:text-sm lg:text-base text-slate-700 space-y-1">
                      {results.feedback?.strengths && results.feedback.strengths.length > 0 ? (
                        results.feedback.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-green-500">•</span>
                            {strength}
                          </li>
                        ))
                      ) : (
                        <li className="text-slate-500 italic">No specific strengths identified.</li>
                      )}
                    </ul>
                  </div>

                  {/* Areas for Improvement */}
                  <div>
                    <h4 className="text-xs sm:text-sm lg:text-base font-medium text-orange-700 mb-2">
                      Verbesserungsbereiche:
                    </h4>
                    <ul className="text-xs sm:text-sm lg:text-base text-slate-700 space-y-1">
                      {results.feedback?.areas_for_improvement && results.feedback.areas_for_improvement.length > 0 ? (
                        results.feedback.areas_for_improvement.map((area, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-orange-500">•</span>
                            {area}
                          </li>
                        ))
                      ) : (
                        <li className="text-slate-500 italic">No specific areas for improvement identified.</li>
                      )}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  {results.feedback?.recommendations && results.feedback.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-xs sm:text-sm lg:text-base font-medium text-purple-700 mb-2">
                        Empfehlungen:
                      </h4>
                      <ul className="text-xs sm:text-sm lg:text-base text-slate-700 space-y-1">
                        {results.feedback.recommendations.map((recommendation, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-purple-500">•</span>
                            {recommendation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>


            {/* Detailed Assessment */}
            <div className="bg-slate-50 p-responsive-half rounded-xl mb-3 mx-3 lg:mb-8 lg:mx-8">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-800 mb-4">
                <TranslatedText translationKey="sections.detailed_evaluation" fallback="Detaillierte Bewertung" />
              </h3>
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <p className="text-xs sm:text-sm lg:text-base text-slate-700 leading-relaxed">
                  {results.summary || "Ihr Gespräch wurde basierend auf den Goethe B1-Kriterien analysiert. Die Bewertung umfasst Flüssigkeit, Wortschatz, Grammatik, Aussprache und Aufgabenbewältigung. Konzentrieren Sie sich auf das spezifische Feedback unten, um Ihre deutschen Sprechfähigkeiten zu verbessern."}
                </p>
              </div>
            </div>

            {/* Conversation Transcript */}
            <div className="bg-indigo-50 p-responsive-half rounded-xl mb-3 mx-3 lg:mb-8 lg:mx-8">
              <div className="mb-4">
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-indigo-800 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                  <TranslatedText translationKey="sections.your_conversation" fallback="Your conversation" />
                </h3>
              </div>
              <div className="bg-white p-4 rounded-lg border border-indigo-200">
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => {
                      const conversationText = results.conversation.map(turn =>
                        `${turn.speaker === 'user' ? 'Sie' : 'KI-Partner'}: ${turn.text}`
                      ).join('\n');
                      navigator.clipboard.writeText(conversationText);
                    }}
                    className="relative group"
                    title="Copy text"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center transition-colors">
                      <Copy className="w-4 h-4 text-white" />
                    </div>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Copy text
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                    </div>
                  </button>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {results.conversation.map((turn, index) => (
                    <div key={index} className={`flex gap-2 sm:gap-4 ${turn.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs sm:max-w-md p-3 sm:p-4 rounded-lg ${turn.speaker === 'user'
                          ? 'bg-indigo-100 text-indigo-900'
                          : 'bg-gray-100 text-gray-900'
                        }`}>
                        <div className={`flex items-center gap-2 mb-2 ${turn.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {turn.speaker === 'user' ? <User className="w-3 h-3 sm:w-4 sm:h-4" /> : <Bot className="w-3 h-3 sm:w-4 sm:h-4" />}
                          <span className="text-xs sm:text-sm lg:text-base font-semibold">
                            {turn.speaker === 'user' ? 'Sie' : 'KI-Partner'}
                          </span>
                        </div>
                        <p className={`text-xs sm:text-sm lg:text-base ${turn.speaker === 'user' ? 'text-right' : 'text-left'}`}>{turn.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons - Bottom Left */}
                <div className="flex items-center gap-2 mt-4">
                  {/* TTS Button */}
                  <div className="relative group">
                    <button
                      onClick={speakConversation}
                      disabled={isLoadingConversation}
                      className={`flex items-center gap-2 w-10 h-10 justify-center rounded-full transition-colors ${isLoadingConversation
                          ? 'bg-indigo-500 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                        } text-white`}
                    >
                      {isLoadingConversation ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : speakingConversation ? (
                        <Square className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-indigo-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Read aloud
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-indigo-800"></div>
                    </div>
                  </div>

                  {/* Download Button */}
                  <div className="relative group">
                    <button
                      onClick={() => {
                        downloadConversationWithVoices(results.conversation, 'your-conversation.mp3', setIsDownloadingSpeaking);
                      }}
                      disabled={isDownloadingSpeaking}
                      className={`flex items-center justify-center rounded-full w-10 h-10 gap-1 text-white transition-colors text-sm ${isDownloadingSpeaking
                        ? 'bg-indigo-500 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                    >
                      {isDownloadingSpeaking ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-indigo-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Download audio
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-indigo-800"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Your Recording (Original) - User dialogues only */}
            <div className="bg-red-50 p-responsive-half rounded-xl mb-3 mx-3 lg:mb-8 lg:mx-8">
              <div className="mb-4">
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-red-800">
                  <TranslatedText translationKey="sections.your_recording_original" fallback="Your Recording (Original)" />
                </h3>
              </div>
              <div className="bg-white p-4 rounded-lg border border-red-200">
                <div className="space-y-3">
                  {results.conversation
                    .filter(turn => turn.speaker === 'user')
                    .map((turn, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <span className="text-red-500 font-bold">🎤</span>
                        <div className="flex-1 flex items-start gap-3">
                          <p className="text-slate-700 text-xs sm:text-sm lg:text-base italic flex-1">&quot;{turn.text}&quot;</p>
                          {index === 0 && (
                            <button
                              onClick={() => {
                                const originalText = results.conversation
                                  .filter(turn => turn.speaker === 'user')
                                  .map(turn => turn.text)
                                  .join('\n');
                                navigator.clipboard.writeText(originalText);
                              }}
                              className="relative group flex-shrink-0"
                              title="Copy text"
                            >
                              <div className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors">
                                <Copy className="w-4 h-4 text-white" />
                              </div>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                Copy text
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                              </div>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>

                {/* Action Buttons - Bottom Left */}
                <div className="flex items-center gap-2 mt-4">
                  {/* TTS Button */}
                  <div className="relative group">
                    <button
                      onClick={() => {
                        if (speakingOriginal) {
                          // Stop audio if currently playing
                          if (audioRef.current) {
                            audioRef.current.pause();
                            audioRef.current.currentTime = 0;
                          }
                          setSpeakingOriginal(false);
                        } else {
                          playUserOriginalAudio();
                        }
                      }}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white w-10 h-10 justify-center rounded-full transition-colors"
                    >
                      {speakingOriginal ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-red-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Read aloud
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-red-800"></div>
                    </div>
                  </div>

                  {/* Download Button */}
                  <div className="relative group">
                    <button
                      onClick={() => {
                        downloadUserOriginalAudio(setIsDownloadingOriginal);
                      }}
                      disabled={isDownloadingOriginal}
                      className={`flex items-center justify-center rounded-full w-10 h-10 gap-1 text-white transition-colors text-sm ${isDownloadingOriginal
                        ? 'bg-red-500 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700'
                        }`}
                    >
                      {isDownloadingOriginal ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-red-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Download audio
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-red-800"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Corrected Version - User dialogues with corrections */}
            {results.grammarCorrections && results.grammarCorrections.length > 0 && (
              <div className="bg-green-50 p-responsive-half rounded-xl mb-3 mx-3 lg:mb-8 lg:mx-8">
                <div className="mb-4">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-green-800">
                    <TranslatedText translationKey="sections.corrected_version" fallback="Corrected Version" />
                  </h3>
                </div>
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="space-y-3 text-xs sm:text-sm lg:text-base">
                    {results.conversation
                      .filter(turn => turn.speaker === 'user')
                      .map((turn, index) => {
                        // Find corrections for this user turn
                        const corrections = results.grammarCorrections.filter(correction =>
                          turn.text.includes(correction.original)
                        );

                        let correctedText = turn.text;
                        corrections.forEach(correction => {
                          correctedText = correctedText.replace(correction.original, correction.corrected);
                        });

                        return (
                          <div key={index} className="flex items-start gap-3">
                            <span className="text-green-500 font-bold">✓</span>
                            <div className="flex-1 flex items-start gap-3">
                              <p className="text-slate-700 italic flex-1 text-xs sm:text-sm lg:text-base">&quot;{correctedText}&quot;</p>
                              {index === 0 && (
                                <button
                                  onClick={() => {
                                    const correctedText = results.conversation
                                      .filter(turn => turn.speaker === 'user')
                                      .map(turn => {
                                        const corrections = results.grammarCorrections.filter(correction =>
                                          turn.text.includes(correction.original)
                                        );
                                        let correctedText = turn.text;
                                        corrections.forEach(correction => {
                                          correctedText = correctedText.replace(correction.original, correction.corrected);
                                        });
                                        return correctedText;
                                      }).join('\n');
                                    navigator.clipboard.writeText(correctedText);
                                  }}
                                  className="relative group flex-shrink-0"
                                  title="Copy text"
                                >
                                  <div className="w-10 h-10 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center transition-colors">
                                    <Copy className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    Copy text
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                                  </div>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Action Buttons - Bottom Left */}
                  <div className="flex items-center gap-2 mt-4">
                    {/* TTS Button */}
                    <div className="relative group">
                      <button
                        onClick={() => {
                          const correctedText = results.conversation
                            .filter(turn => turn.speaker === 'user')
                            .map(turn => {
                              const corrections = results.grammarCorrections.filter(correction =>
                                turn.text.includes(correction.original)
                              );
                              let correctedText = turn.text;
                              corrections.forEach(correction => {
                                correctedText = correctedText.replace(correction.original, correction.corrected);
                              });
                              return correctedText;
                            }).join('. ');
                          speakText(correctedText, setSpeakingCorrected);
                        }}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white w-10 h-10 justify-center rounded-full transition-colors"
                      >
                        {speakingCorrected ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-green-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Read aloud
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-green-800"></div>
                      </div>
                    </div>

                    {/* Download Button */}
                    <div className="relative group">
                      <button
                        onClick={() => {
                          const correctedText = results.conversation
                            .filter(turn => turn.speaker === 'user')
                            .map(turn => {
                              const corrections = results.grammarCorrections.filter(correction =>
                                turn.text.includes(correction.original)
                              );
                              let correctedText = turn.text;
                              corrections.forEach(correction => {
                                correctedText = correctedText.replace(correction.original, correction.corrected);
                              });
                              return correctedText;
                            }).join('. ');
                          downloadTextAsAudio(correctedText, 'corrected-version.mp3', setIsDownloadingCorrected);
                        }}
                        disabled={isDownloadingCorrected}
                        className={`flex items-center justify-center rounded-full w-10 h-10 gap-1 text-white transition-colors text-sm ${isDownloadingCorrected
                          ? 'bg-green-500 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700'
                          }`}
                      >
                        {isDownloadingCorrected ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-green-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Download audio
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-green-800"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Grammar Corrections */}
            {results.grammarCorrections && results.grammarCorrections.length > 0 && (
              <div className="bg-orange-50 p-responsive-half rounded-xl mb-3 mx-3 lg:mb-8 lg:mx-8">
                <div className="mb-4">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-orange-800">
                    <TranslatedText translationKey="sections.grammar_corrections" fallback="Grammar Corrections" />
                  </h3>
                </div>
                <div className="space-y-3 text-xs sm:text-sm lg:text-base">
                  {results.grammarCorrections.map((correction, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-orange-200">
                      <div className="flex items-start gap-3">
                        <span className="text-red-500 font-bold">✗</span>
                        <div className="flex-1">
                          <p className="text-slate-700 mb-1 text-xs sm:text-sm lg:text-base"><strong>Original:</strong> {correction.original}</p>
                          <p className="text-green-700 mb-1 text-xs sm:text-sm lg:text-base"><strong>Corrected:</strong> {correction.corrected}</p>
                          <p className="text-slate-600 text-xs sm:text-sm lg:text-base">{correction.explanation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* Speaking Ideas Section */}
            <div className="bg-purple-50 p-responsive-half rounded-xl mb-3 mx-3 lg:mb-8 lg:mx-8">
              <div className="mb-4">
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-purple-800">
                  <TranslatedText translationKey="sections.speaking_ideas" fallback="💡 Speaking Ideas" />
                </h3>
              </div>

              {/* Redemittel Used (if available) */}
              {results.redemittelUsed && results.redemittelUsed.length > 0 && (
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Zustimmen (Agreement) */}
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-green-600 font-bold text-xl">✓</span>
                        <h5 className="font-bold text-green-800 text-base sm:text-sm lg:text-lg">Zustimmen</h5>
                      </div>
                      <ul className="space-y-3 text-xs sm:text-sm lg:text-base text-slate-700">
                        <li className="flex items-center gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span className="text-slate-700">Das ist eine gute Idee!</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span className="text-slate-700">Die Idee gefällt mir.</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span className="text-slate-700">Ich bin damit einverstanden.</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span className="text-slate-700">Ich bin dafür, dass</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span className="text-slate-700">Das stimmt! Auch ich bin der Meinung, dass</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span className="text-slate-700">Ich stimme zu, dass ...</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span className="text-slate-700">Genau, das finde ich auch / das meine ich auch.</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span className="text-slate-700">Du hast recht. Das ist ein guter Vorschlag.</span>
                        </li>
                      </ul>
                    </div>

                    {/* Ablehnen (Disagreement) */}
                    <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-red-600 font-bold text-base sm:text-sm lg:text-xl">✗</span>
                        <h5 className="font-bold text-red-800 text-base sm:text-sm lg:text-lg">Ablehnen</h5>
                      </div>
                      <ul className="space-y-3 text-xs sm:text-sm lg:text-base text-slate-700">
                        <li className="flex items-center gap-3">
                          <span className="text-red-600 font-bold">•</span>
                          <span className="text-slate-700">Da bin ich aber ganz anderer Meinung.</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-red-600 font-bold">•</span>
                          <span className="text-slate-700">Das ist aber keine gute Idee.</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-red-600 font-bold">•</span>
                          <span className="text-slate-700">Ich bin nicht der Meinung, dass...</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-red-600 font-bold">•</span>
                          <span className="text-slate-700">Ich bin dagegen, weil ...</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-red-600 font-bold">•</span>
                          <span className="text-slate-700">Wäre es vielleicht besser, wenn ...?</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-red-600 font-bold">•</span>
                          <span className="text-slate-700">Ich kann deine Meinung leider nicht teilen.</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-red-600 font-bold">•</span>
                          <span className="text-slate-700">Ich würde gern einen anderen Vorschlag machen.</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Additional Conversation Functions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {/* SITUATION NENNEN */}
                    <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-orange-600 font-bold text-base sm:text-sm lg:text-xl">ℹ️</span>
                        <h5 className="font-bold text-orange-800 text-base sm:text-sm lg:text-lg">Situation nennen</h5>
                      </div>
                      <ul className="space-y-3 text-xs sm:text-sm lg:text-base text-slate-700">
                        <li className="flex items-center gap-3">
                          <span className="text-orange-600 font-bold">•</span>
                          <span className="text-slate-700">Weißt du was?</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-orange-600 font-bold">•</span>
                          <span className="text-slate-700">Hast du schon mal gehört, dass ...?</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-orange-600 font-bold">•</span>
                          <span className="text-slate-700">Ich habe gehört, dass ...</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-orange-600 font-bold">•</span>
                          <span className="text-slate-700">Wie du weißt, V + S + O.</span>
                        </li>
                      </ul>
                    </div>

                    {/* VORSCHLÄGE MACHEN */}
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-blue-600 font-bold text-base sm:text-sm lg:text-xl">💡</span>
                        <h5 className="font-bold text-blue-800 text-base sm:text-sm lg:text-lg">Vorschläge machen</h5>
                      </div>
                      <ul className="space-y-3 text-xs sm:text-sm lg:text-base text-slate-700">
                        <li className="flex items-center gap-3">
                          <span className="text-blue-600 font-bold">•</span>
                          <span className="text-slate-700">Ich schlage vor, wir ...</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-blue-600 font-bold">•</span>
                          <span className="text-slate-700">Mein Vorschlag ist/wäre...</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-blue-600 font-bold">•</span>
                          <span className="text-slate-700">Wir könnten vielleicht/doch...</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-blue-600 font-bold">•</span>
                          <span className="text-slate-700">Was hälst du davon, wenn ...</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-blue-600 font-bold">•</span>
                          <span className="text-slate-700">Wärst du damit einverstanden, dass</span>
                        </li>
                      </ul>
                    </div>

                    {/* MEINUNG AUßERN */}
                    <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-purple-600 font-bold text-base sm:text-sm lg:text-xl">🗣️</span>
                        <h5 className="font-bold text-purple-800 text-base sm:text-sm lg:text-lg">Meinung äußern</h5>
                      </div>
                      <ul className="space-y-3 text-xs sm:text-sm lg:text-base text-slate-700">
                        <li className="flex items-center gap-3">
                          <span className="text-purple-600 font-bold">•</span>
                          <span className="text-slate-700">Meiner Meinung/ Ansicht nach</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-purple-600 font-bold">•</span>
                          <span className="text-slate-700">Ich bin der Meinung / Ansicht, dass</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-purple-600 font-bold">•</span>
                          <span className="text-slate-700">Ich finde/ ich glaube/ meine/ denke, dass ...</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-purple-600 font-bold">•</span>
                          <span className="text-slate-700">Ich bin sicher/ überzeugt, dass</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-purple-600 font-bold">•</span>
                          <span className="text-slate-700">Ich habe gehört / gelesen, dass</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-purple-600 font-bold">•</span>
                          <span className="text-slate-700">Wie findest du die Idee, ... zu + Infi?</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-purple-600 font-bold">•</span>
                          <span className="text-slate-700">Es wäre gut, wenn</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-purple-600 font-bold">•</span>
                          <span className="text-slate-700">Am besten wäre es, wenn.</span>
                        </li>
                      </ul>
                    </div>

                    {/* EINIGUNG */}
                    <div className="bg-teal-50 p-6 rounded-lg border border-teal-200">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-teal-600 font-bold text-base sm:text-sm lg:text-xl">🤝</span>
                        <h5 className="font-bold text-teal-800 text-base sm:text-sm lg:text-lg">Einigung</h5>
                      </div>
                      <ul className="space-y-3 text-xs sm:text-sm lg:text-base text-slate-700">
                        <li className="flex items-center gap-3">
                          <span className="text-teal-600 font-bold">•</span>
                          <span className="text-slate-700">Ja, das könnten wir so machen.</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-teal-600 font-bold">•</span>
                          <span className="text-slate-700">Gut, damit bin ich einverstanden.</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="text-teal-600 font-bold">•</span>
                          <span className="text-slate-700">Ja, so machen wir es.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Generated Conversation Example */}
              <div className="bg-white p-responsive-half rounded-xl mb-6 border border-purple-200">
              <div className="mb-4">
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-purple-800 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  <TranslatedText translationKey="sections.example_conversation" fallback="Contoh Percakapan" />
                </h3>
              </div>
              
              <div className="flex justify-end mb-4">
                  <button
                    onClick={() => {
                      // Copy the generated conversation example
                      const conversationText = exampleConversation.map(turn =>
                        `${turn.speaker === 'user' ? 'Sie' : 'KI'}: "${turn.text}"`
                      ).join('\n\n');
                      handleCopyToClipboard(conversationText, () => {});
                    }}
                    className="relative group"
                    title="Copy text"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center transition-colors">
                      <Copy className="w-4 h-4 text-white" />
                    </div>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Copy text
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                    </div>
                  </button>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {isGeneratingExample ? (
                    <div className="py-8">
                      <LoadingCard type="processing" />
                    </div>
                  ) : exampleConversation.length > 0 ? (
                    exampleConversation.map((turn, index) => (
                      <div key={index} className={`flex gap-2 sm:gap-4 ${turn.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs sm:max-w-md p-3 sm:p-4 rounded-lg ${turn.speaker === 'user'
                            ? 'bg-indigo-100 text-indigo-900'
                            : 'bg-gray-100 text-gray-900'
                          }`}>
                           <div className={`flex items-center gap-2 mb-2 ${turn.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {turn.speaker === 'user' ? <User className="w-3 h-3 sm:w-4 sm:h-4" /> : <Bot className="w-3 h-3 sm:w-4 sm:h-4" />}
                            <span className="text-xs sm:text-sm lg:text-base font-semibold">
                              {turn.speaker === 'user' ? 'Sie' : 'KI-Partner'}
                            </span>
                          </div>
                          <p className={`text-xs sm:text-sm lg:text-base ${turn.speaker === 'user' ? 'text-right' : 'text-left'}`}>{turn.text}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Example conversation will be generated based on your conversation...</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons - Bottom Left */}
                <div className="flex items-center gap-2 mt-4">
                  {/* TTS Button */}
                  <div className="relative group">
                    <button
                      onClick={speakSpeakingIdeasConversation}
                      disabled={isLoadingSpeakingIdeas}
                      className={`flex items-center gap-2 w-10 h-10 justify-center rounded-full transition-colors ${isLoadingSpeakingIdeas
                          ? 'bg-purple-500 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-700'
                        } text-white`}
                    >
                      {isLoadingSpeakingIdeas ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : speakingSpeaking ? (
                        <Square className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-purple-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Read aloud
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-purple-800"></div>
                    </div>
                  </div>

                  {/* Download Button */}
                  <div className="relative group">
                    <button
                      onClick={() => {
                        // Use the generated conversation
                        if (exampleConversation.length > 0) {
                          downloadConversationWithVoices(exampleConversation, 'speaking-ideas-conversation.mp3', setIsDownloadingSpeakingIdeas);
                        }
                      }}
                      disabled={isDownloadingSpeakingIdeas}
                      className={`flex items-center justify-center rounded-full w-10 h-10 gap-1 text-white transition-colors text-sm ${isDownloadingSpeakingIdeas
                        ? 'bg-purple-500 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                    >
                      {isDownloadingSpeakingIdeas ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-purple-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Download audio
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-purple-800"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* B1 Goethe Criteria Explanation */}
              <div className="bg-purple-100 p-responsive-half rounded-xl mb-6 border border-purple-300">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
                <span className="text-purple-600">📋</span>
                <TranslatedText translationKey="sections.b1_criteria" fallback="Why this fits B1 Goethe Zertifikat criteria:" />
              </h3>
              <div className="space-y-2 text-xs sm:text-sm lg:text-base text-slate-700">
                {results.modelAnswerExplanation && results.modelAnswerExplanation.map((explanation: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold">✓</span>
                    <span>{explanation}</span>
                  </div>
                ))}
              </div>
              </div>
            </div>

            {/* Neuer Test Button */}
            <div className="text-center mt-8 mx-8">
              <button 
                onClick={async () => {
                  await cleanupTestAudioFiles();
                  window.location.href = '/speaking';
                }}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Neuer Test
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render topic selection page with pagination
  const renderTopicSelection = () => {
    const currentTopics = pagination.paginatedItems(TEIL1_TOPICS);

    return (
      <div className="space-y-6">
        <TopicSelection
          topics={currentTopics as unknown as Topic[]}
          selectedTopic={selectedTopic as unknown as Topic | null}
          onTopicSelect={(topic) => setSelectedTopic(topic as Teil1Topic)}
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.setCurrentPage}
          onContinue={() => {
            if (selectedTopic) {
              setCurrentPhase(CONVERSATION_PHASES.INTRODUCTION);
            }
          }}
          title={<TranslatedText translationKey="teil1.topic_selection_title" fallback="Pilih Topik - Bagian 1" />}
          subtitle={<TranslatedText translationKey="teil1.topic_selection_subtitle" fallback="Pilih topik untuk tugas perencanaan Anda" />}
          continueButtonText={<TranslatedText translationKey="teil1.continue_button" fallback="Pilih" />}
          disabledButtonText={<TranslatedText translationKey="teil1.please_choose_topic" fallback="Pilih" />}
        />
      </div>
    );
  };

  // Show topic selection page
  if (currentPhase === CONVERSATION_PHASES.TOPIC_SELECTION) {
    return renderTopicSelection();
  }

  if (!selectedTopic) {
    return renderTopicSelection();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-responsive">
      <div className="container-responsive mx-auto">
        {/* B1 Goethe Zertifikat Instructions - Teil 1 */}
        <div className="shadow-xl bg-white/90 backdrop-blur-sm rounded-lg p-responsive mb-8">
          <div className="text-center mb-6">
            <h2 className="text-xl lg:text-2xl font-bold text-slate-900 mb-4">Rekam Perencanaan Anda</h2>
            <p className="text-slate-600 text-sm lg:text-base font-medium">Klik tombol mikrofon hijau untuk mulai merekam presentasi Anda. Percakapan anda akan dinilai otomatis saat waktu telah berakhir.</p>
          </div>

          <div className="mb-8 p-2 sm:p-4 lg:p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg lg:text-xl font-semibold text-blue-800 mb-4">
              B1 Goethe Zertifikat Teil 1 - Gemeinsam etwas planen
            </h3>

            <div className="mb-4">
              <p className="text-blue-600 text-sm lg:text-base mb-2"><strong>Dauer:</strong> circa drei Minuten</p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-blue-700 text-sm lg:text-base mb-2">Situation:</h4>
                <div className="space-y-2 text-slate-700 text-xs sm:text-sm lg:text-base">
                  <p>• Ein Teilnehmer aus dem Deutschkurs hatte einen Unfall und liegt im Krankenhaus.</p>
                  <p>• Diese Woche möchten Sie ihn besuchen und ein Geschenk von der ganzen Gruppe mitbringen.</p>
                  <p>• Nächste Woche kann er das Krankenhaus verlassen.</p>
                  <p>• Da er allein lebt, wird er Hilfe brauchen.</p>
                  <p>• Überlegen Sie, wie Sie ihn unterstützen können.</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-blue-700 text-sm lg:text-base mb-2">Besuch im Krankenhaus und Hilfe planen:</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-semibold text-slate-800 text-xs sm:text-sm lg:text-base mb-2">Besuch planen:</h5>
                    <ul className="text-xs sm:text-sm lg:text-base text-slate-700 space-y-1">
                      <li>• Wann besuchen? (Tag, Uhrzeit?)</li>
                      <li>• Wie hinkommen?</li>
                      <li>• Was mitnehmen?</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold text-slate-800 text-xs sm:text-sm lg:text-base mb-2">Hilfe organisieren:</h5>
                    <ul className="text-xs sm:text-sm lg:text-base text-slate-700 space-y-1">
                      <li>• Vom Krankenhaus abholen</li>
                      <li>• Einkaufen helfen</li>
                      <li>• Weitere Unterstützung</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-blue-700 text-sm lg:text-base mb-2">Ihre Aufgabe:</h4>
                <p className="text-slate-700 text-xs sm:text-sm lg:text-base">
                  Sprechen Sie über die Punkte unten, machen Sie Vorschläge und reagieren Sie auf die Vorschläge Ihres Gesprächspartners/Ihrer Gesprächspartnerin. Planen und entscheiden Sie gemeinsam, was Sie tun möchten.
                </p>
              </div>
            </div>
          </div>

          {/* Live Conversation Section */}
          <div className="mt-8 pt-8">
            <div className="bg-purple-50 rounded-lg border border-purple-200 p-responsive mb-8 relative">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-sm md:text-base lg:text-xl xl:text-2xl font-semibold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 text-purple-600" />
                  <TranslatedText 
                    translationKey="teil1.live_conversation" 
                    fallback="Percakapan Langsung"
                  />
                </h3>
                <div className="flex gap-2">
                  <div className="relative group">
                    <button
                      onClick={clearConversation}
                      disabled={isClearingConversation}
                      className={`flex items-center justify-center rounded-full w-8 h-8 sm:w-10 sm:h-10 gap-1 text-white transition-colors text-xs sm:text-sm ${isClearingConversation
                          ? 'bg-slate-500 cursor-not-allowed'
                          : 'bg-slate-600 hover:bg-slate-700'
                        }`}
                      title={isClearingConversation ? "Clearing..." : "Clear chat"}
                    >
                      {isClearingConversation ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      {isClearingConversation ? "Clearing..." : "Clear chat"}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-slate-800"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Chat Area */}
              <div className="space-y-4 min-h-64 max-h-96 overflow-y-auto bg-white rounded-lg p-4">
                {/* Messages */}
                {conversation.length === 0 && !isTranscribing ? (
                  <div className="flex flex-col items-center justify-center min-h-64 text-center text-gray-500">
                    <MessageSquare className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 xl:w-20 xl:h-20 mb-3 sm:mb-4 text-purple-300" />
                    <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">
                      <TranslatedText 
                        translationKey="teil1.start_conversation_instruction" 
                        fallback="Mulai percakapan dengan mengklik tombol mikrofon di bawah"
                      />
                    </p>
                  </div>
                ) : (
                  <>
                    {conversation.map((turn, index) => (
                      <div key={index} className={`flex gap-2 sm:gap-4 ${turn.speaker === 'user' ? 'justify-end' : 'justify-start'}`} data-message-index={index}>
                        <div className={`max-w-xs sm:max-w-md p-2 sm:p-3 rounded-lg ${turn.speaker === 'user'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-gray-100 text-gray-900'
                          }`}>
                          <div className={`flex items-center gap-2 mb-1 ${turn.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {turn.speaker === 'user' ? (
                              <User className="w-3 h-3 sm:w-4 sm:h-4" />
                            ) : (
                              <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
                            )}
                            <span className="text-xs sm:text-xs md:text-sm font-medium">
                              {turn.speaker === 'user' ? 'Sie' : 'KI-Partner'}
                            </span>
                          </div>
                          <p className={`text-xs sm:text-xs md:text-sm ${turn.speaker === 'user' ? 'text-right' : 'text-left'}`}>{turn.text}</p>
                        </div>
                      </div>
                    ))}

                    {/* Transcribing Indicator - shows when user finishes speaking */}
                    {isTranscribing && (
                      <div className="flex justify-end" data-transcribing="true">
                        <div className="max-w-md bg-blue-100 text-blue-900 p-2 sm:p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-xs md:text-sm">Transcribing your words...</span>
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-bounce"></div>
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Processing Indicator with Loading Animation - only shows when processing and there are messages */}
                    {isProcessing && conversation.length > 0 && (
                      <div className="flex justify-start">
                        <div className="max-w-md bg-gray-100 text-gray-900 p-2 sm:p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-xs md:text-sm">KI-Partner denkt nach...</span>
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-500 rounded-full animate-bounce"></div>
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  </>
                )}


                {/* Auto-scroll anchor */}
                <div ref={chatEndRef} />
              </div>


              {/* Fixed Bottom Controls */}
              <div className="flex-shrink-0 pt-4 mt-4">
                <div className="flex items-center justify-center">
                  {/* Timer and Recording Button - Bottom center */}
                  <div className="flex flex-col items-center">
                    {!isMicSupported ? (
                      <div className="text-center text-red-600 text-sm">
                        ❌ Microphone not supported
                      </div>
                    ) : (
                      <>
                        <div className="text-center mb-2">
                          <div className="text-2xl font-mono font-bold text-slate-900">
                            {formatTime(speakingTime)}
                          </div>
                          {hasTimerStarted && !isConversationFinished && (
                            <div className="text-sm text-slate-600 mt-1">
                              <TranslatedText 
                                translationKey="teil1.auto_examination_notice" 
                                fallback="Percakapan anda akan dinilai otomatis saat timer mencapai 3:00"
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex justify-center">
                          {!isRecording ? (
                            <button
                              onClick={startRecording}
                              disabled={isProcessing || isExamining}
                              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white p-3 rounded-full transition-colors"
                            >
                              <Mic className="w-6 h-6" />
                            </button>
                          ) : (
                            <button
                              onClick={stopRecording}
                              className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-colors"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </>
                    )}

                  </div>
                </div>
              </div>

            </div>
          </div>


        </div>

      </div>
    </div>
  );
}
