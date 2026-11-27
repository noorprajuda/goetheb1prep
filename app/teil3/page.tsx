"use client";
import React, { useState, useEffect } from "react";

import { CheckCircle, AlertCircle, Volume2, Square, Copy, Check, Download } from "lucide-react";
// Removed useTextToSpeech import - using direct speech synthesis API
import AudioRecorder from "@/components/audio-recorder";
import TopicSelection from "@/components/shared/TopicSelection";
import TranslatedText from "@/components/TranslatedText";
import LoadingCard from "@/components/shared/LoadingCard";
import Lottie from "lottie-react";
import owlReadingAnimation from "@/public/images/loading/owl-reading.json";
import { usePagination } from "@/hooks/usePagination";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useAudio } from "@/hooks/useAudio";
import { copyToClipboard, downloadBlob } from "@/lib/sharedUtils";
import { useAuth } from "@/contexts/AuthContext";

interface Topic {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  Vorteile: string[];
  Nachteile: string[];
  [key: string]: string | number | boolean | string[] | undefined;
}

interface PresentationSlide {
  id: string;
  title: string;
  content: string;
  audioUrl?: string;
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
    interaction_reaction: number;
    language_appropriateness: number;
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
  presentation?: PresentationSlide[];
}

const TEST_PHASES = {
  TOPIC_SELECTION: 'topic_selection',
  RECORDING: 'recording',
  PROCESSING: 'processing',
  RESULTS: 'results'
};

