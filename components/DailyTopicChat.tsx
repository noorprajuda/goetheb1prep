"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  MessageSquare, 
  User, 
  Bot, 
  Download, 
  Copy, 
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  Calendar,
  Square,
  BookOpen,
  Target,
  Lightbulb,
  ArrowLeft
} from 'lucide-react';

interface ConversationMessage {
  type: 'user' | 'assistant';
  content: string;
  timestamp: number;
  audioUrl?: string;
}

interface DailyTopic {
  id: string;
  title: string;
  description: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  category: string;
  conversationStarters: string[];
  vocabulary: string[];
  grammarPoints: string[];
}

const DAILY_TOPICS: DailyTopic[] = [
  {
    id: '1',
    title: 'Gesundheit und Arztbesuch',
    description: 'Lernen Sie, über Gesundheit, Symptome und Arztbesuche zu sprechen',
    level: 'B1',
    category: 'Gesundheit',
    conversationStarters: [
      'Wie geht es Ihnen heute?',
      'Haben Sie Schmerzen?',
      'Wann waren Sie das letzte Mal beim Arzt?'
    ],
    vocabulary: ['Symptom', 'Schmerz', 'Arzt', 'Krankenhaus', 'Medikament', 'Termin'],
    grammarPoints: ['Perfekt', 'Modalverben', 'Präpositionen']
  },
  {
    id: '2',
    title: 'Essen und Kochen',
    description: 'Diskutieren Sie über Lieblingsgerichte, Rezepte und Restaurantbesuche',
    level: 'A2',
    category: 'Alltag',
    conversationStarters: [
      'Was ist Ihr Lieblingsgericht?',
      'Kochen Sie gerne?',
      'Wo essen Sie am liebsten?'
    ],
    vocabulary: ['Rezept', 'Zutat', 'Geschmack', 'Restaurant', 'Küche', 'Mahlzeit'],
    grammarPoints: ['Akkusativ', 'Dativ', 'Adjektive']
  },
  {
    id: '3',
    title: 'Reisen und Urlaub',
    description: 'Planen Sie Reisen und teilen Sie Urlaubserfahrungen',
    level: 'B1',
    category: 'Reisen',
    conversationStarters: [
      'Wohin möchten Sie reisen?',
      'Was war Ihr schönster Urlaub?',
      'Reisen Sie lieber allein oder in der Gruppe?'
    ],
    vocabulary: ['Reise', 'Urlaub', 'Hotel', 'Flugzeug', 'Koffer', 'Sehenswürdigkeit'],
    grammarPoints: ['Futur I', 'Präpositionen', 'Lokale Angaben']
  }
];

