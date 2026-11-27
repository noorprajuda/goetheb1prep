"use client";
import React, { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, Clock, BookOpen, Target } from "lucide-react";
import TranslatedText from "@/components/TranslatedText";
import LoadingCard from "@/components/shared/LoadingCard";
import { useAuth } from "@/contexts/AuthContext";

interface Question {
  id: number;
  text: string;
  options: {
    a: string;
    b: string;
    c?: string;
  };
  correctAnswer: 'a' | 'b' | 'c';
  explanation: string;
  teil: number;
}

interface TestResults {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  answers: Array<{
    questionId: number;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
  }>;
  passed: boolean;
}

const TEST_PHASES = {
  INSTRUCTIONS: 'instructions',
  TEXT_READING: 'text_reading',
  TESTING: 'testing',
  PROCESSING: 'processing',
  RESULTS: 'results'
};

const TEXTS = {
  1: {
    title: "So lebe ich",
    content: `Mein Name ist Clemens. Ich bin 12 Jahre alt und mein Vater ist Diplomat. Deshalb ziehen wir alle drei bis vier Jahre in ein anderes Land. Ich wurde in Deutschland geboren, aber schon zwei Wochen nach meiner Geburt bin ich mit meiner Mutter nach Beirut, die Hauptstadt des Libanon, geflogen. An diese Zeit erinnere ich mich kaum.

Das erste Land, an das ich mich erinnere, ist Portugal. Wir hatten dort ein pinkfarbenes Haus mit großem Garten. Am Wochenende waren wir oft an einem wunderschönen Strand nördlich von Lissabon. Das Meer – eigentlich der Ozean – war herrlich blau und ich spielte gern im Sand.

Englisch musste ich früh lernen, weil ich in einen internationalen Kindergarten ging, wo Kinder aus vielen Ländern Englisch sprachen.

Als ich fünf war, zogen wir nach Berlin. Am Anfang gefiel es mir dort nicht: zu kalt, kein Meer, keine schwarzen Oliven zum Frühstück. Aber nach einer Weile gewöhnte ich mich an das Neue und Deutschland wurde zu meiner Heimat. Ich dachte, wir bleiben dort für immer – doch nach sieben Jahren mussten wir wieder umziehen.

Seit einem halben Jahr lebe ich mit meiner Familie in New York. Jetzt bin ich froh, dass ich Englisch kann. New York ist eine der aufregendsten Städte der Welt. Es ist in vielen Dingen ganz anders als Berlin: In manche Stadtviertel gehen Menschen nur zur Arbeit, in anderen wohnen sie, und manche meiden sie ganz, weil sie zu gefährlich sind.

Ich habe gelernt, dass man Zeit braucht, um sich an ein neues Land zu gewöhnen. Irgendwann wird sich auch New York wie Heimat anfühlen. Manchmal denke ich, es wäre schön, immer an einem Ort zu leben. Aber ehrlich gesagt ist es sehr spannend, die Welt kennenzulernen.`
  },
  2: {
    title: "Ni Hao, Mama!",
    content: `Wenn Tongchun Jiang begeistert von seiner „Mama" spricht, denken viele andere Studenten zuerst, er meine seine Mutter in Shanghai. Doch in Wirklichkeit meint er Rita Jakobson aus Offenburg, bei der er jeden Sonntag auf dem Sofa sitzt und Sandkuchen isst.

Rita und ihr Mann Gerald Jakobson nehmen an einem besonderen Projekt teil: „Senioren für ausländische Studenten". Dabei kümmern sich ältere Menschen ehrenamtlich um Studierende aus dem Ausland. Sie sind wie „Leih-Eltern" für die jungen Leute – und so auch für Tongchun aus China und drei weitere Gaststudenten.

Was die Jakobsons mit ihren „Pflegekindern" unternehmen, könnte man als einen kleinen Crashkurs im typisch deutschen Familienleben bezeichnen. Sie gehen zusammen spazieren, machen Wanderungen, sitzen gemeinsam im Wohnzimmer und spielen Karten. Und sie stellen Fragen, wie sie Eltern ihren Kindern stellen würden: „Wie läuft es an der Uni?" oder „Was machen die Noten?"

„Wenn ich eine gute Note bekomme, rufe ich zuerst Mama an", sagt Tongchun lachend.

Für die Jakobsons ist der Informatikstudent aus Shanghai ein Sohn auf Zeit. „Als unsere eigenen Kinder aus dem Haus waren, wollten wir uns um andere junge Menschen kümmern. Dazu gehört bei uns alles – vom Wäschewaschen bis hin zum gemeinsamen Silvesterfeiern", erklärt Rita Jakobson.

Dass ältere Menschen aus Offenburg für viele Gaststudenten attraktiver sind als Partys in Berlin, zeigen auch die Zahlen: Am Anfang ihres Aufenthalts wollen nur etwa 20 % der Gaststudenten nach dem Studium in Deutschland bleiben – am Ende sind es rund 80 %. Das spricht für sich.`
  },
  3: {
    title: "WebStamp – Persönliche Briefmarken",
    content: `Die Schweizerische Post hatte mit der WebStamp, einer elektronischen Briefmarke, eine neue und kreative Idee. WebStamp bietet die Möglichkeit, eigene Briefmarken direkt am Computer zu gestalten und auszudrucken.

Besonders interessant ist diese innovative Online-Frankierlösung für Firmen, denn Briefe und Mailings mit individuellen Marken fallen sofort auf und sorgen beim Empfänger für Aufmerksamkeit. So kann man mit der Briefmarke gleichzeitig eine kleine Werbung versenden und bleibt bei Kunden in Erinnerung.

Die Vorteile von WebStamp kann man sehr einfach nutzen. Nach der Anmeldung auf der Webseite der Schweizerischen Post kann man sofort mit dem Gestalten beginnen. Als Motiv ist alles möglich: Fotos, Firmenlogos, Produktlogos, Grafiken oder Werbebotschaften.

WebStamp funktioniert komplett online und ist kostenlos – man bezahlt nur den Wert der Briefmarke selbst. Eine Briefmarke mit dem Wert von 1 Franken kostet also genau 1 Franken. Diese neuen Briefmarken gelten sowohl im Inland als auch im Ausland.

Da das Ganze über Computerprogramme läuft, sind auch verschiedene Druckformate möglich. Zum Beispiel kann man die Empfängeradresse direkt in die WebStamp integrieren. Die Adressen lassen sich sogar direkt aus Excel-Dateien importieren.

Weitere Informationen und Ideen zur Gestaltung finden Sie in der Info-Broschüre der Schweizerischen Post unter: www.post.ch/webstamp`
  },
  4: {
    title: "Kettenmail",
    content: `Kettenmails sind E-Mails, die an viele Personen weitergeleitet werden, oft mit der Aufforderung, sie an weitere Personen weiterzuleiten. Diese E-Mails können verschiedene Inhalte haben: von harmlosen Witzen und Geschichten bis hin zu Warnungen vor angeblichen Gefahren oder Bitten um Hilfe.

Das Problem mit Kettenmails liegt darin, dass sie oft Spam verursachen und persönliche E-Mail-Adressen preisgeben. Wenn eine Kettenmail an viele Personen weitergeleitet wird, werden alle E-Mail-Adressen sichtbar, was ein Datenschutzproblem darstellt.

Außerdem können Kettenmails falsche Informationen verbreiten. Oft enthalten sie ungeprüfte Behauptungen oder sogar bewusst irreführende Inhalte. Dies kann zu Verwirrung oder sogar Panik führen.

Die beste Strategie im Umgang mit Kettenmails ist, sie zu ignorieren und nicht weiterzuleiten. Wenn Sie eine wichtige Information erhalten haben, prüfen Sie diese aus vertrauenswürdigen Quellen, bevor Sie sie teilen.`
  },
  5: {
    title: "Deutsches Museum – Informationen",
    content: `Öffnungszeiten:
• Täglich: 9:00 – 17:00 Uhr
• Einlass bis: 16:00 Uhr

Eintrittspreise:
• Erwachsene: 8,50 €
• Schüler & Studierende: 7,00 €
• Ermäßigt: 3,00 €
• Kinder unter 6 Jahren & Mitglieder: frei

Führungen:
• Schulklassen-, Übersichts- und Fachführungen in Deutsch und Fremdsprachen
• Anmeldung für Schulklassen: schriftlich, 6 Wochen vorher
• Führungen und Vorführungen für Einzelpersonen & Familien: kostenlos (außer Planetarium + Übersichtsführung)

Gastronomie:
• Restaurant: 9:00–17:00 Uhr (warme Küche: Mo–Fr 10:30–15:00, Sa–So 10:30–15:30)
• Cafeteria: 9:00–15:30 Uhr (Mitgebrachtes darf verzehrt werden)

Barrierefreiheit:
• Fast alle Ausstellungen sind mit Rampen und Aufzügen erreichbar.
• Toiletten: Erdgeschoss und 1. OG.

Shop:
• Bücher, Kataloge, Publikationen und Fachliteratur erhältlich.

Anfahrt:
• S-Bahn: alle Linien bis Isartor
• U-Bahn: Linien U1 & U2 bis Fraunhoferstraße
• Straßenbahn: Linie 18 (Deutsches Museum) oder Linie 17 (Isartor)
• ❌ Keine Parkplätze verfügbar`
  }
};

