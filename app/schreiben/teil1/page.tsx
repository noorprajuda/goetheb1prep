"use client";
import React, { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, Copy, Check } from "lucide-react";
import TopicSelection from "@/components/shared/TopicSelection";
import TranslatedText from "@/components/TranslatedText";
import LoadingCard from "@/components/shared/LoadingCard";
import { usePagination } from "@/hooks/usePagination";
import { copyToClipboard } from "@/lib/sharedUtils";
import { useAuth } from "@/contexts/AuthContext";

interface SchreibenTopic {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  Vorteile?: string[];
  Nachteile?: string[];
  [key: string]: string | number | boolean | string[] | undefined;
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

interface TestResults {
  scores: {
    fluency: number;
    vocabulary: number;
    grammar: number;
    pronunciation: number;
    task_completion: number;
    content_structure: number;
    word_count_adequacy: number;
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
  improvements: Improvement[];
  passed: boolean;
  memoId?: string;
  transcript?: string;
  modelAnswer?: string;
  modelAnswerExplanation?: string[];
  vorteile?: string[];
  nachteile?: string[];
}

const TEST_PHASES = {
  TOPIC_SELECTION: 'topic_selection',
  WRITING: 'writing',
  PROCESSING: 'processing',
  RESULTS: 'results'
};

const SAMPLE_TOPICS: SchreibenTopic[] = [
  {
    id: 'cousin_abiturparty',
    title: 'Cousin Abiturparty',
    description: 'Ihr Cousin hat das Abitur mit einer sehr guten Note bestanden und möchte das mit einer großen Party feiern.',
    keywords: ['Abitur', 'Party', 'Familie', 'Feier']
  },
  {
    id: 'jemand_kennengelernt',
    title: 'Jemand kennengelernt',
    description: 'Sie haben gestern jemanden kennengelernt, fanden die Person sehr nett und haben Telefonnummern ausgetauscht.',
    keywords: ['Neue Bekanntschaft', 'Freundschaft', 'Kontakt']
  },
  {
    id: 'kleiner_hund_gefunden',
    title: 'Kleiner Hund gefunden',
    description: 'Sie haben einen kleinen Hund gefunden und mit nach Hause genommen.',
    keywords: ['Hund', 'Tier', 'Verantwortung', 'Fund']
  },
  {
    id: 'fotoausstellung',
    title: 'Fotoausstellung',
    description: 'Ihr Hobby ist Fotografieren und Sie nehmen an einer Fotoausstellung teil.',
    keywords: ['Fotografie', 'Ausstellung', 'Hobby', 'Kunst']
  },
  {
    id: 'austauschschueler',
    title: 'Austauschschüler',
    description: 'Sie schreiben dem deutschen Austauschschüler/der Austauschschülerin, der/die nächsten Monat eine Woche bei Ihnen wohnen wird.',
    keywords: ['Austausch', 'Gast', 'Kultur', 'Sprache']
  },
  {
    id: 'handyrechnung',
    title: 'Handyrechnung',
    description: 'Ein Freund/eine Freundin schreibt Ihnen, dass er/sie die hohen Handyrechnungen nicht bezahlen kann und die Eltern kein Taschengeld mehr geben.',
    keywords: ['Handy', 'Geld', 'Probleme', 'Beratung']
  },
  {
    id: 'fussballspieler',
    title: 'Fußballspieler / Fan-Club',
    description: 'Sie haben gestern in einem Einkaufszentrum zufällig einen Fußballspieler Ihrer Lieblingsmannschaft gesehen und ihn angesprochen.',
    keywords: ['Fußball', 'Fan', 'Begegnung', 'Sport']
  },
  {
    id: 'ferienhaus',
    title: 'Ferienhaus',
    description: 'Ein Freund/eine Freundin lädt Sie ein, erneut mit ihm/ihr und seinen/ihren Eltern ins Ferienhaus zu fahren.',
    keywords: ['Urlaub', 'Familie', 'Freunde', 'Ablehnung']
  },
  {
    id: 'sportverletzung',
    title: 'Sportverletzung',
    description: 'Sie erhalten eine Nachricht von einem Freund/einer Freundin, weil Sie lange nichts von sich hören ließen. Sie lagen zwei Wochen wegen einer Sportverletzung im Bett.',
    keywords: ['Sport', 'Verletzung', 'Kontakt', 'Erholung']
  },
  {
    id: 'sommerfest',
    title: 'Sommerfest',
    description: 'In Ihrer alten Schule findet ein Sommerfest statt. Sie möchten mit zwei Freunden hingehen.',
    keywords: ['Schule', 'Fest', 'Freunde', 'Einladung']
  }
];

export default function SchreibenTeil1Page() {
  const { user } = useAuth();
  const [hasSubscriptionAccess, setHasSubscriptionAccess] = useState<boolean | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(TEST_PHASES.TOPIC_SELECTION);
  const [selectedTopic, setSelectedTopic] = useState<SchreibenTopic | null>(null);
  const [userText, setUserText] = useState('');
  const [results, setResults] = useState<TestResults | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAufgabe, setSelectedAufgabe] = useState('1');
  const [timeLeft, setTimeLeft] = useState(20 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const [copiedSections, setCopiedSections] = useState<Record<string, boolean>>({});
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [copiedCorrected, setCopiedCorrected] = useState(false);
  const [copiedModel, setCopiedModel] = useState(false);

  const { currentPage, totalPages, paginatedItems, setCurrentPage } = usePagination({
    itemsPerPage: 6,
    totalItems: SAMPLE_TOPICS.length
  });

  // Check subscription access - only run once per user change
  useEffect(() => {
    if (!user || subscriptionChecked) return; // Exit early if no user or already checked
    
    const checkSubscriptionAccess = async () => {
      try {
        const response = await fetch('/api/subscription/status', {
          headers: {
            'x-user-id': user.id,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setHasSubscriptionAccess(data.hasAccess);
        }
      } catch (error) {
        console.error('Error checking subscription access:', error);
        setHasSubscriptionAccess(false);
      } finally {
        setSubscriptionLoading(false);
        setSubscriptionChecked(true);
      }
    };

    checkSubscriptionAccess();
  }, [user?.id, subscriptionChecked, user]); // Include all dependencies

  const resetTest = () => {
    setCurrentPhase(TEST_PHASES.TOPIC_SELECTION);
    setSelectedTopic(null);
    setUserText('');
    setResults(null);
    setIsProcessing(false);
    setSelectedAufgabe('1');
    setTimeLeft(20 * 60);
    setIsTimerRunning(false);
    setHasAutoSubmitted(false);
    setCopiedSections({});
  };

  const startTest = () => {
    if (selectedTopic) {
      setCurrentPhase(TEST_PHASES.WRITING);
      setTimeLeft(20 * 60);
      setIsTimerRunning(false);
      setHasAutoSubmitted(false);
    }
  };

  const handleTopicSelect = (topic: SchreibenTopic) => {
    setSelectedTopic(topic);
    console.log('Topic selected:', topic.title);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setUserText(text);
    
    if (!isTimerRunning && text.trim().length > 0) {
      setIsTimerRunning(true);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // Auto-submit when timer ends
  useEffect(() => {
    if (timeLeft <= 0 && !hasAutoSubmitted && !isProcessing) {
      setHasAutoSubmitted(true);
      if (selectedTopic && userText.trim().length > 0) {
        void processText();
      }
    }
  }, [timeLeft, hasAutoSubmitted, isProcessing, selectedTopic, userText]);

  // Timer countdown
  useEffect(() => {
    if (!isTimerRunning || timeLeft <= 0) return;
    const interval = window.setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // Auto submit when timer ends
  useEffect(() => {
    if (timeLeft <= 0 && !hasAutoSubmitted && !isProcessing) {
      setHasAutoSubmitted(true);
      // Only submit if a topic is selected
      if (selectedTopic && userText.trim().length > 0) {
        // defer to end of call stack to avoid using before declaration lint
        setTimeout(() => {
          void processText();
        }, 0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, hasAutoSubmitted, isProcessing, selectedTopic, userText]);

  // Process text and get results
  const processText = async () => {
    try {
      setIsProcessing(true);
      setCurrentPhase(TEST_PHASES.PROCESSING);

      if (!selectedTopic) {
        throw new Error('No topic selected');
      }
      
      if (!userText.trim()) {
        throw new Error('No text provided. Please write something before submitting.');
      }

      console.log('Processing text with data:', {
        topic: selectedTopic.title,
        textLength: userText.length,
        userId: user?.id
      });

      const response = await fetch('/api/schreiben-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'teil1',
          text: userText,
          topic: selectedTopic.title,
          language: 'de'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Analysis result:', data);
      
      setResults(data);
      setCurrentPhase(TEST_PHASES.RESULTS);
    } catch (error) {
      console.error('Error processing text:', error);
      
      let errorMessage = 'Fehler beim Verarbeiten des Textes';
      if (error instanceof Error) {
        if (error.message.includes('No topic selected')) {
          errorMessage = 'Bitte wählen Sie zuerst ein Thema aus.';
        } else if (error.message.includes('No text provided')) {
          errorMessage = 'Bitte schreiben Sie etwas, bevor Sie absenden.';
        } else {
          errorMessage = `Fehler beim Verarbeiten des Textes: ${error.message}`;
        }
      }
      
      alert(errorMessage);
      setCurrentPhase(TEST_PHASES.WRITING);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper functions
  const handleCopyToClipboard = async (text: string, setCopied: (value: boolean) => void) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };


  // Render topic selection
  const renderTopicSelection = () => {
    const currentTopics = paginatedItems(SAMPLE_TOPICS);

    return (
      <div>
        <TopicSelection
          topics={currentTopics}
          selectedTopic={selectedTopic}
          onTopicSelect={(topic) => {
            console.log('Topic selected:', topic.title);
            setSelectedTopic(topic as SchreibenTopic);
          }}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onContinue={() => {
            if (selectedTopic) {
              console.log('User selected topic:', selectedTopic.title);
              setCurrentPhase(TEST_PHASES.WRITING);
            } else {
              console.warn('No topic selected, cannot continue');
              alert('Bitte wählen Sie zuerst ein Thema aus.');
            }
          }}
          title={<TranslatedText translationKey="schreiben.topic_selection_title" fallback="Thema auswählen - Schreiben Teil 1" />}
          subtitle={<TranslatedText translationKey="schreiben.topic_selection_subtitle" fallback="Wählen Sie ein Thema für Ihren Text" />}
          continueButtonText={<TranslatedText translationKey="schreiben.start_writing" fallback="Schreiben beginnen" />}
          disabledButtonText={<TranslatedText translationKey="schreiben.please_choose_topic" fallback="Bitte wählen Sie ein Thema" />}
        />
      </div>
    );
  };

  // Render writing phase
  const renderWriting = () => (
    <div className="bg-white rounded-lg shadow-xl p-4 lg:p-8">
      <div className="text-center mb-8">
        <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-900 mb-2">
          <TranslatedText 
            translationKey="schreiben.write_your_text" 
            fallback="Schreiben Sie Ihren Text"
          />
        </h2>
        <p className="text-xs sm:text-sm lg:text-base text-slate-600 mb-4">
          <TranslatedText 
            translationKey="schreiben.write_instructions" 
            fallback="Schreiben Sie eine E-Mail oder persönliche Nachricht (ca. 80 Wörter) mit Anrede, Einleitung, Reihenfolge der Punkte und Schluss."
          />
        </p>
      </div>

      {/* Fixed instruction card (Aufgabe 1) styled like sprechen */}
      <div className="bg-blue-50 p-6 rounded-xl mb-8">
        <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-blue-900 mb-3">SCHREIBEN – Teil 1 · 20 Minuten</h3>
        <p className="text-blue-700 text-xs sm:text-sm lg:text-base mb-4">Ihr Cousin, der in einer anderen Stadt wohnt, hat gerade das Abitur mit einer sehr guten Note bestanden und möchte das mit einer großen Party feiern.</p>
        <div className="space-y-3 text-left">
          <div className="flex items-start gap-3">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</span>
            <p className="text-blue-700 text-xs sm:text-sm lg:text-base">Bedanken Sie sich für die Einladung und sagen Sie zu.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</span>
            <p className="text-blue-700 text-xs sm:text-sm lg:text-base">Machen Sie Vorschläge, wie Sie bei den Partyvorbereitungen helfen könnten.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</span>
            <p className="text-blue-700 text-xs sm:text-sm lg:text-base">Schreiben Sie, wann Sie kommen und wie lange Sie bleiben werden.</p>
          </div>
        </div>
        <p className="text-blue-700 text-xs sm:text-sm lg:text-base mt-4">Hinweis: Schreiben Sie eine E-Mail (ca. 80 Wörter). Achten Sie auf Anrede, Einleitung, Reihenfolge der Punkte und Schluss.</p>
      </div>

      {/* Timer */}
      <div className="mb-4 text-center">
        <div className="inline-block px-4 py-2 rounded-lg bg-white">
          <span className="font-mono tabular-nums font-bold text-blue-900 text-base sm:text-lg lg:text-2xl">
            {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Text Input */}
      <div className="mb-8">
        <label htmlFor="userText" className="block text-sm lg:text-xl font-bold text-slate-900 mb-2 text-center lg:text-left">
          <TranslatedText 
            translationKey="schreiben.your_text" 
            fallback="Teks kamu"
          />
        </label>
        <div className="relative">
          <textarea
            id="userText"
            value={userText}
            onChange={(e) => {
              if (!isTimerRunning && e.target.value.trim().length > 0) {
                setIsTimerRunning(true);
              }
              setUserText(e.target.value);
            }}
            placeholder="Schreiben Sie hier Ihren Text..."
            className="w-full h-64 p-4 pr-16 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:border-2 focus:outline-none resize-none text-slate-900"
            disabled={isProcessing}
          />
          {/* Counter inside textarea */}
          <div className="absolute bottom-2 right-2 text-xs sm:text-sm text-blue-900 bg-white/80 px-2 py-1 rounded-md font-mono tabular-nums flex items-center gap-1">
            {userText.trim().split(/\s+/).filter(word => word.length > 0).length}/80
            <span className="not-italic font-sans font-medium">
              <TranslatedText translationKey="schreiben.word_count" fallback="Kata" />
            </span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="text-center">
        <button
          onClick={processText}
          disabled={isProcessing || userText.trim().length < 20}
          className={`px-8 py-4 rounded-lg font-semibold text-lg transition-colors ${
            isProcessing || userText.trim().length < 20
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isProcessing ? (
            <TranslatedText 
              translationKey="schreiben.processing" 
              fallback="Verarbeitung..."
            />
          ) : (
            <TranslatedText 
              translationKey="schreiben.submit_text" 
              fallback="Text einreichen"
            />
          )}
        </button>
      </div>
    </div>
  );

  // Render results
  const renderResults = () => {
    if (!results) return null;

    return (
      <div className="shadow-xl bg-white/90 backdrop-blur-sm rounded-lg mb-8 pb-8">
        <div className="text-center p-responsive-half">
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-900 mb-4">
            <TranslatedText 
              translationKey="schreiben.test_results" 
              fallback="Test Results"
            /> - Schreiben Teil 1
          </h2>
          <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm sm:text-base font-semibold ${
            results?.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {results?.passed ? (
              <>
                <CheckCircle className="w-6 h-6" />
                <span>BESTANDEN</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-6 h-6" />
                <span>NICHT BESTANDEN</span>
              </>
            )}
          </div>
        </div>

        {/* Scores Section (German hardcoded) */}
        <div className="bg-slate-50 p-responsive-half rounded-xl mb-3 mx-3 lg:mb-8 lg:mx-8">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-800 mb-4">Bewertung und Punkte</h3>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-700 font-medium text-sm sm:text-base">Grammatik:</span>
                <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(results?.scores?.grammar || 0)}/100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700 font-medium text-sm sm:text-base">Wortschatz:</span>
                <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(results?.scores?.vocabulary || 0)}/100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700 font-medium text-sm sm:text-base">Inhalt und Struktur:</span>
                <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(results?.scores?.content_structure || 0)}/100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700 font-medium text-sm sm:text-base">Aufgabenbewältigung:</span>
                <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(results?.scores?.task_completion || 0)}/100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700 font-medium text-sm sm:text-base">Wortanzahl:</span>
                <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(results?.scores?.word_count_adequacy || 0)}/100</span>
              </div>

              {/* Overall Score */}
              <div className="border-t border-slate-300 pt-3 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-800 font-bold text-base sm:text-lg">
                    Gesamt:
                  </span>
                  <span className={`font-bold text-lg sm:text-xl ${
                    Math.round(results?.scores?.overall || 0) >= 80 ? 'text-green-600' :
                      Math.round(results?.scores?.overall || 0) >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                  }`}>{Math.round(results?.scores?.overall || 0)}/100</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-slate-800 font-bold text-base sm:text-lg">Prädikat:</span>
                  <span className={`font-bold text-base sm:text-lg ${
                    Math.round(results?.scores?.overall || 0) >= 90 ? 'text-green-600' :
                    Math.round(results?.scores?.overall || 0) >= 80 ? 'text-blue-600' :
                    Math.round(results?.scores?.overall || 0) >= 70 ? 'text-yellow-600' :
                    Math.round(results?.scores?.overall || 0) >= 60 ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {Math.round(results?.scores?.overall || 0) >= 90 ? 'Sehr gut' :
                      Math.round(results?.scores?.overall || 0) >= 80 ? 'Gut' :
                      Math.round(results?.scores?.overall || 0) >= 70 ? 'Befriedigend' :
                      Math.round(results?.scores?.overall || 0) >= 60 ? 'Ausreichend' : 'Nicht bestanden'}
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
              {results?.feedback?.strengths && results.feedback.strengths.length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm lg:text-base font-medium text-green-700 mb-2">
                    Stärken:
                  </h4>
                  <ul className="text-xs sm:text-sm lg:text-base text-slate-700 space-y-1">
                    {results.feedback.strengths.map((strength: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-500">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Areas for Improvement */}
              {results?.feedback?.areas_for_improvement && results.feedback.areas_for_improvement.length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm lg:text-base font-medium text-orange-700 mb-2">
                    Verbesserungsbereiche:
                  </h4>
                  <ul className="text-xs sm:text-sm lg:text-base text-slate-700 space-y-1">
                    {results.feedback.areas_for_improvement.map((area: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-orange-500">•</span>
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {results?.feedback?.recommendations && results.feedback.recommendations.length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm lg:text-base font-medium text-purple-700 mb-2">
                    Empfehlungen:
                  </h4>
                  <ul className="text-xs sm:text-sm lg:text-base text-slate-700 space-y-1">
                    {results.feedback.recommendations.map((recommendation: string, index: number) => (
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
        {results?.feedback?.specific_feedback && (
          <div className="bg-slate-50 p-responsive-half rounded-xl mb-3 mx-3 lg:mb-8 lg:mx-8">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-800 mb-4">
              <TranslatedText 
                translationKey="sections.detailed_evaluation" 
                fallback="Detaillierte Bewertung"
              />
            </h3>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <p className="text-xs sm:text-sm lg:text-base text-slate-700 leading-relaxed">{results.feedback.specific_feedback}</p>
            </div>
          </div>
        )}

        {/* Original Text */}
        <div className="bg-slate-50 p-responsive-half rounded-xl mb-3 mx-3 lg:mb-8 lg:mx-8">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-900 mb-4">
            <TranslatedText 
              translationKey="sections.your_text" 
              fallback="Ihr Text"
            />
          </h3>
          <div className="bg-white p-4 rounded-lg border relative">
            <div className="absolute top-2 right-2 group">
              <button
                onClick={() => handleCopyToClipboard(userText, setCopiedTranscript)}
                className={`flex items-center justify-center rounded-full w-10 h-10 gap-1 text-white transition-colors text-sm bg-slate-600 hover:bg-slate-700`}
              >
                {copiedTranscript ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs sm:text-sm lg:text-base text-slate-700 italic pr-8 lg:pr-16 mb-4">&ldquo;{userText}&rdquo;</p>
          </div>
        </div>

        {/* Corrected Text */}
        {results?.correctedText && (
          <div className="bg-green-50 p-responsive-half rounded-xl mb-3 mx-3 lg:mb-8 lg:mx-8">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-green-800 mb-4">
              <TranslatedText 
                translationKey="schreiben.corrected_version" 
                fallback="Korrigierte Version"
              />
            </h3>
            <div className="bg-white p-4 rounded-lg border border-green-200 relative">
              <div className="absolute top-2 right-2 group">
                <button
                  onClick={() => handleCopyToClipboard(results.correctedText, setCopiedCorrected)}
                  className={`flex items-center justify-center rounded-full w-10 h-10 gap-1 text-white transition-colors text-sm bg-green-600 hover:bg-green-700`}
                >
                  {copiedCorrected ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs sm:text-sm lg:text-base text-slate-700 italic mb-4 pr-8 lg:pr-16">&ldquo;{results.correctedText}&rdquo;</p>
            </div>
          </div>
        )}

        {/* Grammar Corrections */}
        {results?.corrections && results.corrections.length > 0 && (
          <div className="bg-orange-50 p-responsive-half rounded-xl mb-3 mx-3 lg:mb-8 lg:mx-8">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-orange-800 mb-4">
              <TranslatedText 
                translationKey="sections.grammar_corrections" 
                fallback="Grammar Corrections"
              />
            </h3>
            <div className="text-xs sm:text-sm lg:text-base space-y-3">
              {results.corrections.map((correction: Correction, index: number) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-orange-200">
                  <div className="flex items-start gap-3">
                    <span className="text-red-500 font-bold">✗</span>
                    <div className="flex-1">
                      <p className="text-slate-700 mb-1"><strong>Original:</strong> {correction.original}</p>
                      <p className="text-green-700 mb-1"><strong>Korrigiert:</strong> {correction.corrected}</p>
                      <p className="text-slate-600">{correction.explanation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Improved Expressions */}
        {results?.improvements && results.improvements.length > 0 && (
          <div className="bg-blue-50 p-responsive-half rounded-xl mb-3 mx-3 lg:mb-8 lg:mx-8">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-blue-800 mb-4">
              <TranslatedText 
                translationKey="sections.better_expressions" 
                fallback="Better Expressions"
              />
            </h3>
            <div className="text-xs sm:text-sm lg:text-base space-y-3">
              {results.improvements.map((improvement: Improvement, index: number) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-500 font-bold">💡</span>
                    <div className="flex-1">
                      <p className="text-slate-700 mb-1"><strong>Original:</strong> {improvement.original}</p>
                      <p className="text-green-700 mb-1"><strong>Verbessert:</strong> {improvement.improved}</p>
                      <p className="text-slate-600 text-sm">{improvement.explanation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Model Answer Section */}
        {results?.modelAnswer && (
          <div className="bg-purple-50 p-responsive-half rounded-xl mb-3 mx-3 lg:mb-8 lg:mx-8">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-purple-800 mb-4">
              <TranslatedText 
                translationKey="sections.model_answer" 
                fallback="Model Answer"
              />
            </h3>
            <div className="bg-white p-4 rounded-lg border border-purple-200 relative">
              <div className="absolute top-2 right-2 group">
                <button
                  onClick={() => handleCopyToClipboard(results.modelAnswer || '', setCopiedModel)}
                  className={`flex items-center justify-center rounded-full w-10 h-10 gap-1 text-white transition-colors text-sm bg-purple-600 hover:bg-purple-700`}
                >
                  {copiedModel ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs sm:text-sm lg:text-base text-slate-700 italic mb-4 pr-8 lg:pr-16">&ldquo;{results.modelAnswer}&rdquo;</p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="text-center space-x-4">
          <button
            onClick={() => {
              setCurrentPhase(TEST_PHASES.TOPIC_SELECTION);
              setUserText('');
              setResults(null);
            }}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors"
          >
            <TranslatedText 
              translationKey="schreiben.new_test" 
              fallback="Neuer Test"
            />
          </button>
        </div>
      </div>
    );
  };

  // Show loading while checking subscription
  if (subscriptionLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 lg:p-12 xl:p-16">
        <div className="max-w-7xl mx-auto h-full flex min-h-0">
          <div className="w-full h-full min-h-0 overflow-hidden">
            <LoadingCard type="subscription" />
          </div>
        </div>
      </div>
    );
  }

  // Show subscription gate if user doesn't have access
  if (user && hasSubscriptionAccess === false) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 lg:p-12 xl:p-16">
        <div className="max-w-7xl mx-auto h-full flex min-h-0">
          <div className="w-full h-full min-h-0 overflow-hidden">
            <LoadingCard type="access_denied" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-4 pb-16">
      <div className="max-w-7xl mx-auto">
        <div className="w-full">
          {currentPhase === TEST_PHASES.TOPIC_SELECTION && renderTopicSelection()}
          {currentPhase === TEST_PHASES.WRITING && renderWriting()}
          {currentPhase === TEST_PHASES.PROCESSING && (
            <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 lg:p-12 xl:p-16">
              <div className="max-w-7xl mx-auto h-full flex min-h-0">
                <div className="w-full h-full min-h-0 overflow-hidden">
                  <LoadingCard type="processing" />
                </div>
              </div>
            </div>
          )}
          {currentPhase === TEST_PHASES.RESULTS && renderResults()}
        </div>
      </div>
    </div>
  );
}