export default function DailyTopicChat() {
  const [selectedTopic, setSelectedTopic] = useState<DailyTopic | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  // const [isSpeaking, setIsSpeaking] = useState(false);
  
  // WebRTC and OpenAI Realtime API states
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  
  // Audio states
  const [, setUserAudioUrl] = useState<string | null>(null);
  const [, setAiAudioUrl] = useState<string | null>(null);
  // const [mergedAudioUrl, setMergedAudioUrl] = useState<string | null>(null);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  // const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const websocketRef = useRef<WebSocket | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Initialize WebRTC connection with OpenAI Realtime API
  const initializeConnection = useCallback(async () => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    try {
      setConnectionState('connecting');
      setError(null);

      // Get ephemeral session key
      const sessionResponse = await fetch('/api/realtime/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic: selectedTopic?.title || 'Allgemeines Gespräch',
          level: selectedTopic?.level || 'B1'
        })
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to create session');
      }

      await sessionResponse.json();

      // Initialize WebRTC connection
      const ws = new WebSocket(`wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`);

      websocketRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionState('connected');
        setIsConnected(true);
        
        // Send session configuration
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: `Du bist ein freundlicher deutscher Gesprächspartner. Sprich nur auf Deutsch. 
            Das heutige Thema ist: ${selectedTopic?.title || 'Allgemeines Gespräch'}.
            Führe ein natürliches Gespräch auf ${selectedTopic?.level || 'B1'}-Niveau.
            Stelle Fragen, zeige Interesse und hilf beim Lernen.
            Verwende die Vokabeln: ${selectedTopic?.vocabulary.join(', ') || ''}.
            Fokussiere auf diese Grammatik: ${selectedTopic?.grammarPoints.join(', ') || ''}.`,
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500
            },
            tools: [],
            tool_choice: 'auto',
            temperature: 0.8,
            max_response_output_tokens: 4096
          }
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data);

        switch (data.type) {
          case 'response.audio.delta':
            // Handle AI audio response
            if (data.delta) {
              // Convert base64 audio to blob and play
              const audioData = atob(data.delta);
              const audioBuffer = new Uint8Array(audioData.length);
              for (let i = 0; i < audioData.length; i++) {
                audioBuffer[i] = audioData.charCodeAt(i);
              }
              
              const audioBlob = new Blob([audioBuffer], { type: 'audio/pcm' });
              const audioUrl = URL.createObjectURL(audioBlob);
              setAiAudioUrl(audioUrl);
              
              // Play audio
              const audio = new Audio(audioUrl);
              audio.play();
            }
            break;
            
          case 'response.text.delta':
            // Handle AI text response
            if (data.delta) {
              setMessages(prev => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage && lastMessage.type === 'assistant') {
                  return [
                    ...prev.slice(0, -1),
                    { ...lastMessage, content: lastMessage.content + data.delta }
                  ];
                } else {
                  return [...prev, {
                    type: 'assistant',
                    content: data.delta,
                    timestamp: Date.now()
                  }];
                }
              });
            }
            break;
            
          case 'response.done':
            console.log('Response completed');
            setIsProcessing(false);
            break;
            
          case 'error':
            console.error('WebSocket error:', data.error);
            setError(data.error.message);
            setConnectionState('error');
            break;
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionState('disconnected');
        setIsConnected(false);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error');
        setConnectionState('error');
      };

    } catch (error) {
      console.error('Connection error:', error);
      setError('Failed to connect to OpenAI Realtime API');
      setConnectionState('error');
    }
  }, [selectedTopic]);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setUserAudioUrl(audioUrl);
        
        // Send audio to WebRTC
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
          // Convert audio to base64 and send
          const arrayBuffer = await audioBlob.arrayBuffer();
          const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          
          websocketRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64Audio
          }));
          
          websocketRef.current.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: '[User spoke in German]'
                }
              ]
            }
          }));
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to access microphone');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  // Copy conversation
  const copyConversation = async () => {
    const conversationText = messages.map(msg => 
      `${msg.type === 'user' ? 'Sie' : 'KI'}: ${msg.content}`
    ).join('\n');
    
    try {
      await navigator.clipboard.writeText(conversationText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Download conversation
  const downloadConversation = () => {
    const conversationText = messages.map(msg => 
      `${msg.type === 'user' ? 'Sie' : 'KI'}: ${msg.content}`
    ).join('\n');
    
    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-topic-conversation-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Speak text
  // const speakText = (text: string) => {
  //   if (speechSynthesisRef.current) {
  //     window.speechSynthesis.cancel();
  //   }
    
  //   const utterance = new SpeechSynthesisUtterance(text);
  //   utterance.lang = 'de-DE';
  //   utterance.rate = 0.9;
  //   utterance.pitch = 1.0;
    
  //   utterance.onstart = () => setIsSpeaking(true);
  //   utterance.onend = () => setIsSpeaking(false);
  //   utterance.onerror = () => setIsSpeaking(false);
    
  //   speechSynthesisRef.current = utterance;
  //   window.speechSynthesis.speak(utterance);
  // };

  // Stop speaking
  // const stopSpeaking = () => {
  //   window.speechSynthesis.cancel();
  //   setIsSpeaking(false);
  // };

  // Cleanup on unmount
  useEffect(() => {
    const websocket = websocketRef.current;
    const speechSynthesis = speechSynthesisRef.current;
    
    return () => {
      if (websocket) {
        websocket.close();
      }
      if (speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!selectedTopic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Calendar className="w-8 h-8 text-blue-600" />
              <h1 className="text-4xl font-bold text-slate-900">Tägliches Gesprächsthema</h1>
            </div>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Wählen Sie ein Thema für heute und führen Sie ein natürliches Gespräch mit KI auf Deutsch
            </p>
          </div>

          {/* Topics Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DAILY_TOPICS.map((topic) => (
              <div
                key={topic.id}
                onClick={() => setSelectedTopic(topic)}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group border border-slate-200 hover:border-blue-300"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      topic.level === 'A1' || topic.level === 'A2' ? 'bg-green-100 text-green-800' :
                      topic.level === 'B1' || topic.level === 'B2' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {topic.level}
                    </span>
                    <span className="text-sm text-slate-500">{topic.category}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {topic.title}
                  </h3>
                  
                  <p className="text-slate-600 mb-4 leading-relaxed">
                    {topic.description}
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Gesprächsstarter
                      </h4>
                      <ul className="text-sm text-slate-600 space-y-1">
                        {topic.conversationStarters.slice(0, 2).map((starter, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>&quot;{starter}&quot;</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Vokabeln
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {topic.vocabulary.slice(0, 4).map((word, index) => (
                          <span key={index} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-sm">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedTopic(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{selectedTopic.title}</h1>
                <p className="text-slate-600">{selectedTopic.description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                {connectionState === 'connected' ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <Wifi className="w-4 h-4" />
                    <span className="text-sm font-medium">Verbunden</span>
                  </div>
                ) : connectionState === 'connecting' ? (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">Verbinde...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <WifiOff className="w-4 h-4" />
                    <span className="text-sm font-medium">Getrennt</span>
                  </div>
                )}
              </div>
              
              {/* Level Badge */}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedTopic.level === 'A1' || selectedTopic.level === 'A2' ? 'bg-green-100 text-green-800' :
                selectedTopic.level === 'B1' || selectedTopic.level === 'B2' ? 'bg-blue-100 text-blue-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {selectedTopic.level}
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chat Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    Gespräch
                  </h3>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyConversation}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Kopieren"
                    >
                      <Copy className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={downloadConversation}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-slate-500 py-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>Beginnen Sie das Gespräch, indem Sie auf das Mikrofon klicken</p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-md p-4 rounded-lg ${
                        message.type === 'user' 
                          ? 'bg-blue-100 text-blue-900' 
                          : 'bg-slate-100 text-slate-900'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                          <span className="font-semibold text-sm">
                            {message.type === 'user' ? 'Sie' : 'KI'}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        {message.audioUrl && (
                          <audio controls className="w-full mt-2">
                            <source src={message.audioUrl} type="audio/webm" />
                          </audio>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Recording Controls */}
              <div className="p-4 border-t border-slate-200">
                <div className="flex items-center justify-center gap-4">
                  {!isConnected ? (
                    <button
                      onClick={initializeConnection}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Wifi className="w-4 h-4" />
                      Verbinden
                    </button>
                  ) : (
                    <>
                      {isRecording ? (
                        <button
                          onClick={stopRecording}
                          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <Square className="w-4 h-4" />
                          Aufnahme stoppen
                        </button>
                      ) : (
                        <button
                          onClick={startRecording}
                          disabled={isProcessing}
                          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                          <Mic className="w-4 h-4" />
                          Sprechen
                        </button>
                      )}
                      
                      {isRecording && (
                        <div className="flex items-center gap-2 text-red-600">
                          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                          <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
                        </div>
                      )}
                      
                      {isProcessing && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm font-medium">Verarbeitung...</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Topic Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Thema-Info
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Gesprächsstarter</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    {selectedTopic.conversationStarters.map((starter, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>&quot;{starter}&quot;</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Vokabeln</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTopic.vocabulary.map((word, index) => (
                      <span key={index} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-sm">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Grammatik</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTopic.grammarPoints.map((point, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm">
                        {point}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                Tipps
              </h3>
              
              <ul className="text-sm text-slate-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  <span>Sprechen Sie natürlich und entspannt</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  <span>Verwenden Sie die vorgeschlagenen Vokabeln</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  <span>Stellen Sie Fragen zum Thema</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  <span>Lassen Sie sich von der KI korrigieren</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Copy Success */}
        {copySuccess && (
          <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Gespräch kopiert!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