const QUESTIONS: Question[] = [
  // Teil 1 - "So lebe ich" (6 questions)
  {
    id: 1,
    text: "Clemens kann sich kaum noch an die Zeit im Libanon erinnern.",
    options: { a: "Richtig", b: "Falsch" },
    correctAnswer: 'a',
    explanation: "Der Text sagt: 'An diese Zeit erinnere ich mich kaum.'",
    teil: 1
  },
  {
    id: 2,
    text: "Clemens' Haus in Portugal lag direkt am Meer.",
    options: { a: "Richtig", b: "Falsch" },
    correctAnswer: 'b',
    explanation: "Der Text sagt: 'Am Wochenende waren wir oft an einem wunderschönen Strand nördlich von Lissabon.' Das Haus lag nicht direkt am Meer.",
    teil: 1
  },
  {
    id: 3,
    text: "Clemens besuchte einen englischsprachigen Kindergarten.",
    options: { a: "Richtig", b: "Falsch" },
    correctAnswer: 'a',
    explanation: "Der Text sagt: 'Englisch musste ich früh lernen, weil ich in einen internationalen Kindergarten ging, wo Kinder aus vielen Ländern Englisch sprachen.'",
    teil: 1
  },
  {
    id: 4,
    text: "In Berlin wohnte Clemens bis zu seinem siebten Lebensjahr.",
    options: { a: "Richtig", b: "Falsch" },
    correctAnswer: 'b',
    explanation: "Der Text sagt: 'Als ich fünf war, zogen wir nach Berlin... nach sieben Jahren mussten wir wieder umziehen.' Das bedeutet, er war 5+7=12 Jahre alt, als er Berlin verließ.",
    teil: 1
  },
  {
    id: 5,
    text: "Clemens findet, Berlin und New York sind sehr unterschiedlich.",
    options: { a: "Richtig", b: "Falsch" },
    correctAnswer: 'a',
    explanation: "Der Text sagt: 'New York ist eine der aufregendsten Städte der Welt. Es ist in vielen Dingen ganz anders als Berlin.'",
    teil: 1
  },
  {
    id: 6,
    text: "In New York fühlt sich Clemens schon wie zu Hause.",
    options: { a: "Richtig", b: "Falsch" },
    correctAnswer: 'b',
    explanation: "Der Text sagt: 'Irgendwann wird sich auch New York wie Heimat anfühlen.' Das bedeutet, es fühlt sich noch nicht wie Heimat an.",
    teil: 1
  },
  
  // Teil 2 - "Ni Hao, Mama!" (3 questions)
  {
    id: 7,
    text: "In diesem Text geht es darum, …",
    options: { 
      a: "wie gut das Verhältnis zwischen ausländischen Studenten und Deutschen ist.",
      b: "welche Probleme ein Gaststudent aus China in Deutschland hat.",
      c: "was das Projekt 'Senioren für ausländische Studenten' ist."
    },
    correctAnswer: 'c',
    explanation: "Der Text erklärt das Projekt 'Senioren für ausländische Studenten' und wie es funktioniert.",
    teil: 2
  },
  {
    id: 8,
    text: "Das Ehepaar Jakobson …",
    options: { 
      a: "wollte nicht, dass die eigenen Kinder ausziehen.",
      b: "sieht seine Gaststudenten regelmäßig.",
      c: "machte erst einmal einen Crashkurs in deutscher Kultur."
    },
    correctAnswer: 'b',
    explanation: "Der Text sagt: 'Tongchun sitzt jeden Sonntag auf dem Sofa' bei den Jakobsons, was zeigt, dass sie sich regelmäßig treffen.",
    teil: 2
  },
  {
    id: 9,
    text: "Viele Gaststudenten aus Offenburg …",
    options: { 
      a: "würden gern in Deutschland bleiben.",
      b: "feiern gern Partys in Berlin.",
      c: "haben schlechte Erfahrungen in Deutschland gemacht."
    },
    correctAnswer: 'a',
    explanation: "Der Text sagt: 'Am Anfang ihres Aufenthalts wollen nur etwa 20% der Gaststudenten nach dem Studium in Deutschland bleiben – am Ende sind es rund 80%.'",
    teil: 2
  },
  
  // Teil 3 - "WebStamp" (3 questions)
  {
    id: 10,
    text: "In diesem Text geht es darum, …",
    options: { 
      a: "wie die Schweizerische Post funktioniert.",
      b: "dass die Schweizerische Post eine interessante Webseite hat.",
      c: "dass man eine Briefmarke selbst gestalten kann."
    },
    correctAnswer: 'c',
    explanation: "Der Text erklärt die WebStamp-Funktion, mit der man eigene Briefmarken am Computer gestalten und ausdrucken kann.",
    teil: 3
  },
  {
    id: 11,
    text: "Die WebStamp …",
    options: { 
      a: "hat denselben Preis wie eine normale Briefmarke.",
      b: "gilt nur in der Schweiz.",
      c: "wurde von einer Werbefirma erfunden."
    },
    correctAnswer: 'a',
    explanation: "Der Text sagt: 'Eine Briefmarke mit dem Wert von 1 Franken kostet also genau 1 Franken.'",
    teil: 3
  },
  {
    id: 12,
    text: "Die Adresse des Empfängers …",
    options: { 
      a: "muss auf der WebStamp stehen.",
      b: "kann man aus dem Excel-Programm übernehmen.",
      c: "wird mit einem extra Programm gedruckt."
    },
    correctAnswer: 'b',
    explanation: "Der Text sagt: 'Die Adressen lassen sich sogar direkt aus Excel-Dateien importieren.'",
    teil: 3
  },
  
  // Teil 4 - "Kettenmail" (3 questions)
  {
    id: 13,
    text: "Was ist eine Kettenmail?",
    options: { 
      a: "Eine E-Mail mit vielen Anhängen.",
      b: "Eine E-Mail, die an viele Personen weitergeleitet wird.",
      c: "Eine E-Mail mit wichtigen Informationen."
    },
    correctAnswer: 'b',
    explanation: "Eine Kettenmail ist eine E-Mail, die an viele Personen weitergeleitet wird, oft mit der Aufforderung, sie weiterzuleiten.",
    teil: 4
  },
  {
    id: 14,
    text: "Warum sind Kettenmails problematisch?",
    options: { 
      a: "Sie sind zu lang.",
      b: "Sie können Spam verursachen und persönliche Daten preisgeben.",
      c: "Sie sind schwer zu lesen."
    },
    correctAnswer: 'b',
    explanation: "Kettenmails können Spam verursachen und persönliche E-Mail-Adressen preisgeben, was ein Datenschutzproblem darstellt.",
    teil: 4
  },
  {
    id: 15,
    text: "Was sollte man mit Kettenmails tun?",
    options: { 
      a: "Sie sofort weiterleiten.",
      b: "Sie ignorieren und nicht weiterleiten.",
      c: "Sie in sozialen Medien teilen."
    },
    correctAnswer: 'b',
    explanation: "Kettenmails sollte man ignorieren und nicht weiterleiten, um Spam zu vermeiden und Datenschutz zu wahren.",
    teil: 4
  },
  
  // Teil 5 - "Deutsches Museum" (3 questions)
  {
    id: 16,
    text: "Führungen …",
    options: { 
      a: "sind für Schulklassen gratis.",
      b: "sollten vorher telefonisch gemeldet werden.",
      c: "finden nicht nur auf Deutsch statt."
    },
    correctAnswer: 'c',
    explanation: "Der Text sagt: 'Schulklassen-, Übersichts- und Fachführungen in Deutsch und Fremdsprachen' - also auch in anderen Sprachen.",
    teil: 5
  },
  {
    id: 17,
    text: "Wer Mitglied ist, …",
    options: { 
      a: "ist auf jeden Fall erwachsen.",
      b: "braucht keinen Eintritt zu bezahlen.",
      c: "darf nicht allein das Museum besuchen."
    },
    correctAnswer: 'b',
    explanation: "Der Text sagt: 'Kinder unter 6 Jahren & Mitglieder: frei' - Mitglieder haben freien Eintritt.",
    teil: 5
  },
  {
    id: 18,
    text: "Das Museum erreicht man …",
    options: { 
      a: "am besten mit dem Auto.",
      b: "mit dem Bus Linie 17.",
      c: "mit jeder S-Bahn."
    },
    correctAnswer: 'c',
    explanation: "Der Text sagt: 'S-Bahn: alle Linien bis Isartor' - also mit jeder S-Bahn-Linie.",
    teil: 5
  }
];