const SAMPLE_TOPICS = [
  {
    id: 'vegetarisch_essen',
    title: 'Vegetarisch essen',
    description: 'Ein Thema über vegetarische Ernährung und ihre Auswirkungen auf Gesundheit und Gesellschaft.',
    keywords: ['Vegetarisch', 'Gesundheit', 'Tiere', 'Ernährung'],
    Vorteile: ['Vegetarisch ist Gesund',
      'Man schützt sich vor gefährlichen Krankheiten wie: Krebs, Cholesterin und Diabetes', 'Man ist immer fit', 'Man bleibt schlank', 'Tiere haben auch Recht auf Leben'],
    Nachteile: [
      'der Körper braucht Eiweiß und wichtige Nahrungsstoffe',
      'Fleisch spielt eine große Rolle in der Ernährung besonders bei kleinen Kindern',
      'Vegetarisches Essen schmeckt nicht und macht nicht satt.']
  },
  {
    id: 'fleisch_essen',
    title: 'Fleisch essen',
    description: 'Ein Thema über die Rolle von Fleisch in der modernen Ernährung und Gesellschaft.',
    keywords: ['Fleisch', 'Eiweiß', 'Kinder', 'Ernährung'],
    Vorteile: ['liefert Eiweiß', 'wichtige Nährstoffe', 'besonders wichtig für Kinder'],
    Nachteile: ['ungesund bei Übermaß', 'verursacht Krankheiten', 'macht dick']
  },
  {
    id: 'fast_food',
    title: 'Fast Food',
    description: 'Ein Thema über die Auswirkungen von Fast Food auf Gesundheit und Gesellschaft.',
    keywords: ['Fast Food', 'Gesundheit', 'Zeit', 'Kosten', 'Gewohnheiten'],
    Vorteile: [
      'FF schmeckt gut wenn man FF isst, spart man Zeit',
      'FF ist preiswert',
      'Man kann von zu Hause oder vom Büro etwas bestellen',
    ],
    Nachteile: ['FF ist ungesund und verursacht viele Krankheiten wie: Krebs und Diabetes', 'FF macht dick und faul', 'Man weiß nicht, woraus das besteht.']
  },
  {
    id: 'fertigessen',
    title: 'Fertigessen',
    description: 'Ein Thema über die Vor- und Nachteile von Fertigessen im modernen Alltag.',
    keywords: ['Fertigessen', 'Gesundheit', 'Zeit', 'Kosten'],
    Vorteile: ['wenn man FE isst, spart man Zeit. Man kann es schnell in der Mikrowelle aufwärmen', 'FE ist preiswert und praktisch'],
    Nachteile: ['FE ist ungesund und verursacht viele Krankheiten wie: Krebs und Diabetes', 'FE macht dick und faul Man weiß nicht, woraus das besteht.']
  },
  {
    id: 'soziale_netzwerke/facebook',
    title: 'Soziale Netzwerke/Facebook',
    description: 'Ein Thema über die Auswirkungen von sozialen Netzwerken auf Gesellschaft und Kommunikation.',
    keywords: ['Facebook', 'Soziale Medien', 'Kommunikation', 'Freunde', 'Privatsphäre'],
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
  {
    id: 'smartphone',
    title: 'Smartphone',
    description: 'Ein Thema über die Vor- und Nachteile von Smartphones im modernen Leben.',
    keywords: ['Smartphone', 'Technologie', 'Kommunikation', 'Abhängigkeit', 'Gesundheit'],
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
  {
    id: 'auto_oder_fahrrad',
    title: 'Auto oder Fahrrad?',
    description: 'Ein Thema über die Vor- und Nachteile von Auto und Fahrrad als Transportmittel.',
    keywords: ['Auto', 'Fahrrad', 'Transport', 'Umwelt', 'Gesundheit'],
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
  {
    id: 'dvd_oder_kino',
    title: 'DVD oder Kino?',
    description: 'Vergleichen Sie die Vor- und Nachteile, Filme im Kino oder auf DVD zu schauen.',
    keywords: ['DVD', 'Kino', 'Filme', 'Freizeit'],
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
];

export default function Teil3Page() {
  const { speak, stop, isReady } = useTextToSpeech();
  const { user } = useAuth();
  
  // Audio hooks for different content types
  const transcriptAudio = useAudio();
  const correctedAudio = useAudio();
  const presentationAudio = useAudio();
  const modelAnswerAudio = useAudio();

  // State management
  const [currentPhase, setCurrentPhase] = useState(TEST_PHASES.TOPIC_SELECTION);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [presentation, setPresentation] = useState<PresentationSlide[]>([]);
  const [results, setResults] = useState<TestResults | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);

  // Use pagination hook
  const pagination = usePagination({
    itemsPerPage: 3,
    totalItems: SAMPLE_TOPICS.length,
    initialPage: 1
  });


  // Button states for results sections
  const [copiedPresentation, setCopiedPresentation] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [copiedCorrected, setCopiedCorrected] = useState(false);
  const [isDownloadingTranscript, setIsDownloadingTranscript] = useState(false);
  const [isDownloadingCorrected, setIsDownloadingCorrected] = useState(false);
  const [isDownloadingPresentation, setIsDownloadingPresentation] = useState(false);
  const [isDownloadingModelAnswer, setIsDownloadingModelAnswer] = useState(false);
  
  // Audio cache for downloads
  const [audioCache, setAudioCache] = useState<{
    transcript?: Blob;
    corrected?: Blob;
    presentation?: Blob;
    modelAnswer?: Blob;
  }>({});

  // Function to clean up GridFS audio files from the current test session
  const cleanupTestAudioFiles = async () => {
    try {
      console.log('Cleaning up Teil 3 test audio files...');
      
      // For Teil 3, audio files are stored in GridFS but not tracked in results
      // We'll implement a cleanup based on the memoId if available
      
      // Check if we have a memoId to clean up related audio files
      if (results?.memoId) {
        console.log('Teil 3 memoId found:', results.memoId);
        // For now, we'll log that cleanup would happen here
        // In a full implementation, we'd query GridFS for files with this memoId
        console.log('Teil 3 audio cleanup would clean files for memoId:', results.memoId);
      }
      
      // For Teil 3, we might also want to clean up any temporary audio files
      // This could be expanded based on how Teil 3 manages audio storage
      console.log('Teil 3 audio cleanup completed (no specific files to clean)');
      
    } catch (error) {
      console.error('Error cleaning up Teil 3 audio files:', error);
    }
  };

  // Simple audio functions using useAudio hook
  const speakTranscript = async () => {
    if (transcriptAudio.isPlaying) {
      transcriptAudio.stop();
    } else {
      const text = results?.transcript || '';
      if (!text) return;
      
      try {
        // Check cache first
        if (audioCache.transcript) {
          await transcriptAudio.play(undefined, audioCache.transcript);
          return;
        }
        
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) throw new Error('Failed to generate speech');

        const audioBlob = await response.blob();
        setAudioCache(prev => ({ ...prev, transcript: audioBlob }));
        await transcriptAudio.play(undefined, audioBlob);
      } catch (error) {
        console.error('Error playing transcript audio:', error);
        speak(text); // Fallback to browser TTS
      }
    }
  };

  const speakCorrected = async () => {
    if (correctedAudio.isPlaying) {
      correctedAudio.stop();
    } else {
      const text = results?.correctedText || '';
      if (!text) return;
      
      try {
        // Check cache first
        if (audioCache.corrected) {
          await correctedAudio.play(undefined, audioCache.corrected);
          return;
        }
        
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) throw new Error('Failed to generate speech');

        const audioBlob = await response.blob();
        setAudioCache(prev => ({ ...prev, corrected: audioBlob }));
        await correctedAudio.play(undefined, audioBlob);
      } catch (error) {
        console.error('Error playing corrected audio:', error);
        speak(text); // Fallback to browser TTS
      }
    }
  };

  const downloadTranscriptAudio = async () => {
    const text = results?.transcript || '';
    if (!text) {
      alert('No transcript available to download.');
      return;
    }

    try {
      setIsDownloadingTranscript(true);

      // Use cached audio if available, otherwise generate new
      let audioBlob = audioCache.transcript;
      if (!audioBlob) {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) throw new Error('Failed to generate speech');
        audioBlob = await response.blob();
        setAudioCache(prev => ({ ...prev, transcript: audioBlob }));
      }

      downloadBlob(audioBlob, `transcript-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.mp3`);
    } catch (error) {
      console.error('Error downloading transcript audio:', error);
      alert('Failed to download transcript audio. Please try again.');
    } finally {
      setIsDownloadingTranscript(false);
    }
  };

  const downloadCorrectedAudio = async () => {
    const text = results?.correctedText || '';
    if (!text) {
      alert('No corrected text available to download.');
      return;
    }

    try {
      setIsDownloadingCorrected(true);

      // Use cached audio if available, otherwise generate new
      let audioBlob = audioCache.corrected;
      if (!audioBlob) {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) throw new Error('Failed to generate speech');
        audioBlob = await response.blob();
        setAudioCache(prev => ({ ...prev, corrected: audioBlob }));
      }

      downloadBlob(audioBlob, `corrected-text-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.mp3`);
    } catch (error) {
      console.error('Error downloading corrected audio:', error);
      alert('Failed to download corrected audio. Please try again.');
    } finally {
      setIsDownloadingCorrected(false);
    }
  };

  // TTS state - no need for voice loading since we use OpenAI TTS API
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);

  // Wait for audio system to be ready
  useEffect(() => {
    if (isReady) {
      // Add a small delay to ensure everything is properly initialized
      const timer = setTimeout(() => {
        setIsAudioReady(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isReady]);

  // Reset selectedTopic only on component mount to prevent automatic selection
  useEffect(() => {
    setSelectedTopic(null);
  }, []);

  // Ensure clean state when component mounts or returns to topic selection
  useEffect(() => {
    if (currentPhase === TEST_PHASES.TOPIC_SELECTION) {
      // Clear any previous data but don't reset selectedTopic if user is in the middle of selecting
      setPresentation([]);
      setResults(null);
      setHasAutoPlayed(false);
    }
  }, [currentPhase]);





  // Simple presentation audio generation
  const generatePresentationAudio = async () => {
    // No need for complex audio generation, just proceed to recording phase
    setCurrentPhase(TEST_PHASES.RECORDING);
  };

  // Generate presentation when topic is selected
  const generatePresentation = async () => {
    if (!selectedTopic) {
      console.error('No topic selected for presentation generation');
      alert('Bitte wählen Sie zuerst ein Thema aus.');
      return;
    }

    try {
      setIsProcessing(true);
      console.log("Generating presentation for topic:", selectedTopic.title);
      
      // Generate presentation via API
      const response = await fetch('/api/speaking-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'presentation',
          topic: selectedTopic.title,
          description: selectedTopic.description,
          language: 'de' // German for Teil 3
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate presentation');
      }

      const data = await response.json();
      setPresentation(data.presentation || []);
      setHasAutoPlayed(false);
      
      // Generate audio for the presentation
      await generatePresentationAudio();
      
      // Only set to RECORDING phase after audio is generated
      setCurrentPhase(TEST_PHASES.RECORDING);
    } catch (error) {
      console.error('Error generating presentation:', error);
      alert('Fehler beim Generieren der Präsentation. Bitte versuchen Sie es erneut.');
    } finally {
      setIsProcessing(false);
    }
  };


  // Process audio and get results
  const processAudio = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);
      setCurrentPhase(TEST_PHASES.PROCESSING);

      // Validate required data before processing
      if (!selectedTopic) {
        throw new Error('No topic selected');
      }
      
      if (!presentation || presentation.length === 0) {
        throw new Error('No presentation data available. Please generate a presentation first.');
      }

      // Validate audio blob
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('No audio data recorded. Please try recording again.');
      }

      if (audioBlob.size > 25 * 1024 * 1024) { // 25MB limit
        throw new Error('Audio file too large. Please record a shorter audio clip.');
      }

      console.log('Processing audio with data:', {
        topic: selectedTopic.title,
        presentationSlides: presentation.length,
        audioSize: audioBlob.size,
        audioType: audioBlob.type,
        userId: user?.id
      });

      // Process audio with Teil 3 API
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('type', 'teil3');
      formData.append('topic', selectedTopic.title);
      formData.append('description', selectedTopic.description || '');
      formData.append('presentation', JSON.stringify(presentation));
      formData.append('language', 'de');

      // Log FormData contents for debugging
      console.log('FormData contents:');
      for (const [key, value] of formData.entries()) {
        if (key === 'audio') {
          console.log(`${key}:`, { type: (value as File).type, size: (value as File).size });
        } else {
          console.log(`${key}:`, value);
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch('/api/teil3/results', {
        method: 'POST',
        headers: {
          ...(user && { 'x-user-id': user.id }),
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Get the actual error details from the API response
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorDetails = errorData.error || errorData.details || 'Unknown error';
          console.error('API Error Response:', errorData);
        } catch (parseError) {
          errorDetails = `HTTP ${response.status}: ${response.statusText}`;
          console.error('Failed to parse error response:', parseError);
        }
        
        throw new Error(`Failed to process audio: ${errorDetails}`);
      }

      const testResults = await response.json();
      setResults(testResults.results);
      setCurrentPhase(TEST_PHASES.RESULTS);
    } catch (error) {
      console.error('Error processing audio:', error);
      
      let errorMessage = 'Fehler beim Verarbeiten der Aufnahme';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Die Anfrage dauerte zu lange. Bitte versuchen Sie es erneut.';
        } else if (error.message.includes('No presentation data available')) {
          errorMessage = 'Bitte generieren Sie zuerst eine Präsentation, bevor Sie die Aufnahme stoppen.';
        } else if (error.message.includes('No topic selected')) {
          errorMessage = 'Bitte wählen Sie zuerst ein Thema aus.';
        } else if (error.message.includes('No audio data recorded')) {
          errorMessage = 'Keine Audiodaten aufgenommen. Bitte versuchen Sie es erneut.';
        } else if (error.message.includes('Audio file too large')) {
          errorMessage = 'Die Audiodatei ist zu groß. Bitte nehmen Sie einen kürzeren Clip auf.';
        } else {
          errorMessage = `Fehler beim Verarbeiten der Aufnahme: ${error.message}`;
        }
      }
      
      alert(errorMessage);
      setCurrentPhase(TEST_PHASES.RECORDING);
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


  // Stop all audio when recording starts
  const handleStartRecording = () => {
    // Validate that presentation is ready before allowing recording
    if (!presentation || presentation.length === 0) {
      alert('Bitte warten Sie, bis die Präsentation generiert wurde, bevor Sie mit der Aufnahme beginnen.');
      return;
    }
    
    transcriptAudio.stop();
    correctedAudio.stop();
    presentationAudio.stop();
    modelAnswerAudio.stop();
    stop(); // Also stop browser TTS
  };

  // Presentation voice function using useAudio hook
  const playPresentationVoice = async () => {
    if (presentationAudio.isPlaying) {
      presentationAudio.stop();
    } else {
      const text = presentation.map(slide => slide.content).join(' ');
      if (!text) return;
      
      try {
        // Check cache first
        if (audioCache.presentation) {
          await presentationAudio.play(undefined, audioCache.presentation);
          return;
        }
        
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) throw new Error('Failed to generate speech');

        const audioBlob = await response.blob();
        setAudioCache(prev => ({ ...prev, presentation: audioBlob }));
        await presentationAudio.play(undefined, audioBlob);
      } catch (error) {
        console.error('Error playing presentation audio:', error);
        speak(text); // Fallback to browser TTS
      }
    }
  };

  // Auto-play presentation audio when presentation is generated and displayed
  useEffect(() => {
    if (currentPhase === TEST_PHASES.RECORDING && presentation.length > 0 && !hasAutoPlayed) {
      // Small delay to ensure the component is fully rendered and text is displayed
      const timer = setTimeout(async () => {
        const presentationText = presentation.map(slide => slide.content).join(' ');
        if (presentationText) {
          try {
            // Check cache first
            if (audioCache.presentation) {
              await presentationAudio.play(undefined, audioCache.presentation);
            } else {
              const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: presentationText }),
              });

              if (response.ok) {
                const audioBlob = await response.blob();
                setAudioCache(prev => ({ ...prev, presentation: audioBlob }));
                await presentationAudio.play(undefined, audioBlob);
              } else {
                // Fallback to browser TTS
                speak(presentationText);
              }
            }
          } catch (error) {
            console.error('Error auto-playing presentation audio:', error);
            // Fallback to browser TTS
            speak(presentationText);
          }
        }
        setHasAutoPlayed(true); // Mark as auto-played to prevent looping
      }, 1000); // Increased delay to ensure text is fully displayed
      
      return () => clearTimeout(timer);
    }
  }, [presentation, currentPhase, hasAutoPlayed, speak, presentationAudio, audioCache.presentation]);

  // Presentation download function with caching
  const downloadPresentationAudio = async () => {
    const text = presentation.map(slide => slide.content).join(' ');
    if (!text) {
      alert('No presentation content available to download.');
      return;
    }

    try {
      setIsDownloadingPresentation(true);

      // Use cached audio if available, otherwise generate new
      let audioBlob = audioCache.presentation;
      if (!audioBlob) {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) throw new Error('Failed to generate speech');
        audioBlob = await response.blob();
        setAudioCache(prev => ({ ...prev, presentation: audioBlob }));
      }

      downloadBlob(audioBlob, `presentation-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.mp3`);
    } catch (error) {
      console.error('Error downloading presentation audio:', error);
      alert('Failed to download presentation audio. Please try again.');
    } finally {
      setIsDownloadingPresentation(false);
    }
  };


  // Render topic selection
  const renderTopicSelection = () => {
    const currentTopics = pagination.paginatedItems(SAMPLE_TOPICS);

    return (
      <div>
        <TopicSelection
          topics={currentTopics}
          selectedTopic={selectedTopic}
          onTopicSelect={(topic) => {
            console.log('Topic selected:', topic.title);
            setSelectedTopic(topic as Topic);
          }}
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.setCurrentPage}
          onContinue={() => {
            if (selectedTopic) {
              console.log('User selected topic:', selectedTopic.title);
              generatePresentation();
            } else {
              console.warn('No topic selected, cannot continue');
              alert('Bitte wählen Sie zuerst ein Thema aus.');
            }
          }}
          title={<TranslatedText translationKey="teil3.topic_selection_title" fallback="Thema auswählen - Teil 3" />}
          subtitle={<TranslatedText translationKey="teil3.topic_selection_subtitle" fallback="Wählen Sie ein Thema für Ihre Präsentation" />}
          continueButtonText={<TranslatedText translationKey="teil3.generate_presentation" fallback="Präsentation generieren" />}
          disabledButtonText={<TranslatedText translationKey="teil3.please_choose_topic" fallback="Bitte wählen Sie ein Thema" />}
        />
      </div>
    );
  };

  // Render recording
  const renderRecording = () => (
    <div className="bg-white rounded-lg shadow-xl p-4 lg:p-8">
      <div className="text-center mb-8">
        <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-900 mb-2">
        Rekam Tanggapan dan Pertanyaan Anda
        
        </h2>
        <p className="text-xs sm:text-sm lg:text-base text-slate-600 mb-4">
        Klik tombol Mikrofon hijau untuk mulai merekam tanggapan dan pertanyaan Anda
        </p>
      </div>

      {/* B1 Goethe Zertifikat Teil 3 Instructions */}
      <div className="bg-blue-50 p-6 rounded-xl mb-4 lg:mb-8">
        <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-blue-900 mb-4 text-left">Teil 3 Über ein Thema sprechen</h3>
        <p className="text-xs sm:text-sm lg:text-base text-blue-700 mb-4 text-left">
          Reagieren Sie auf die Rückmeldung und auf Fragen der Prüfer/-innen und des Gesprächspartners/der Gesprächspartnerin.
        </p>
        <p className="text-xs sm:text-sm lg:text-base text-blue-700 mb-4 text-left">
          Nach der Präsentation Ihres Partners/Ihrer Partnerin:
        </p>
        <div className="space-y-3 text-left">
          <div className="flex items-start gap-3">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</span>
            <p className="text-blue-700 text-xs sm:text-sm lg:text-base">
              Geben Sie eine Rückmeldung zur Präsentation Ihres Partners/Ihrer Partnerin (z. B. wie Ihnen die Präsentation gefallen hat, was für Sie neu oder besonders interessant war usw.).
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</span>
            <p className="text-blue-700 text-xs sm:text-sm lg:text-base">
              Stellen Sie auch eine Frage zur Präsentation Ihres Partners/Ihrer Partnerin.
            </p>
          </div>
        </div>
      </div>

      {/* Speaking Ideas Section */}
      {presentation.length > 0 && (
        <div className="bg-purple-50 p-4 lg:p-6 rounded-xl mb-4 lg:mb-8">
          <h3 className="font-semibold text-purple-800 mb-4">
            <TranslatedText 
              translationKey="teil3.ki_partner_presentation_title" 
              fallback="🤖 KI-Partner's Presentation"
            />
          </h3>


          {/* Presentation Content */}
          <div className="bg-white p-4 rounded-lg border border-purple-200 mb-4 relative">
            <div className="absolute top-2 right-2 group">
              <button
                onClick={() => handleCopyToClipboard(presentation.map(slide => slide.content).join(' '), setCopiedPresentation)}
                className={`flex items-center justify-center rounded-full w-10 h-10 gap-1 text-white transition-colors text-sm bg-purple-600 hover:bg-purple-700`}
              >
                {copiedPresentation ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-purple-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Copy text
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-purple-800"></div>
              </div>
            </div>
            <p className="text-xs sm:text-sm lg:text-base text-slate-700 italic mb-4 pr-8 lg:pr-16">
              &ldquo;{presentation.map(slide => slide.content).join(' ')}&rdquo;
            </p>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <button
                  onClick={playPresentationVoice}
                  className={`flex items-center gap-2 text-white w-10 h-10 justify-center rounded-full transition-colors ${
                    presentationAudio.isPlaying ? 'bg-purple-500' : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {presentationAudio.isPlaying ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-purple-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Read aloud
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-purple-800"></div>
                </div>
              </div>
              <div className="relative group">
                <button
                  onClick={() => downloadPresentationAudio()}
                  disabled={isDownloadingPresentation}
                  className={`flex items-center justify-center rounded-full w-10 h-10 gap-1 text-white transition-colors text-sm ${
                    isDownloadingPresentation 
                      ? 'bg-purple-500 cursor-not-allowed' 
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {isDownloadingPresentation ? (
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

        </div>
      )}


      {/* Recording section */}
      <div className="text-center">
        <div className="mb-6">
          <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-slate-900 mb-2">
            Topik: {selectedTopic?.title || 'Thema ausgewählt'}
          </h3>
        </div>

        <AudioRecorder
          onRecordingComplete={processAudio}
          onStartRecording={handleStartRecording}
        />
      </div>
    </div>
  );


  // Render results (using same format as Teil 1)
  const renderResults = () => {
    if (!results) return null;

    return (
      <div className="shadow-xl bg-white/90 backdrop-blur-sm rounded-lg mb-8 pb-8">
        <div className="text-center p-responsive-half">
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-900 mb-4">
            <TranslatedText 
              translationKey="teil3.test_results" 
              fallback="Test Results"
            /> - Teil 3
          </h2>
          <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm sm:text-base font-semibold ${results?.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
                  <TranslatedText 
                    translationKey="teil3.fluency" 
                    fallback="Flüssigkeit"
                  />:
                </span>
                <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(results?.scores?.fluency || 0)}/100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700 font-medium text-sm sm:text-base">
                  <TranslatedText 
                    translationKey="teil3.vocabulary" 
                    fallback="Wortschatz"
                  />:
                </span>
                <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(results?.scores?.vocabulary || 0)}/100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700 font-medium text-sm sm:text-base">
                  <TranslatedText 
                    translationKey="teil3.grammar" 
                    fallback="Grammatik"
                  />:
                </span>
                <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(results?.scores?.grammar || 0)}/100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700 font-medium text-sm sm:text-base">
                  <TranslatedText 
                    translationKey="teil3.pronunciation" 
                    fallback="Aussprache"
                  />:
                </span>
                <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(results?.scores?.pronunciation || 0)}/100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700 font-medium text-sm sm:text-base">
                  <TranslatedText 
                    translationKey="teil3.task_completion" 
                    fallback="Aufgabenbewältigung"
                  />:
                </span>
                <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(results?.scores?.task_completion || 0)}/100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700 font-medium text-sm sm:text-base">
                  <TranslatedText 
                    translationKey="teil3.interaction_reaction" 
                    fallback="Interaktion und Reaktion"
                  />:
                </span>
                <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(results?.scores?.interaction_reaction || 0)}/100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700 font-medium text-sm sm:text-base">
                  <TranslatedText 
                    translationKey="teil3.language_appropriateness" 
                    fallback="Sprachliche Angemessenheit"
                  />:
                </span>
                <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(results?.scores?.language_appropriateness || 0)}/100</span>
              </div>

              {/* Overall Score */}
              <div className="border-t border-slate-300 pt-3 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-800 font-bold text-base sm:text-lg">
                    Gesamt:
                  </span>
                  <span className={`font-bold text-lg sm:text-xl ${Math.round(results?.scores?.overall || 0) >= 80 ? 'text-green-600' :
                      Math.round(results?.scores?.overall || 0) >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                    }`}>{Math.round(results?.scores?.overall || 0)}/100</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-slate-800 font-bold text-base sm:text-lg">
                    Prädikat:
                  </span>
                  <span className={`font-bold text-base sm:text-lg ${Math.round(results?.scores?.overall || 0) >= 90 ? 'text-green-600' :
                    Math.round(results?.scores?.overall || 0) >= 80 ? 'text-blue-600' :
                      Math.round(results?.scores?.overall || 0) >= 70 ? 'text-yellow-600' :
                        Math.round(results?.scores?.overall || 0) >= 60 ? 'text-orange-600' :
                          'text-red-600'
                      }`}>
                    {Math.round(results?.scores?.overall || 0) >= 90 ? 'Sehr gut' :
                      Math.round(results?.scores?.overall || 0) >= 80 ? 'Gut' :
                        Math.round(results?.scores?.overall || 0) >= 70 ? 'Befriedigend' :
                          Math.round(results?.scores?.overall || 0) >= 60 ? 'Ausreichend' :
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

        {/* Transcript */}
        {results?.transcript && (
          <div className="bg-slate-50 p-responsive-half rounded-xl mb-3 mx-3 lg:mb-8 lg:mx-8">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-900 mb-4">
            <TranslatedText 
              translationKey="sections.transcript" 
              fallback="Transcript"
            />
            </h3>
            <div className="bg-white p-4 rounded-lg border relative">
              <div className="absolute top-2 right-2 group">
                <button
                  onClick={() => results?.transcript && handleCopyToClipboard(results.transcript, setCopiedTranscript)}
                  className={`flex items-center justify-center rounded-full w-10 h-10 gap-1 text-white transition-colors text-sm bg-slate-600 hover:bg-slate-700`}
                >
                  {copiedTranscript ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Copy text
                  <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                </div>
              </div>
              <p className="text-xs sm:text-sm lg:text-base text-slate-700 italic pr-8 lg:pr-16 mb-4">&ldquo;{results?.transcript}&rdquo;</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={speakTranscript}
                  className={`flex items-center justify-center rounded-full w-10 h-10 gap-1 text-white transition-colors text-sm ${
                    transcriptAudio.isPlaying ? 'bg-slate-500' : 'bg-slate-600 hover:bg-slate-700'
                  }`}
                >
                  {transcriptAudio.isPlaying ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={downloadTranscriptAudio}
                  disabled={isDownloadingTranscript}
                  className={`flex items-center justify-center rounded-full w-10 h-10 gap-1 text-white transition-colors text-sm ${
                    isDownloadingTranscript 
                      ? 'bg-slate-500 cursor-not-allowed' 
                      : 'bg-slate-600 hover:bg-slate-700'
                  }`}
                >
                  {isDownloadingTranscript ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Corrected Text */}
        {results?.correctedText && (
          <div className="bg-green-50 p-responsive-half rounded-xl mb-3 mx-3 lg:mb-8 lg:mx-8">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-green-800 mb-4">
              <TranslatedText 
                translationKey="teil3.corrected_version" 
                fallback="Korrigierte Version"
              />
            </h3>
            <div className="text-xs sm:text-sm lg:text-base text-green-700 mb-4 font-medium">
              {results?.correctedText}
            </div>
            <div className="bg-white p-4 rounded-lg border border-green-200 relative">
              <div className="absolute top-2 right-2 group">
                <button
                  onClick={() => results?.correctedText && handleCopyToClipboard(results.correctedText, setCopiedCorrected)}
                  className={`flex items-center justify-center rounded-full w-10 h-10 gap-1 text-white transition-colors text-sm bg-green-600 hover:bg-green-700`}
                >
                  {copiedCorrected ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-green-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Copy text
                  <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-800"></div>
                </div>
              </div>
              <p className="text-xs sm:text-sm lg:text-base text-slate-700 italic mb-4 pr-8 lg:pr-16">&ldquo;{results?.correctedText}&rdquo;</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={speakCorrected}
                  className={`flex items-center justify-center rounded-full w-10 h-10 gap-1 text-white transition-colors text-sm ${
                    correctedAudio.isPlaying ? 'bg-green-500' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {correctedAudio.isPlaying ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={downloadCorrectedAudio}
                  disabled={isDownloadingCorrected}
                  className={`flex items-center justify-center rounded-full w-10 h-10 gap-1 text-white transition-colors text-sm ${
                    isDownloadingCorrected 
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
              </div>
            </div>
          </div>
        )}

        {/* Grammar Corrections - Display exactly as received from OpenAI */}
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

        {/* Improved Expressions - Display exactly as received from OpenAI */}
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

        {/* Speaking Ideas Section - Display exactly as received from OpenAI */}
        {results?.modelAnswer && (
          <div className="bg-purple-50 p-responsive-half rounded-xl mb-3 mx-3 lg:mb-8 lg:mx-8">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-purple-800 mb-4">
              <TranslatedText 
                translationKey="sections.speaking_ideas" 
                fallback="💡 Speaking Ideas"
              />
            </h3>

            <div className="bg-white p-4 rounded-lg border border-purple-200 mb-4 relative">
              <div className="absolute top-2 right-2 group">
                <button
                  onClick={() => results.modelAnswer && handleCopyToClipboard(results.modelAnswer, setCopiedPresentation)}
                  className={`flex items-center justify-center rounded-full w-10 h-10 gap-1 text-white transition-colors text-sm bg-purple-600 hover:bg-purple-700`}
                >
                  {copiedPresentation ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-purple-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Copy text
                  <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-purple-800"></div>
                </div>
              </div>
              <p className="text-xs sm:text-sm lg:text-base text-slate-700 italic pr-8 lg:pr-16 mb-4">&ldquo;{results.modelAnswer}&rdquo;</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    if (modelAnswerAudio.isPlaying) {
                      modelAnswerAudio.stop();
                    } else {
                      const text = results?.modelAnswer || '';
                      if (!text) return;
                      
                      try {
                        // Check cache first
                        if (audioCache.modelAnswer) {
                          await modelAnswerAudio.play(undefined, audioCache.modelAnswer);
                          return;
                        }
                        
                        const response = await fetch('/api/tts', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ text }),
                        });

                        if (!response.ok) throw new Error('Failed to generate speech');

                        const audioBlob = await response.blob();
                        setAudioCache(prev => ({ ...prev, modelAnswer: audioBlob }));
                        await modelAnswerAudio.play(undefined, audioBlob);
                      } catch (error) {
                        console.error('Error playing model answer audio:', error);
                        speak(text); // Fallback to browser TTS
                      }
                    }
                  }}
                  className={`flex items-center justify-center rounded-full w-10 h-10 gap-1 text-white transition-colors text-sm ${
                    modelAnswerAudio.isPlaying ? 'bg-purple-500' : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {modelAnswerAudio.isPlaying ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={async () => {
                    const text = results?.modelAnswer || '';
                    if (!text) {
                      alert('No speaking ideas available to download.');
                      return;
                    }

                    try {
                      setIsDownloadingModelAnswer(true);

                      // Use cached audio if available, otherwise generate new
                      let audioBlob = audioCache.modelAnswer;
                      if (!audioBlob) {
                        const response = await fetch('/api/tts', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ text }),
                        });

                        if (!response.ok) throw new Error('Failed to generate speech');
                        audioBlob = await response.blob();
                        setAudioCache(prev => ({ ...prev, modelAnswer: audioBlob }));
                      }

                      downloadBlob(audioBlob, `speaking-ideas-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.mp3`);
                    } catch (error) {
                      console.error('Error downloading speaking ideas audio:', error);
                      alert('Failed to download speaking ideas audio. Please try again.');
                    } finally {
                      setIsDownloadingModelAnswer(false);
                    }
                  }}
                  disabled={isDownloadingModelAnswer}
                  className={`flex items-center justify-center rounded-full w-10 h-10 gap-1 text-white transition-colors text-sm ${
                    isDownloadingModelAnswer 
                      ? 'bg-purple-500 cursor-not-allowed' 
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {isDownloadingModelAnswer ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-purple-100 p-4 rounded-lg border border-purple-300 mt-4">
              <h4 className="text-xs sm:text-sm lg:text-base font-semibold text-purple-800 mb-2">
                Warum dies den B1 Goethe Zertifikat Kriterien entspricht:
              </h4>
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
        )}


        {/* Action buttons */}
        <div className="text-center space-x-4">
          <button
            onClick={async () => {
              await cleanupTestAudioFiles();
              window.location.href = '/speaking';
            }}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors"
          >
            <TranslatedText 
              translationKey="teil3.new_test" 
              fallback="Neuer Test"
            />
          </button>
        </div>
      </div>
    );
  };

  // Show loading spinner when audio system is not ready
  if (!isAudioReady) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 lg:p-12 xl:p-16">
        <div className="max-w-7xl mx-auto h-full flex min-h-0">
          <div className="w-full h-full min-h-0 overflow-hidden">
            <LoadingCard type="audio" />
          </div>
        </div>
      </div>
    );
  }

  // Show loading spinner when generating presentation
  if (isProcessing && currentPhase === TEST_PHASES.TOPIC_SELECTION) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 lg:p-6 xl:p-8 2xl:p-10 flex items-center justify-center">
        <div className="w-full h-full mx-auto">
          <div className="shadow-xl bg-white/90 backdrop-blur-sm rounded-lg p-12 lg:p-16 xl:p-20 2xl:p-24 text-center h-full flex flex-col justify-center items-center">
            <div className="flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Lottie
                animationData={owlReadingAnimation}
                loop={true}
                autoplay={true}
                className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-32 xl:h-32 2xl:w-40 2xl:h-40"
              />
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-semibold text-slate-900 mb-4 sm:mb-6">
              <TranslatedText 
                translationKey="teil3.presentation_loading" 
                fallback="Memuat presentasi..."
              />
            </h3>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl text-slate-600 mb-6 sm:mb-8">
              <TranslatedText 
                translationKey="teil3.presentation_loading_subtitle" 
                fallback="Harap tunggu, partner AI sedang menyiapkan presentasi..."
              />
            </p>
            <div className="space-y-3 text-left max-w-lg mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span className="text-slate-700 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">
                  <TranslatedText 
                    translationKey="teil3.generating_content" 
                    fallback="Membuat konten presentasi"
                  />
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-100"></div>
                <span className="text-slate-700 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">
                  <TranslatedText 
                    translationKey="teil3.structuring_slides" 
                    fallback="Menyusun struktur presentasi"
                  />
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-200"></div>
                <span className="text-slate-700 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">
                  <TranslatedText 
                    translationKey="teil3.optimizing_content" 
                    fallback="Mengoptimalkan konten"
                  />
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-300"></div>
                <span className="text-slate-700 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">
                  <TranslatedText 
                    translationKey="teil3.finalizing_presentation" 
                    fallback="Menyelesaikan presentasi"
                  />
                </span>
              </div>
            </div>
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
          {currentPhase === TEST_PHASES.RECORDING && renderRecording()}
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