export default function LesenModelTest1Page() {
  const { user } = useAuth();
  const [hasSubscriptionAccess, setHasSubscriptionAccess] = useState<boolean | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  
  const [currentPhase, setCurrentPhase] = useState(TEST_PHASES.INSTRUCTIONS);
  const [currentTeil, setCurrentTeil] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(50 * 60); // 50 minutes total
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [results, setResults] = useState<TestResults | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Timer countdown
  useEffect(() => {
    if (!isTimerRunning || timeLeft <= 0) return;
    const interval = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // Auto-submit when timer ends
  useEffect(() => {
    if (timeLeft <= 0 && currentPhase === TEST_PHASES.TESTING) {
      void submitTest();
    }
  }, [timeLeft, currentPhase]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startTest = () => {
    setCurrentPhase(TEST_PHASES.TEXT_READING);
    setCurrentTeil(1);
    setTimeLeft(50 * 60);
    setIsTimerRunning(true);
    setCurrentQuestion(0);
    setAnswers({});
  };

  const handleAnswerSelect = (questionId: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const startTeilQuestions = () => {
    setCurrentPhase(TEST_PHASES.TESTING);
    setCurrentQuestion(0);
  };

  const nextTeil = () => {
    if (currentTeil < 5) {
      setCurrentTeil(currentTeil + 1);
      setCurrentPhase(TEST_PHASES.TEXT_READING);
    } else {
      // All teils completed, submit test
      void submitTest();
    }
  };

  const getCurrentTeilQuestions = () => {
    return QUESTIONS.filter(q => q.teil === currentTeil);
  };

  const nextQuestion = () => {
    const currentTeilQuestions = getCurrentTeilQuestions();
    if (currentQuestion < currentTeilQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // All questions in current teil completed, go to next teil
      nextTeil();
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const submitTest = async () => {
    setIsProcessing(true);
    setCurrentPhase(TEST_PHASES.PROCESSING);

    try {
      // Calculate results
      const testResults: TestResults = {
        score: 0,
        totalQuestions: QUESTIONS.length,
        correctAnswers: 0,
        wrongAnswers: 0,
        answers: [],
        passed: false
      };

      QUESTIONS.forEach(question => {
        const userAnswer = answers[question.id] || '';
        const isCorrect = userAnswer === question.correctAnswer;
        
        testResults.answers.push({
          questionId: question.id,
          userAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          explanation: question.explanation
        });

        if (isCorrect) {
          testResults.correctAnswers++;
        } else {
          testResults.wrongAnswers++;
        }
      });

      testResults.score = Math.round((testResults.correctAnswers / testResults.totalQuestions) * 100);
      testResults.passed = testResults.score >= 60;

      setResults(testResults);
      setCurrentPhase(TEST_PHASES.RESULTS);
    } catch (error) {
      console.error('Error processing test:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetTest = () => {
    setCurrentPhase(TEST_PHASES.INSTRUCTIONS);
    setCurrentQuestion(0);
    setAnswers({});
    setTimeLeft(40 * 60);
    setIsTimerRunning(false);
    setResults(null);
  };

  const renderInstructions = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            <TranslatedText 
              translationKey="lesen.model_test_1_title" 
              fallback="Model Test 1"
            />
          </h1>
          <p className="text-lg text-gray-600">
            <TranslatedText 
              translationKey="lesen.model_test_1_subtitle" 
              fallback="Goethe B1 Lesen Prüfung (Übung)"
            />
          </p>
        </div>

        <div className="space-y-6 mb-8">
          <div className="bg-blue-50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              <TranslatedText 
                translationKey="lesen.instructions_title" 
                fallback="Instruksi Tes"
              />
            </h2>
            <ul className="space-y-3 text-blue-800">
              <li className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <TranslatedText 
                    translationKey="lesen.instruction_1" 
                    fallback="Total waktu: 50 menit (Teil 1: 10 menit, Teil 2: 10 menit, Teil 3: 10 menit, Teil 4: 10 menit, Teil 5: 10 menit)"
                  />
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Target className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <TranslatedText 
                    translationKey="lesen.instruction_2" 
                    fallback="Total 18 soal pilihan ganda"
                  />
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <TranslatedText 
                    translationKey="lesen.instruction_3" 
                    fallback="Baca teks dengan teliti dan pilih jawaban yang benar"
                  />
                </span>
              </li>
              <li className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <TranslatedText 
                    translationKey="lesen.instruction_4" 
                    fallback="Tes akan otomatis disubmit ketika waktu habis"
                  />
                </span>
              </li>
            </ul>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">
                <TranslatedText 
                  translationKey="lesen.teil_1_title" 
                  fallback="Teil 1 - So lebe ich"
                />
              </h3>
              <p className="text-sm text-green-700">
                <TranslatedText 
                  translationKey="lesen.teil_1_description" 
                  fallback="6 soal benar/salah (10 menit)"
                />
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <h3 className="font-semibold text-orange-900 mb-2">
                <TranslatedText 
                  translationKey="lesen.teil_2_title" 
                  fallback="Teil 2 - Ni Hao, Mama!"
                />
              </h3>
              <p className="text-sm text-orange-700">
                <TranslatedText 
                  translationKey="lesen.teil_2_description" 
                  fallback="3 soal pilihan ganda (10 menit)"
                />
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2">
                <TranslatedText 
                  translationKey="lesen.teil_3_title" 
                  fallback="Teil 3 - WebStamp"
                />
              </h3>
              <p className="text-sm text-purple-700">
                <TranslatedText 
                  translationKey="lesen.teil_3_description" 
                  fallback="3 soal pilihan ganda (10 menit)"
                />
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                <TranslatedText 
                  translationKey="lesen.teil_4_title" 
                  fallback="Teil 4 - Kettenmail"
                />
              </h3>
              <p className="text-sm text-blue-700">
                <TranslatedText 
                  translationKey="lesen.teil_4_description" 
                  fallback="3 soal pilihan ganda (10 menit)"
                />
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-2">
                <TranslatedText 
                  translationKey="lesen.teil_5_title" 
                  fallback="Teil 5 - Deutsches Museum"
                />
              </h3>
              <p className="text-sm text-red-700">
                <TranslatedText 
                  translationKey="lesen.teil_5_description" 
                  fallback="3 soal pilihan ganda (10 menit)"
                />
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={startTest}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors"
          >
            <TranslatedText 
              translationKey="lesen.start_test" 
              fallback="Mulai Tes"
            />
          </button>
        </div>
      </div>
    </div>
  );

  const renderTextReading = () => {
    const text = TEXTS[currentTeil as keyof typeof TEXTS];
    const currentTeilQuestions = getCurrentTeilQuestions();

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Timer */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-full font-mono text-lg font-bold">
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Teil Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              <TranslatedText 
                translationKey="lesen.teil" 
                fallback="Teil"
              /> {currentTeil} – {text.title}
            </h1>
            <p className="text-lg text-gray-600">
              <TranslatedText 
                translationKey="lesen.read_text_instruction" 
                fallback="Lesen Sie den Text und entscheiden Sie bei den Aussagen, ob sie richtig oder falsch sind."
              />
            </p>
          </div>

          {/* Text Content */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              <TranslatedText 
                translationKey="lesen.text" 
                fallback="Text"
              />: {text.title}
            </h2>
            <div className="prose prose-gray max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                {text.content}
              </pre>
            </div>
          </div>

          {/* Questions Section */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              <TranslatedText 
                translationKey="lesen.aufgaben" 
                fallback="Aufgaben"
              />: {currentTeil === 1 ? (
                <TranslatedText 
                  translationKey="lesen.decide_richtig_falsch" 
                  fallback="Entscheiden Sie: Richtig oder Falsch?"
                />
              ) : (
                <TranslatedText 
                  translationKey="lesen.choose_abc" 
                  fallback="Wählen Sie bei jeder Aufgabe a, b oder c:"
                />
              )}
            </h3>
            
            <div className="space-y-4">
              {currentTeilQuestions.map((question, index) => {
                const userAnswer = answers[question.id] || '';
                const questionNumber = currentTeil === 1 ? index + 1 : index + 7; // Teil 2 starts from 7
                
                return (
                  <div key={question.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                      {questionNumber}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium mb-3">{question.text}</p>
                      
                      {currentTeil === 1 ? (
                        // Teil 1: Richtig/Falsch buttons
                        <div className="flex gap-4">
                          <button
                            onClick={() => handleAnswerSelect(question.id, 'a')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              userAnswer === 'a'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            <TranslatedText 
                              translationKey="lesen.richtig" 
                              fallback="Richtig"
                            />
                          </button>
                          <button
                            onClick={() => handleAnswerSelect(question.id, 'b')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              userAnswer === 'b'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            <TranslatedText 
                              translationKey="lesen.falsch" 
                              fallback="Falsch"
                            />
                          </button>
                        </div>
                      ) : (
                        // Teil 2-5: Multiple choice (a, b, c)
                        <div className="space-y-2">
                          {Object.entries(question.options).map(([key, option]) => (
                            <button
                              key={key}
                              onClick={() => handleAnswerSelect(question.id, key)}
                              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                userAnswer === key
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                              }`}
                            >
                              <span className="font-semibold">{key.toUpperCase()})</span> {option}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            <div className="text-sm text-gray-500">
              <TranslatedText 
                translationKey="lesen.answered" 
                fallback="Beantwortet"
              />: {Object.keys(answers).filter(key => answers[parseInt(key)]).length} / {currentTeilQuestions.length}
            </div>
            
            <div className="flex gap-4">
              {currentTeil < 5 ? (
                <button
                  onClick={nextTeil}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <TranslatedText 
                    translationKey="lesen.next_page" 
                    fallback="Nächste Seite"
                  />
                </button>
              ) : (
                <button
                  onClick={submitTest}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  <TranslatedText 
                    translationKey="lesen.submit" 
                    fallback="Submit Tes"
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTesting = () => {
    const currentTeilQuestions = getCurrentTeilQuestions();
    const question = currentTeilQuestions[currentQuestion];
    const userAnswer = answers[question.id] || '';

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Timer */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-full font-mono text-lg font-bold">
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>
                <TranslatedText 
                  translationKey="lesen.question" 
                  fallback="Soal"
                /> {currentQuestion + 1} / {currentTeilQuestions.length}
              </span>
              <span>
                <TranslatedText 
                  translationKey="lesen.teil" 
                  fallback="Teil"
                /> {currentTeil}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / currentTeilQuestions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {question.text}
            </h2>
            
            <div className="space-y-4">
              {Object.entries(question.options).map(([key, value]) => (
                <label
                  key={key}
                  className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    userAnswer === key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={key}
                    checked={userAnswer === key}
                    onChange={() => handleAnswerSelect(question.id, key)}
                    className="sr-only"
                  />
                  <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                    userAnswer === key
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {userAnswer === key && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <span className="font-medium text-gray-900">
                    {key.toUpperCase()}) {value}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
            >
              <TranslatedText 
                translationKey="lesen.previous" 
                fallback="Sebelumnya"
              />
            </button>
            
            <div className="flex gap-4">
              {currentQuestion < currentTeilQuestions.length - 1 ? (
                <button
                  onClick={nextQuestion}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <TranslatedText 
                    translationKey="lesen.next" 
                    fallback="Selanjutnya"
                  />
                </button>
              ) : currentTeil < 5 ? (
                <button
                  onClick={nextTeil}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  <TranslatedText 
                    translationKey="lesen.next_teil" 
                    fallback="Nächster Teil"
                  />
                </button>
              ) : (
                <button
                  onClick={submitTest}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  <TranslatedText 
                    translationKey="lesen.submit" 
                    fallback="Submit Tes"
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    if (!results) return null;

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Score Summary */}
          <div className="text-center mb-8">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
              results.passed ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <span className={`text-3xl font-bold ${
                results.passed ? 'text-green-600' : 'text-red-600'
              }`}>
                {results.score}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              <TranslatedText 
                translationKey="lesen.score" 
                fallback="Skor Anda"
              />: {results.score}%
            </h1>
            <p className={`text-lg font-semibold ${
              results.passed ? 'text-green-600' : 'text-red-600'
            }`}>
              {results.passed ? (
                <TranslatedText 
                  translationKey="lesen.passed" 
                  fallback="Lulus!"
                />
              ) : (
                <TranslatedText 
                  translationKey="lesen.failed" 
                  fallback="Tidak Lulus"
                />
              )}
            </p>
            <p className="text-gray-600 mt-2">
              {results.correctAnswers} / {results.totalQuestions} <TranslatedText translationKey="lesen.correct" fallback="benar" />
            </p>
          </div>

          {/* Detailed Results */}
          <div className="space-y-6">
            {results.answers.map((answer, index) => {
              const question = QUESTIONS.find(q => q.id === answer.questionId);
              if (!question) return null;

              return (
                <div key={answer.questionId} className={`border-2 rounded-lg p-6 ${
                  answer.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      answer.isCorrect ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {answer.isCorrect ? '✓' : '✗'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        <TranslatedText 
                          translationKey="lesen.question" 
                          fallback="Soal"
                        /> {answer.questionId}: {question.text}
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            <TranslatedText 
                              translationKey="lesen.your_answer" 
                              fallback="Jawaban Anda"
                            />:
                          </p>
                          <p className={`font-medium ${
                            answer.isCorrect ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {answer.userAnswer.toUpperCase()}) {question.options[answer.userAnswer as keyof typeof question.options]}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            <TranslatedText 
                              translationKey="lesen.correct_answer" 
                              fallback="Jawaban Benar"
                            />:
                          </p>
                          <p className="font-medium text-green-700">
                            {answer.correctAnswer.toUpperCase()}) {question.options[answer.correctAnswer as keyof typeof question.options]}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">
                          <TranslatedText 
                            translationKey="lesen.explanation" 
                            fallback="Penjelasan"
                          />:
                        </p>
                        <p className="text-gray-800">{answer.explanation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={resetTest}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors"
            >
              <TranslatedText 
                translationKey="lesen.new_test" 
                fallback="Tes Baru"
              />
            </button>
          </div>
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
          {currentPhase === TEST_PHASES.INSTRUCTIONS && renderInstructions()}
          {currentPhase === TEST_PHASES.TEXT_READING && renderTextReading()}
          {currentPhase === TEST_PHASES.TESTING && renderTesting()}
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
