"use client";
import React, { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, Volume2, Play, Pause, Square, Copy, Check, Download } from "lucide-react";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import AudioRecorder from "@/components/audio-recorder";
import { useTranslation } from "react-i18next";
import TranslatedText from "@/components/TranslatedText";
import LoadingCard from "@/components/shared/LoadingCard";
import { useAuth } from "@/contexts/AuthContext";
// import { useApi } from "@/hooks/useApi";
import TopicSelection from "@/components/shared/TopicSelection";
import { usePagination } from "@/hooks/usePagination";
import { copyToClipboard } from "@/lib/sharedUtils";

interface Topic {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  Vorteile: string[];
  Nachteile: string[];
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
  INSTRUCTIONS: 'instructions',
  TOPIC_SELECTION: 'topic_selection',
  RECORDING: 'recording',
  PROCESSING: 'processing',
  RESULTS: 'results'
};

const SAMPLE_TOPICS = [{
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
  Nachteile: ['FE ist ungesund und verursacht viele Krankheiten wie: Krebs und Diabetes', 'FE macht dick und faul Man weiß nicht, woraus das besteht.'],
},

{
  id: 'soziale_netzwerke/facebook',
  title: 'Soziale Netzwerke/Facebook',
  description: 'Ein Thema über die Rolle sozialer Netzwerke im modernen Alltag.',
  keywords: ['Soziale Netzwerke', 'Facebook', 'Kommunikation', 'Freunde', 'Information'],
  Vorteile: ['SN verbinden Menschen aus der ganzen Welt',
    'SN sind ein gutes Mittel, damit man Kontakt mit der Familie und den Freunden pflegt',
    'Man kann andere Kulturen und Sprachen entdecken',
    'Man ist immer informiert',
    'Man kann SN für Werbung nutzen',
  ],

  Nachteile: ['SN machen einsam und faul, was schlimme Folgen haben kann wie Depressionen und Übergewicht',
    'In SN sind die persönlichen Daten nicht geschützt und das kann gefährlich sein.',
    'Man wird von SN abhängig/ süchtig und verschwendetviel Zeit.',
  ],
},

{
  id: 'kann_man_informationen_im_internet_glauben',
  title: 'Kann man Informationen im Internet glauben?',
  description: 'Diskutieren Sie, ob Informationen aus dem Internet immer vertrauenswürdig sind.',
  keywords: ['Internet', 'Information', 'Wahrheit', 'Medien'],
  Vorteile: ['Im Internet kann man leicht und einfach Informationen bekommen',
    'Il sind kostenlos',
    'Man kann Informationen aus dem Ausland lesen',
    'Es ist praktisch, II zu lesen, weil man keine Zeitungen oder Zeitschriften kaufen muss',
    'Man kann irgendwann und irgendwo Informationen bekommen'],

  Nachteile: ['Il sind nicht immer wahr.',
    'Man viel suchen, um echt Informationen zu haben']
},

{
  id: 'kann_man_die_grosse_liebe_im_internet_finden',
  title: 'Kann man die große Liebe im Internet finden?',
  description: 'Diskutieren Sie, ob man die große Liebe im Internet finden kann.',
  keywords: ['Liebe', 'Internet', 'Partnerschaft', 'Gefahr'],
  Vorteile: ['das Internet bietet die Möglichkeit, viele Leute kennenzulernen',

    'Es ist bequem und einfach',
    'Es gibt viele Partnervermittlungsseiten',
    'Man kann schon vorher Fotos sehen und eine Idee von der anderen Person haben',
  ],
  Nachteile: ['Il sind nicht immer wahr.',
    'Man viel suchen, um echt Informationen zu haben'
  ],
},

{
  id: 'gedrucktes_buch',
  title: 'Gedrucktes Buch',
  description: 'Diskutieren Sie die Vor- und Nachteile gedruckter Bücher.',
  keywords: ['Buch', 'Lesen', 'Papier', 'Augen'],
  Vorteile: ['GB ist gut für die Augen und macht nicht müde', 'Man braucht keinen Strom', 'Es ist ein gutes Gefühl, gedruckte Bücher zu lesen'
  ],
  Nachteile: ['GB sind schwer und kosten Geld',
    'GB sind umweltfeindlich, denn Papier kommt aus Bäumen.',
    'Man muss viel suchen, um ein bestimmtes Buch zu finden. Manchmal ist es ausverkauft.',
  ],

},

{
  id: 'ebook',
  title: 'E-Book',
  description: 'Diskutieren Sie die Vor- und Nachteile von E-Books.',
  keywords: ['E-Book', 'Digital', 'Lesen', 'Technologie'],
  Vorteile: ['E-Book: Preiswert',
    'sehr praktisch und man kann auf viele Bücher zugreifen',
    'Man kann neue Bücher schnell bekommen und auch aus dem Ausland kaufen',],
  Nachteile: ['Man braucht Strom', 'Alte Bücher findet man nicht digital',
    'E-Book kann kaputt gehen',
  ]
},

{
  id: 'einkaufen_im_internet',
  title: 'Einkaufen im Internet',
  description: 'Diskutieren Sie die Vor- und Nachteile des Einkaufens im Internet.',
  keywords: ['Online Shopping', 'Internet', 'Kaufen', 'Daten'],
  Vorteile: ['El ist schnell, bequem, einfach, billig',
    'Das Angebot im Internet ist groß und vielfältig',
    'Im Internet gibt es viele Sonderangebote',
    'Man spart Zeit und Energie',
    'Man braucht nicht, in die Geschäfte zu gehen',
    'Man kann Waren aus dem Ausland bestellen',
  ],
  Nachteile: ['El kann gefährlich sein. Die persönlichen Daten sind nicht immer gut geschützt.',
    'Manchmal können die Produkte kaputt sein oder nicht so gut wie die Fotos im Internet.',
    'Man die Produckte nicht ausprobieren oder testen. Die Lieferung kann manchmal Verspätung haben oder nicht ankommen',
    'Die Reklamation ist nicht einfach und man hat keinen Ansprechpartner']

},

{
  id: 'brauchen_wir_markenkleidung',
  title: 'Brauchen wir Markenkleidung?',
  description: 'Diskutieren Sie, ob Markenkleidung wichtig ist.',
  keywords: ['Markenkleidung', 'Mode', 'Qualität', 'Ego'],
  Vorteile: ['MK hat gute Qualität und sieht sehr gut', 'MK hält sehr lang und sind bequem und zuverlässig', 'MK putscht das Ego',
    'Wenn man MK trägt, fühlt man sich selbstbewusster', 'MK ist immer modern und gestylt.'],
  Nachteile: ['No-Name-Kleidung hat keine gute Qualität und kann Hautkrankheiten verursachen',
    'MK ist sehr teuer',
    'MK ist nur eine Lüge von großen Firmen, damit sie mehr Geld verdienen',
    'MK kann süchtig machen']
},

{
  id: 'braucht_man_second_hand_kleidung',
  title: 'Braucht man Second-Hand-Kleidung?',
  description: 'Diskutieren Sie die Vor- und Nachteile von Second-Hand-Kleidung.',
  keywords: ['Second Hand', 'Kleidung', 'Umwelt', 'Gesundheit'],
  Vorteile: ['SHK ist billig',
    'Man kann SH-Markenkleidung kaufen',
    'SHK ist gute Lösung für arme Menschen',
    'SHK ist umweltfreundlich.'],
  Nachteile: ['SHK können Krankheiten und Allergien übertragen',
    'SHK sehen nicht gut und man kann nicht alle Größen und Farben finden',
    'SHK ist nicht immer vorrätig'],
},

{
  "id": "sollen_die_eltern_bestimmen_was_die_kinder_anziehen",
  "title": "Sollen die Eltern bestimmen, was die Kinder anziehen?",
  "description": "Diskutieren Sie, ob Eltern ihren Kindern vorschreiben sollen, was sie tragen.",
  "keywords": ["Eltern", "Kinder", "Mode", "Freiheit"],
  "Vorteile": [
    "Die Eltern wissen besser, was für ihre Kinder geeignet ist.",
    "Die Eltern achten besser auf den Preis und die Qualität."
  ],
  "Nachteile": [
    "Wenn Kinder ihre Kleidung selbst wählen, entwickelt sich besser ihre Persönlichkeit.",
    "Sie werden selbstbewusster und selbstständiger.",
    "Die Kinder haben mehr Kontakt zu Gleichaltrigen und wissen, was in Mode ist.",
    "Eltern sollten ab und zu ihre Kinder verwöhnen, um sie zu fördern."
  ]
},
{
  "id": "brauchen_wir_schuluniform",
  "title": "Brauchen wir Schuluniform?",
  "description": "Diskutieren Sie die Vor- und Nachteile von Schuluniformen.",
  "keywords": ["Schuluniform", "Schule", "Ordnung", "Freiheit"],
  "Vorteile": [
    "SU schafft eine gute Atmosphäre in der Schule. Indem es keine Unterschiede zwischen arme und reiche Schüler gibt.",
    "Wenn man eine SU trägt, bleiben eigene Klamotten sauber und im guten Zustand.",
    "SU sorgt für mehr Ordnung in der Schule.",
    "Man braucht nicht immer neuen Sachen."
  ],
  "Nachteile": [
    "Die Schüler sind dagegen und meinen, dass sie keine Soldaten sind.",
    "Die Schüler brauchen ihre Freiheit.",
    "In einer Demokratie darf man keine SU aufzwingen.",
    "Es hat keinen Sinn, Kleidung nur für die Schule zu kaufen. Sie sind sowieso sehr teuer."
  ]
},
{
  "id": "brauchen_wir_einen_computer_in_jedem_kursraum",
  "title": "Brauchen wir einen Computer in der jedem Kursraum?",
  "description": "Diskutieren Sie die Vor- und Nachteile von Computern in jedem Kursraum.",
  "keywords": ["Computer", "Kursraum", "Lernen", "Technik"],
  "Vorteile": [
    "CK erleichtert den Kurs und macht ihn interessanter.",
    "Mit dem Computer kann man viele neue Sachen lernen, präsentieren und im Internet surfen.",
    "Mit dem Computer kann der Kurs besser gestaltet werden.",
    "Die Schüler lernen den Umgang mit dem Computer und das hilft ihnen bei ihrem Berufsleben."
  ],
  "Nachteile": [
    "Ein Computer in jedem Kursraum kostet viel Geld. Man sollte das Geld lieber für neue Schulen und neue Schulbücher ausgeben.",
    "Man hat schon immer ohne Computer gelernt und das brauchen wir heute auch nicht.",
    "CK macht faul und passiv.",
    "Man kann sich nicht immer auf die Technik verlassen."
  ]
},
{
  "id": "fremdsprachen_im_kindergarten",
  "title": "Fremdsprachen im Kindergarten?",
  "description": "Diskutieren Sie, ob Kinder Fremdsprachen im Kindergarten lernen sollten.",
  "keywords": ["Fremdsprachen", "Kindergarten", "Lernen", "Intelligenz"],
  "Vorteile": [
    "Kinder lernen Fremdsprachen schneller und besser als Erwachsene.",
    "Fremdsprachen sind wichtig im Berufsleben.",
    "Fremdsprachen sind nicht nur in der Schule wichtig, sondern auch im Leben.",
    "Wenn man eine neue Sprache lernt, entdeckt man eine neue Kultur und neue Menschen.",
    "Studien haben gezeigt, dass Fremdsprachenlernen die Intelligenz des Kindes erhöht.",
    "Fremdsprachen sind wichtig für die Entwicklung des Kindes."
  ],
  "Nachteile": [
    "Kinder sollten ihre Kindheit leben und nicht nur lernen.",
    "Kinder brauchen Zeit zum Spielen und Spaß haben.",
    "Kinder sollten zuerst ihre Muttersprache beherrschen."
  ]
},

{
  "id": "sollen_alle_englisch_lernen",
  "title": "Sollen alle Englisch lernen?",
  "description": "Diskutieren Sie die Vor- und Nachteile des Englischlernens.",
  "keywords": ["Englisch", "Fremdsprache", "Berufsleben", "Technik"],
  "Vorteile": [
    "Englisch ist eine weltweite Sprache.",
    "Englisch ist die Sprache des Wissens und der Technik.",
    "Die meisten Fachbücher und Fachzeitschriften werden auf Englisch veröffentlicht.",
    "Englisch ist eine Brücke zwischen den Menschen und Kulturen.",
    "Wenn man Englisch kann, hat man bessere Chancen im Berufsleben."
  ],
  "Nachteile": [
    "Eine neue Fremdsprache zu lernen, ist nicht immer einfach, besonders wenn man alt und keine Zeit hat.",
    "Viele Forscher meinen, dass Chinesisch die Sprache der Zukunft ist."
  ]
},
{
  "id": "haustiere",
  "title": "Haustiere",
  "description": "Diskutieren Sie die Vor- und Nachteile von Haustieren.",
  "keywords": ["Haustiere", "Tiere", "Verantwortung", "Pflege"],
  "Vorteile": [
    "Haustiere sind treu und unterhaltsam.",
    "HT helfen behinderte und blinde Menschen.",
    "HT ist eine gute Lösung für alleinerziehende Menschen. Sie begleiten sie überall und geben ihnen das Gefühl, dass sie gebraucht sind.",
    "HT sind gut für Kinder. Wenn ein Kind ein HT hat, lernt es mehr Verantwortung. Es muss sich nämlich um das Haustier kümmern."
  ],
  "Nachteile": [
    "HT haben viele Bedürfnisse. Man muss sie füttern, für sie sauber machen und mit ihnen Gassi gehen.",
    "HT kosten Geld.",
    "Wenn man ein HT hat, kann man nicht so einfach Urlaub machen."
  ]
},
{
  "id": "wie_viel_sport_ist_gesund",
  "title": "Wie viel Sport ist gesund?",
  "description": "Diskutieren Sie die Vor- und Nachteile von Sport.",
  "keywords": ["Sport", "Gesundheit", "Kondition", "Übergewicht"],
  "Vorteile": [
    "Jeder weiß, dass Sport gesund und notwendig ist. Alle Ärzte raten dazu. Viel Sport ist einerseits anstrengend und der Gesundheit schadet, denn der Körper braucht Erholung.",
    "Andererseits wenig Sport oder kein Sport führt zum Übergewicht und Faulheit. Deshalb bin ich der Meinung, dass man weder viel noch wenig Sport treiben sollte. Das Beste ist regelmäßiger Sport. Zum Beispiel: 3 oder 4 Mal pro Woche. 1 bis 2 Stunden. Auf keinen Fall darf man seinen Körper überfordern."
  ],
  "Nachteile": []
},
{
  "id": "hotel_mama",
  "title": "Hotel Mama?",
  "description": "Diskutieren Sie, ob Kinder im Haushalt helfen sollten.",
  "keywords": ["Hotel Mama", "Haushalt", "Freiheit", "Selbstständigkeit"],
  "Vorteile": ['Wenn man bei seinen Eltern wohnt, spart man Geld und braucht nicht, im Haushalt zu helfen.',
    'Bei Mama gibt es jeden Tag gesundes und leckeres Essen und die Kleidung ist immer sauber.',
    'Man kann sich besser auf sein Studium konzentrieren.',
    'Man genießt das Leben in der Familie.',
  ], "Nachteile": [
    "Man hat wenig Freiheit und kaum Privatsphäre.",
    "Man wird faul und passiv.",
    "Man kann keine Freunde empfangen.",
    "Viele denken, dass man im Hotel Mama verwöhnt ist. Aber das stimmt nicht. Man muss im Haushalt helfen und auf die Geschwister aufpassen.",
    "Wenn man alleine wohnt, lernt man mehr Selbstständigkeit und Verantwortung."
  ]

},
{
  "id": "berufstaetige_eltern_und_grosseltern_die_loesung",
  "title": "Berufstätige Eltern: sind Großeltern die Lösung?",
  "description": "Diskutieren Sie die Vorteile und Nachteile von Großeltern als Lösung für berufstätige Eltern.",
  "keywords": ["Berufstätigkeit", "Großeltern", "Erziehung", "Kinderbetreuung"],
  "Vorteile": [
    "Großeltern haben große Erfahrung in der Erziehung und sind sehr geduldig.",
    "Großeltern freuen sich immer, Zeit mit ihren Enkelkindern zu verbringen.",
    "Großeltern haben meistens Zeit und sind kostenlos.",
    "Wenn die Kinder bei den Großeltern sind, sind die Eltern beruhigt und machen sich keine Sorgen.",
    "Die Kinder können viel von Großeltern lernen, z.B. aus ihren Geschichten, Erfahrungen und Verhalten."
  ],
  "Nachteile": [
    "Großeltern können das Elterngefühl nicht ersetzen.",
    "Großeltern verwöhnen die Kinder und halten sich nicht an Regeln.",
    "Großeltern brauchen Zeit für sich und haben keine Kraft, noch die Enkelkinder zu erziehen."
  ]
},
{
  "id": "brauchen_wir_mittagsschlaf_in_firmen",
  "title": "Brauchen wir Mittagsschlaf in Firmen?",
  "description": "Diskutieren Sie die Vor- und Nachteile von Mittagsschlaf am Arbeitsplatz.",
  "keywords": ["Mittagsschlaf", "Arbeit", "Leistung", "Arbeitspause"],
  "Vorteile": [
    "Mitarbeiter fühlen sich nach dem Mittagsschlaf besser und können mehr Leistung bringen.",
    "Viele Studien haben bestätigt, dass der Mittagsschlaf in Firmen macht den Mitarbeitern kreativer und fleißiger.",
    "In den Firmen, wo die Mitarbeiter mittags schlafen, ist die Arbeitsatmosphäre viel entspannter und angenehmer."
  ],
  "Nachteile": [
    "Mittagsschlaf kostet Zeit und Geld für die Firma.",
    "Mittagsschlaf kann faul und passiv machen.",
    "Es ist schwierig, nach einem Mittagsschlaf konzentriert zu arbeiten."
  ]
},
{
  "id": "sollen_kinder_ihre_freizeit_planen",
  "title": "Sollten Kinder ihre Freizeit planen?",
  "description": "Diskutieren Sie, ob Kinder ihre Freizeit selbstständig planen sollten.",
  "keywords": ["Freizeit", "Kinder", "Selbstständigkeit", "Verantwortung"],
  "Vorteile": [
    "Um gute Leistungen zu bringen, wenn die Kinder ihre Freizeit planen, lernen sie Selbstständigkeit und Verantwortung.",
    "Freizeitplanen macht Spaß.",
    "Wenn sie ihre Freizeit planen, werden sie ordentlicher, pünktlicher und verschwenden nicht viel Zeit."
  ],
  "Nachteile": [
    "Sie werden unsicher und verzweifelt.",
    "Wenn die Kinder ihre Freizeit nicht planen, verbringen die ihre Freizeit nur in einer Aktivität, wie Videospiele.",
    "Und das macht dumm und faul.",
    "Kinder sind doch keine Roboter."
  ]
},


{
  "id": "haben_kinder_zu_viel_freiheit",
  "title": "Haben Kinder zu viel Freiheit?",
  "description": "Diskutieren Sie, ob Kinder zu viel Freiheit haben.",
  "keywords": ["Kinder", "Freiheit", "Verantwortung", "Spontanität"],
  "Vorteile": [
    "Kinder brauchen Freiheit zum Spielen und basteln.",
    "Kinder brauchen mehr Bewegung, Freiheit und Kontakt mit anderen Kindern."
  ],
  "Nachteile": [
    "Wenn sie ihre Freizeit planen, werden sie ordentlicher, pünktlicher und verschwenden nicht viel Zeit.",
    "Kinder sind doch keine Roboter. Sie brauchen keine Planung, sondern Spontanität."
  ]
},
{
  "id": "auswanderung",
  "title": "Auswanderung?",
  "description": "Diskutieren Sie, ob Auswanderung eine gute Entscheidung ist.",
  "keywords": ["Auswanderung", "Kultur", "Sprache", "Freunde"],
  "Vorteile": [
    "Man fühlt sich fremd und einsam.",
    "Es ist nicht einfach, sich an der neuen Sprache und Kultur zu gewöhnen.",
    "Auswandern kostet viel Zeit und Kraft.",
    "Man hat Heimweh und keine Freunde."
  ],
  "Nachteile": [
    "Neue Leute, Kulturen und Bräuche kennenlernen.",
    "Man wandert aus, um bessere Lebensverhältnisse zu haben. Man kann einen Job bekommen, studieren und mehr Geld verdienen.",
    "Man kann ein besseres Leben führen sowohl für sich als auch für seine Familie. Z.B. die Kinder bekommen eine bessere Bildung und Gesundheitsversorgung."
  ]
},
{
  "id": "sehen_kinder_zu_viel_fernsehen",
  "title": "Sehen Kinder zu viel Fernsehen?",
  "description": "Diskutieren Sie, ob Kinder zu viel Fernsehen schauen.",
  "keywords": ["Fernsehen", "Kinder", "Gesundheit", "Aktivitäten"],
  "Vorteile": [
    "Im Fernsehen kann man viele nützliche Sendungen, wie Reportagen und Lernsendungen sehen.",
    "Zeichentrickfilme können die Kinder positiv beeinflussen, indem sie ihre Phantasie und Persönlichkeit entwickeln.",
    "Das Fernsehen ist ein Fenster auf die Welt. Kinder können dadurch viele neue Sachen lernen und ihr Sprachentalent entwickeln."
  ],
  "Nachteile": [
    "Zu viel Fernsehen kann negative Wirkung haben. Die Kinder können faul und gewalttig werden.",
    "Es gibt andere Aktivitäten außer Fernsehen. Sie können Sport treiben und andere Kinder treffen."
  ]
},
{
  "id": "tattoos_und_piercing",
  "title": "Tattoos und Piercing?",
  "description": "Diskutieren Sie die Vor- und Nachteile von Tattoos und Piercings.",
  "keywords": ["Tattoos", "Piercing", "Gesundheit", "Symbol"],
  "Vorteile": [
    "T und P sehen cool aus und sind in Mode.",
    "T und P können an bestimmte Personen und Ereignisse erinnern.",
    "T und P sind Symbol der Freiheit und Veränderung."
  ],
  "Nachteile": [
    "T und P können die Gesundheit schaden und schlimme Folgen haben, wie Hautkrebs.",
    "T und P machen viel Schmerzen.",
    "Man kann T nicht entfernen.",
    "Tattoos sehen mit dem Alter nicht mehr so schön aus.",
    "T erinnern an Personen und Ereignisse. Aber manchmal will man sie vergessen und das geht dann nicht."
  ]
},
{
  "id": "make_up",
  "title": "Make-up?",
  "description": "Diskutieren Sie die Vor- und Nachteile von Make-up.",
  "keywords": ["Make-up", "Schönheit", "Haut", "Selbstbewusstsein"],
  "Vorteile": [
    "Make-up macht hübscher und attraktiver.",
    "Make-up gibt der Person eine Gefühl des Selbstbewusstseins.",
    "Make-up deckt Macken und man fühlt sich dadurch sicherer."
  ],
  "Nachteile": [
    "MU schadet der Haut.",
    "Es kostet viel Zeit und Geld.",
    "Viele Studien haben gezeigt, dass Make-up süchtig macht.",
    "Make-up deckt die Wahrheit."
  ]
},
{
  "id": "brauchen_wir_einkaufszentren",
  "title": "Brauchen wir Einkaufszentren?",
  "description": "Diskutieren Sie die Vor- und Nachteile von Einkaufszentren.",
  "keywords": ["Einkaufszentrum", "Shopping", "Arbeitsplätze", "Freizeit"],
  "Vorteile": [
    "Im Einkaufszentrum hat man viele Einkaufsmöglichkeiten.",
    "Man kann bei jedem Wetter einkaufen.",
    "Es gibt Freizeitmöglichkeiten, wie Restaurants, Kinos und Kinderspielplätze.",
    "EZ schafft viele Arbeitsplätze."
  ],
  "Nachteile": [
    "EZ liegen meistens am Stadtrand und man muss lange fahren.",
    "EZ sind immer voll, man muss lange an der Kasse stehen und findet nur schwer einen Parkplatz.",
    "EZ kosten viel Zeit und man gibt viel Geld aus."
  ]
},
{
  "id": "brauchen_wir_rauchverbot_im_restaurant",
  "title": "Brauchen wir Rauchverbot im Restaurant?",
  "description": "Diskutieren Sie, ob ein Rauchverbot in Restaurants sinnvoll ist.",
  "keywords": ["Rauchverbot", "Restaurant", "Gesundheit", "Atmosphäre"],
  "Vorteile": [
    "Raucher schaden nicht nur sich selbst, sondern auch anderen Gästen.",
    "Das verschmutzt die Luft im Restaurant und das Essen schmeckt nicht mehr.",
    "Restaurants sind öffentliche Plätze und es gibt dort viele Kinder, schwangere Frauen und ältere Menschen.",
    "Durch das Rauchen oder Passiv-Rauchen stinken die Kleidung und die Haare."
  ],
  "Nachteile": [
    "Man fühlt sich frei.",
    "Rauchen im Restaurant ein gutes Mittel für Erholung und Stressabbau.",
    "Wenn man das Rauchen im Restaurant verbietet, nimmt die Zahl der Kunden ab."
  ]
},


{
  "id": "stadtzentrum_ohne_autos",
  "title": "Stadtzentrum ohne Autos?",
  "description": "Diskutieren Sie, ob das Stadtzentrum ohne Autos besser wäre.",
  "keywords": ["Stadtzentrum", "Autos", "Verkehr", "Umwelt"],
  "Vorteile": [
    "Stadtzentrum ohne Autos ist ruhiger und sauberer.",
    "Es ist umweltfreundlicher.",
    "Kinder und Fußgänger haben mehr Bewegungsfreiheit und Sicherheit.",
    "Man kann mit dem Fahrrad oder zu Fuß in die Stadt fahren und es ist gesünder.",
    "Man spart Platz, da Autos im Stadtzentrum viele Parkplätze benötigen."
  ],
  "Nachteile": [
    "Wenn man ohne Auto ins Stadtzentrum fahren will, braucht man mehr Zeit.",
    "Man muss mit vielen Einkaufstüten und beim Regen lange laufen.",
    "Man kann Verspätung haben.",
    "Ältere Leute und Kinder müssen länger laufen und auf die öffentlichen Verkehrsmittel warten.",
    "Es ist nicht gut für die Geschäfte."
  ]
},
{
  "id": "leben_in_stadt_oder_land",
  "title": "Leben in der Stadt oder auf dem Land?",
  "description": "Vergleichen Sie die Vor- und Nachteile des Lebens in der Stadt und auf dem Land.",
  "keywords": ["Stadt", "Land", "Leben", "Wohnort"],
  "Vorteile": [
    "Stadt: Großes Jobangebot.",
    "Stadt: Viele Krankenhäuser, Schulen, Universitäten, Einkaufsmöglichkeiten, Freizeitangebote und Verkehrsmittel.",
    "Stadt: Viele Wohnformen, aktives und interessantes Leben.",
    "Land: Viel Natur und frische Luft.",
    "Land: Ruhig und entspannt.",
    "Land: Man kann frisches Essen genießen und es gibt viele Tiere.",
    "Land: Wenig Menschen, sympathische und gastfreundliche Leute.",
    "Land: Das Leben ist nicht sehr teuer."
  ],
  "Nachteile": [
    "Stadt: Viel Lärm und Verschmutzung.",
    "Stadt: Stress und Hektik.",
    "Stadt: Stau und teure Mieten.",
    "Stadt: Kriminalität.",
    "Stadt: Alles ist sehr teuer.",
    "Stadt: Unfreundliche Menschen.",
    "Land: Langweilig.",
    "Land: Keine Krankenhäuser, Schulen, Universitäten, Einkaufsmöglichkeiten, Freizeitangebote und Verkehrsmittel."
  ]
},
{
  "id": "urlaub_verreisen_oder_zu_hause",
  "title": "Im Urlaub verreisen oder zu Hause bleiben?",
  "description": "Diskutieren Sie die Vor- und Nachteile, im Urlaub zu verreisen oder zu Hause zu bleiben.",
  "keywords": ["Urlaub", "Reisen", "Freizeit", "Zuhause"],
  "Vorteile": [
    "Verreisen: Man kann neue Kulturen und Orte entdecken und neue Menschen kennenlernen.",
    "Verreisen: Hilft, den Stress des Alltags zu vergessen.",
    "Verreisen: Nach einer Reise hat man mehr Energie für die Arbeit.",
    "Zu Hause: Man kann das Geld für die Reise sparen und für andere Sachen ausgeben.",
    "Zu Hause: Zeit für andere Freizeitbeschäftigungen (kochen, malen, renovieren, Familie besuchen, Sprachkurs machen).",
    "Zu Hause: Man kann sich entspannen und faulenzen."
  ],
  "Nachteile": [
    "Verreisen kostet Geld und Kraft.",
    "Durch den Wetterwechsel kann man krank werden.",
    "Zu Hause: Es kann langweilig sein.",
    "Zu Hause: Man bleibt im Alltag stecken."
  ]
},
{
  "id": "brauchen_kinder_handy",
  "title": "Brauchen Kinder ein Handy?",
  "description": "Diskutieren Sie die Vor- und Nachteile, wenn Kinder ein Handy besitzen.",
  "keywords": ["Kinder", "Handy", "Technologie", "Kommunikation"],
  "Vorteile": [
    "Das Kind ist immer erreichbar, besonders in Notfällen.",
    "Mit dem Handy kann man telefonieren, im Internet surfen, lernen und Kontakte pflegen.",
    "Schüler bilden WhatsApp- oder Facebook-Gruppen und tauschen sich aus."
  ],
  "Nachteile": [
    "Handynutzung kostet viel Zeit und Geld.",
    "Man muss das Handy immer aufladen.",
    "Kann den Augen schaden und die Schulleistung verschlechtern.",
    "Beeinträchtigt die Konzentration.",
    "Kann abhängig machen.",
    "Handys können gefährlich sein, z. B. kinderfeindliche Internetseiten."
  ]
},
{
  "id": "gemischter_oder_getrennter_unterricht",
  "title": "Gemischter oder getrennter Unterricht?",
  "description": "Vergleichen Sie die Vor- und Nachteile von gemischtem und getrenntem Unterricht.",
  "keywords": ["Unterricht", "Schule", "Gemischt", "Getrennt"],
  "Vorteile": [
    "Gemischter Unterricht: Erhöht den Wettbewerb zwischen Mädchen und Jungen.",
    "Gemischter Unterricht: Bereitet auf das Leben vor, da im Leben alles gemischt ist.",
    "Gemischter Unterricht: Beide Geschlechter lernen, ohne Hemmungen zu sprechen und zu agieren.",
    "Getrennter Unterricht: Schafft eine angenehme Arbeitsatmosphäre.",
    "Getrennter Unterricht: Fördert schüchterne Jungen und Mädchen, dadurch bessere Leistungen.",
    "Getrennter Unterricht: Schüler sind konzentrierter."
  ],
  "Nachteile": [
    "Gemischter Unterricht: Mädchen schämen sich vor Jungen.",
    "Gemischter Unterricht: Jungen zeigen keine Gefühle, wenn Mädchen anwesend sind.",
    "Getrennter Unterricht: Kann in der Zukunft problematisch sein, besonders in Berufen mit Kontakt zum anderen Geschlecht."
  ]
},

{
  "id": "urlaub_am_strand",
  "title": "Urlaub: Am Strand liegen?",
  "description": "Diskutieren Sie die Vor- und Nachteile eines Strandurlaubs.",
  "keywords": ["Urlaub", "Strand", "Entspannung", "Reisen"],
  "Vorteile": [
    "Im Urlaub hat man die Gelegenheit, sich zu erholen und zu entspannen.",
    "Am Strand kann man den Stress des Alltags vergessen.",
    "Die Sonne und das blaue Wasser geben ein Gefühl von Freiheit und Ruhe.",
    "Man bekommt positive Energie und bessere Leistungen bei Arbeit oder Studium.",
    "Am Strand kann man nicht nur liegen, sondern auch Sport treiben: Beachvolleyball, Schwimmen, Surfen."
  ],
  "Nachteile": [
    "Urlaub am Strand macht passiv und faul.",
    "Man lernt nichts dabei.",
    "Urlaub in der Stadt oder in den Bergen ist anstrengender, aber oft lehrreicher."
  ]
},
{
  "id": "schoenheitsoperationen",
  "title": "Schönheitsoperationen",
  "description": "Diskutieren Sie die Vor- und Nachteile von Schönheitsoperationen.",
  "keywords": ["Schönheitsoperationen", "Aussehen", "Gesundheit", "Attraktivität"],
  "Vorteile": [
    "Mit Schönheitsoperationen sieht man gut aus.",
    "Man kann Makel abdecken.",
    "Man sieht jünger und attraktiver aus."
  ],
  "Nachteile": [
    "Schönheitsoperationen können schlimme Folgen haben.",
    "Mit dem Alter sehen Menschen, die eine Operation hatten, oft unnatürlich aus.",
    "Ärzte können Fehler machen und die Folgen sind nicht rückgängig zu machen.",
    "Operationen sind teuer.",
    "Es gibt Alternativen wie Naturmittel, Sport und gesunde Ernährung."
  ]
},
{
  "id": "extremsport",
  "title": "Extremsport: Bergklettern – Fallschirmspringen – MMA – Parcours – Mountainbike",
  "description": "Diskutieren Sie die Vor- und Nachteile von Extremsportarten.",
  "keywords": ["Extremsport", "Risiko", "Adrenalin", "Sport"],
  "Vorteile": [
    "Extremsport baut Stress ab und ist ein Adrenalinschub.",
    "Wenn man Extremsport treibt, fühlt man sich frei.",
    "Menschen mögen es, an ihre Grenzen zu gehen.",
    "Hilft Sportlern, ihre Ängste zu überwinden."
  ],
  "Nachteile": [
    "Extremsport ist gefährlich.",
    "Gefährdet den Körper und manchmal das Leben.",
    "Sehr teuer wegen spezieller Ausrüstung.",
    "Kann langfristig schlimme Folgen für die Gesundheit haben."
  ]
},
{
  "id": "muessen_kinder_instrument_lernen",
  "title": "Müssen Kinder ein Musikinstrument lernen?",
  "description": "Diskutieren Sie die Vor- und Nachteile des Erlernens eines Musikinstruments für Kinder.",
  "keywords": ["Kinder", "Musik", "Instrument", "Freizeit"],
  "Vorteile": [
    "Musik ist die Sprache des Geistes und die ganze Welt versteht sie.",
    "Kinder können dadurch ihre Freizeit sinnvoll nutzen.",
    "Musik macht Kinder ruhiger.",
    "Musikunterricht ist eine bessere Freizeitbeschäftigung als z. B. Videospiele."
  ],
  "Nachteile": [
    "Musikinstrumente können teuer sein.",
    "Das Lernen kostet viel Zeit und Mühe."
  ]
},

{
  "id": "duerfen_maenner_weinen",
  "title": "Dürfen Männer weinen?",
  "description": "Diskutieren Sie, ob Männer weinen dürfen und welche Folgen das hat.",
  "keywords": ["Männer", "Weinen", "Gefühle", "Gesellschaft"],
  "Vorteile": [
    "Männer sind auch Menschen, sie haben Gefühle und dürfen diese zeigen.",
    "Viele Studien zeigen, dass Weinen nützlich und gesund sein kann (z. B. Tränen erleichtern und schützen Augen und Nerven).",
    "Männer zeigen durch Weinen ihre Traurigkeit und Mitgefühl.",
    "Weinen ist ein Zeichen von Menschlichkeit, nicht unbedingt von Schwäche."
  ],
  "Nachteile": [
    "Viele Menschen sehen Weinen als Zeichen von Schwäche.",
    "Männern ist es oft peinlich zu weinen.",
    "Man sollte nicht wegen Kleinigkeiten weinen."
  ]
},
{
  "id": "sozialarbeit_ehrenamt",
  "title": "Sozialarbeit: Ehrenamtliche Arbeit",
  "description": "Diskutieren Sie die Vor- und Nachteile ehrenamtlicher Arbeit.",
  "keywords": ["Sozialarbeit", "Ehrenamt", "Freiwillige Arbeit", "Gesellschaft"],
  "Vorteile": [
    "Ehrenamtliche Arbeit ist interessant und wichtig.",
    "Man lernt neue Kulturen und Lebensstile kennen.",
    "Man kann Menschen aus aller Welt helfen oder die Natur schützen.",
    "Es gibt ein gutes Gefühl und stärkt die Gemeinschaft.",
    "Man entdeckt eigene Fähigkeiten und Grenzen."
  ],
  "Nachteile": [
    "Einige Menschen sehen es als Zeitverschwendung, da es unbezahlt ist.",
    "Man muss Zeit investieren, ohne finanziellen Nutzen."
  ]
},
{
  "id": "auto_kaufen",
  "title": "Auto kaufen",
  "description": "Beschreiben Sie die Vor- und Nachteile eines Autokaufs.",
  "keywords": ["Auto", "Kaufen", "Transport", "Mobilität"],
  "Vorteile": [
    "Man ist unabhängig und flexibel.",
    "Man kann jederzeit fahren, wann und wohin man möchte.",
    "Autos sind praktisch im Alltag, z. B. für Einkäufe oder Reisen.",
    "Ein eigenes Auto bedeutet Komfort und Zeitersparnis."
  ],
  "Nachteile": [
    "Hohe Kosten für Anschaffung, Versicherung, Steuern und Benzin.",
    "Wartung und Reparaturen sind teuer.",
    "Autos belasten die Umwelt (CO₂, Abgase, Verkehr).",
    "Staus und Parkplatzprobleme.",
    "Man wird vom Auto abhängig."
  ]
},
{
  "id": "dvd_oder_kino",
  "title": "DVD oder Kino?",
  "description": "Vergleichen Sie die Vor- und Nachteile, Filme im Kino oder auf DVD zu schauen.",
  "keywords": ["DVD", "Kino", "Filme", "Freizeit"],
  "Vorteile": [
    "DVD: Man kann Filme jederzeit zu Hause sehen.",
    "DVD: Bequemer und günstiger, keine Anfahrtskosten.",
    "Kino: Große Leinwand und bessere Bild- und Tonqualität.",
    "Kino: Gemeinschaftserlebnis mit Freunden oder Familie."
  ],
  "Nachteile": [
    "DVD: Bild- und Tonqualität ist oft schlechter als im Kino.",
    "DVD: Weniger Atmosphäre.",
    "Kino: Teure Tickets und Snacks.",
    "Kino: Man muss Zeit und Fahrt einplanen."
  ]
}
]

export default function SpeakingTestPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  // const { apiCall } = useApi();
  const [currentPhase, setCurrentPhase] = useState(TEST_PHASES.INSTRUCTIONS);
  const [hasSubscriptionAccess, setHasSubscriptionAccess] = useState<boolean | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [selectedTeil, setSelectedTeil] = useState<'teil1' | 'teil2' | 'teil3' | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [, setIsProcessing] = useState(false);
  // const [presentation, setPresentation] = useState<unknown[]>([]); // Add presentation state for Teil 3 dummy data
  const [testResults, setTestResults] = useState<TestResults | null>(null);

  // Dummy data for investigation - removed to fix unused variable warning

  // Function to load dummy data for investigation
  // const loadDummyData = () => {
  //   setTestResults(dummyTestResults);
  //   setCurrentPhase(TEST_PHASES.RESULTS);
  // };

  const [isMicSupported, setIsMicSupported] = useState(true);
  const [isCheckingMic, setIsCheckingMic] = useState(true);
  // Use pagination hook
  const pagination = usePagination({
    itemsPerPage: 3,
    totalItems: SAMPLE_TOPICS.length,
    initialPage: 1
  });
  const [copiedCorrected, setCopiedCorrected] = useState(false);
  const [copiedModel, setCopiedModel] = useState(false);
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [, setCorrectedAudioBlob] = useState<Blob | null>(null);
  const [, setModelAnswerAudioBlob] = useState<Blob | null>(null);
  const [correctedAudioElement, setCorrectedAudioElement] = useState<HTMLAudioElement | null>(null);
  const [modelAnswerAudioElement, setModelAnswerAudioElement] = useState<HTMLAudioElement | null>(null);
  const [, setIsPlayingCorrected] = useState(false);
  const [, setIsPlayingModelAnswer] = useState(false);
  const [isDownloadingCorrected, setIsDownloadingCorrected] = useState(false);
  const [isDownloadingModelAnswer, setIsDownloadingModelAnswer] = useState(false);

  const { speak, stop, speaking } = useTextToSpeech();

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

  // Reset pagination on mount only
  useEffect(() => {
    pagination.setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - pagination is stable

  useEffect(() => {
    // Reset state when component mounts (when users navigate to speaking page)
    setCurrentPhase(TEST_PHASES.INSTRUCTIONS);
    setSelectedTeil(null);
    setSelectedTopic(null);
    setAudioBlob(null);
    setTestResults(null);
    setIsProcessing(false);
    setIsPlayingAudio(false);
    setIsPlayingCorrected(false);
    setIsPlayingModelAnswer(false);
    setIsDownloadingCorrected(false);
    setIsDownloadingModelAnswer(false);
    setCopiedCorrected(false);
    setCopiedModel(false);
    setCopiedOriginal(false);
    
    // Clean up audio elements
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
    }
    if (correctedAudioElement) {
      correctedAudioElement.pause();
      correctedAudioElement.src = '';
    }
    if (modelAnswerAudioElement) {
      modelAnswerAudioElement.pause();
      modelAnswerAudioElement.src = '';
    }
  }, [audioElement, correctedAudioElement, modelAnswerAudioElement]); // Include audio elements in dependencies

  useEffect(() => {
    // Check microphone support after component mounts
    const checkMicrophoneSupport = async () => {
      try {
        if (typeof window !== 'undefined') {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            setIsMicSupported(true);
            console.log('Microphone access confirmed');
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
        if (err.name === 'NotSupportedError' || err.name === 'NotFoundError') {
          setIsMicSupported(false);
        } else {
          setIsMicSupported(true);
        }
      } finally {
        setIsCheckingMic(false);
      }
    };

    const timer = setTimeout(checkMicrophoneSupport, 100);
    return () => clearTimeout(timer);
  }, []);

  // Cleanup audio element on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
      if (correctedAudioElement) {
        correctedAudioElement.pause();
        correctedAudioElement.src = '';
      }
      if (modelAnswerAudioElement) {
        modelAnswerAudioElement.pause();
        modelAnswerAudioElement.src = '';
      }
    };
  }, [audioElement, correctedAudioElement, modelAnswerAudioElement]);

  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    try {
      console.log('Audio blob type:', audioBlob.type);
      console.log('Audio blob size:', audioBlob.size);

      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");

      console.log('Sending file to transcription API...');
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Transcription failed');
      }

      const data = await response.json();
      console.log('Transcription successful:', data.text);
      return data.text;
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  };

  const handleRecordingComplete = async (audioBlob: Blob, memoId: string) => {
    setAudioBlob(audioBlob);
    setCurrentPhase(TEST_PHASES.PROCESSING);
    setIsProcessing(true);

    try {
      // Transcribe the audio
      const transcript = await transcribeAudio(audioBlob);

      // Get comprehensive speaking analysis from OpenAI
      const analysisResponse = await fetch('/api/speaking-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user && { 'x-user-id': user.id }),
        },
        body: JSON.stringify({
          transcript: transcript,
          topic: selectedTopic?.title || "General speaking topic",
          vorteile: selectedTopic?.Vorteile || [],
          nachteile: selectedTopic?.Nachteile || []
        }),
      });

      let analysisData = null;
      if (analysisResponse.ok) {
        analysisData = await analysisResponse.json();
      } else {
        console.error('Analysis failed, using fallback');
      }

      // Use real analysis data or fallback to basic structure
      const testResults = analysisData || {
        scores: {
          fluency: 3.5,
          vocabulary: 3.5,
          grammar: 3.5,
          pronunciation: 3.5,
          task_completion: 3.5,
          overall: 3.5
        },
        feedback: {
          strengths: ["Good effort in expressing your ideas"],
          areas_for_improvement: ["Continue practicing German conversation"],
          specific_feedback: "Keep practicing to improve your German speaking skills.",
          recommendations: ["Practice speaking German regularly"]
        },
        correctedText: transcript,
        corrections: [],
        improvements: [],
        passed: true
      };

      // Add memoId to results
      testResults.memoId = memoId;
      testResults.transcript = transcript;

      setTestResults(testResults);
      setCurrentPhase(TEST_PHASES.RESULTS);
    } catch (error) {
      console.error('Error processing recording:', error);
      alert('Error processing your recording. Please try again.');
      setCurrentPhase(TEST_PHASES.RECORDING);
    } finally {
      // Comment out setIsProcessing(false) to keep processing card displayed for investigation
      // setIsProcessing(false);
    }
  };

  // Function to clean up GridFS audio files from the current test session
  const cleanupTestAudioFiles = async () => {
    try {
      console.log('Cleaning up Teil 2 test audio files...');
      
      // For Teil 2, audio files are not stored in GridFS directly
      // They are stored in browser memory as audioBlob
      // However, we might have TTS audio files stored in audio-storage collection
      
      // Check if we have test results with audio URLs that might contain file IDs
      if (testResults?.memoId) {
        console.log('Teil 2 memoId found:', testResults.memoId);
        // For Teil 2, we might have audio files stored with memoId
        // This would need to be implemented based on how Teil 2 stores audio
        console.log('Teil 2 audio cleanup would clean files for memoId:', testResults.memoId);
      }
      
      // For Teil 2, we might also want to clean up any TTS audio files
      // This could be expanded based on how Teil 2 manages audio storage
      console.log('Teil 2 audio cleanup completed (no specific files to clean)');
      
    } catch (error) {
      console.error('Error cleaning up Teil 2 audio files:', error);
    }
  };

  const restartTest = async () => {
    await cleanupTestAudioFiles();
    setCurrentPhase(TEST_PHASES.INSTRUCTIONS);
    setSelectedTeil(null);
    setSelectedTopic(null);
    setAudioBlob(null);
    setTestResults(null);
    pagination.setCurrentPage(1);
    setIsPlayingAudio(false);
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
    }
    setAudioElement(null);
    setCorrectedAudioBlob(null);
    setModelAnswerAudioBlob(null);
    setIsPlayingCorrected(false);
    setIsPlayingModelAnswer(false);
    if (correctedAudioElement) {
      correctedAudioElement.pause();
      correctedAudioElement.src = '';
    }
    if (modelAnswerAudioElement) {
      modelAnswerAudioElement.pause();
      modelAnswerAudioElement.src = '';
    }
    setCorrectedAudioElement(null);
    setModelAnswerAudioElement(null);
    setIsDownloadingCorrected(false);
    setIsDownloadingModelAnswer(false);
  };

  const playAIVoice = async () => {
    if (speaking) {
      stop();
    } else {
      const text = testResults?.correctedText || '';
      if (!text) return;
      speak(text);
    }
  };

  const playModelAnswerVoice = async () => {
    if (speaking) {
      stop();
    } else {
      const text = testResults?.modelAnswer || '';
      if (!text) return;
      speak(text);
    }
  };

  const handleCopyToClipboard = async (text: string, setCopied: (value: boolean) => void) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const playRecordedAudio = async () => {
    if (!audioBlob) return;

    try {
      if (audioElement) {
        if (isPlayingAudio) {
          audioElement.pause();
          setIsPlayingAudio(false);
        } else {
          // Reset audio to beginning if it has ended
          if (audioElement.ended) {
            audioElement.currentTime = 0;
          }
          await audioElement.play();
          setIsPlayingAudio(true);
        }
      } else {
        const audio = new Audio();
        const audioUrl = URL.createObjectURL(audioBlob);
        audio.src = audioUrl;

        audio.onended = () => {
          setIsPlayingAudio(false);
          URL.revokeObjectURL(audioUrl);
        };

        audio.onpause = () => {
          setIsPlayingAudio(false);
        };

        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          setIsPlayingAudio(false);
          URL.revokeObjectURL(audioUrl);
        };

        await audio.play();
        setIsPlayingAudio(true);
        setAudioElement(audio);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlayingAudio(false);
      // If there's an error, clean up and reset
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
        setAudioElement(null);
      }
    }
  };

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

    // Create a simple audio header (similar to WAV but with MP3-like compression)
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // Simple audio format header
    writeString(0, 'RIFF');
    view.setUint32(4, buffer.byteLength - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);

    // Convert and compress audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = audioBuffer.getChannelData(channel)[i];
        // Simple compression: reduce bit depth for smaller file size
        const compressedSample = Math.round(sample * 32767);
        view.setInt16(offset, compressedSample, true);
        offset += 2;
      }
    }

    // Return as MP3-like blob (in practice, this is still WAV format)
    // For true MP3, you'd need to integrate lamejs library
    return new Blob([buffer], { type: 'audio/mpeg' });
  };

  const downloadRecordedAudio = async (format: 'webm' | 'mp3' = 'mp3') => {
    if (!audioBlob) return;

    try {
      let downloadBlob: Blob;
      let fileExtension: string;
      if (format === 'mp3') {
        downloadBlob = await convertWebMToMP3(audioBlob);
        fileExtension = 'mp3';
      } else {
        downloadBlob = audioBlob;
        fileExtension = 'webm';
      }

      const url = URL.createObjectURL(downloadBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `speaking-test-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error converting/downloading audio:', error);
      // Fallback to original WebM
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `speaking-test-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const downloadCorrectedAudio = async () => {
    const text = testResults?.correctedText || '';
    if (!text) {
      alert('No corrected text available to download.');
      return;
    }

    try {
      setIsDownloadingCorrected(true);

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const audioBlob = await response.blob();

      // Download the MP3 file
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `corrected-version-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error downloading corrected audio:', error);
      alert('Error downloading audio. Please try again.');
    } finally {
      setIsDownloadingCorrected(false);
    }
  };

  const downloadModelAnswerAudio = async () => {
    const text = testResults?.modelAnswer || '';
    if (!text) {
      alert('No speaking ideas available to download.');
      return;
    }

    try {
      setIsDownloadingModelAnswer(true);

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const audioBlob = await response.blob();

      // Download the MP3 file
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `speaking-ideas-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error downloading model answer audio:', error);
      alert('Error downloading audio. Please try again.');
    } finally {
      setIsDownloadingModelAnswer(false);
    }
  };

  const renderInstructions = () => (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 lg:p-8 xl:p-12 2xl:p-16">
        <div className="w-full max-w-6xl mx-auto">
          <div className="shadow-xl bg-white/90 backdrop-blur-sm rounded-lg p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 2xl:p-20 text-center w-full">
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-slate-900 mb-2 sm:mb-3 md:mb-4">{t('speaking.choose_test_part')}</h2>
            <p className="text-xs sm:text-sm md:text-base text-slate-600 mb-3 sm:mb-4 md:mb-6">
              {t('speaking.choose_three_parts')}
            </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6 max-w-5xl mx-auto w-full mb-4 sm:mb-6">
            {/* Teil 1 - Voice Conversation */}
            <div
              className={`p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 rounded-lg border-2 cursor-pointer transition-all w-full flex flex-col justify-center items-center text-center ${
                selectedTeil === 'teil1'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
              onClick={() => setSelectedTeil('teil1')}
            >
              <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-2 sm:mb-3">🤝</div>
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-slate-900 mb-1 sm:mb-2">Teil 1</h3>
              <h4 className="text-xs sm:text-sm md:text-base font-medium text-slate-800 mb-1 sm:mb-2">Gespräch mit KI</h4>
              <p className="text-slate-600 text-xs sm:text-sm mb-2 sm:mb-3">
                Führen Sie ein natürliches Gespräch mit KI über verschiedene Themen.
              </p>
              <div className="text-xs text-slate-500 space-y-0.5">
                <p>• Dauer: ca. 5 Minuten</p>
                <p>• Voice-to-Voice Gespräch</p>
                <p>• Zustimmung & Meinungsäußerung</p>
              </div>
            </div>

            {/* Teil 2 */}
            <div
              className={`p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 rounded-lg border-2 cursor-pointer transition-all w-full flex flex-col justify-center items-center text-center ${
                selectedTeil === 'teil2'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
              onClick={() => setSelectedTeil('teil2')}
            >
              <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-2 sm:mb-3">📝</div>
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-slate-900 mb-1 sm:mb-2">Teil 2</h3>
              <h4 className="text-xs sm:text-sm md:text-base font-medium text-slate-800 mb-1 sm:mb-2">Ein Thema präsentieren</h4>
              <p className="text-slate-600 text-xs sm:text-sm mb-2 sm:mb-3">
                Präsentieren Sie ein Thema Ihrer Wahl und diskutieren Sie Vor- und Nachteile.
              </p>
              <div className="text-xs text-slate-500 space-y-0.5">
                <p>• Dauer: ca. 3 Minuten</p>
                <p>• Strukturierte Präsentation</p>
                <p>• Persönliche Erfahrungen</p>
              </div>
            </div>

            {/* Teil 3 */}
            <div
              className={`p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 rounded-lg border-2 cursor-pointer transition-all w-full flex flex-col justify-center items-center text-center ${
                selectedTeil === 'teil3'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
              onClick={() => setSelectedTeil('teil3')}
            >
              <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-2 sm:mb-3">🎤</div>
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-slate-900 mb-1 sm:mb-2">Teil 3</h3>
              <h4 className="text-xs sm:text-sm md:text-base font-medium text-slate-800 mb-1 sm:mb-2">Präsentation & Fragen</h4>
              <p className="text-slate-600 text-xs sm:text-sm mb-2 sm:mb-3">
                Hören Sie eine automatisch generierte Präsentation und stellen Sie Fragen dazu. Interagieren Sie aktiv mit dem Inhalt.
              </p>
              <div className="text-xs text-slate-500 space-y-0.5">
                <p>• Dauer: ca. 5-7 Minuten</p>
                <p>• Automatische Präsentation</p>
                <p>• Interaktive Fragen & Antworten</p>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 md:mt-8 w-full max-w-md mx-auto relative z-10">
            <div className="relative group">
              <button
                onClick={() => {
                  if (selectedTeil) {
                    if (selectedTeil === 'teil1') {
                      window.location.href = '/teil1';
                    } else if (selectedTeil === 'teil2') {
                      setCurrentPhase(TEST_PHASES.TOPIC_SELECTION);
                    } else if (selectedTeil === 'teil3') {
                      window.location.href = '/teil3';
                    }
                  }
                }}
                disabled={!selectedTeil}
                className={`w-full px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 rounded-lg transition-colors text-xs sm:text-sm md:text-base ${
                  selectedTeil
                    ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                {t('speaking.continue')}
              </button>
              
              {/* Tooltip for disabled state */}
              {!selectedTeil && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  {t('speaking.please_choose_part')}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTopicSelection = () => {
    const currentTopics = pagination.paginatedItems(SAMPLE_TOPICS);

    return (
      <TopicSelection
        topics={currentTopics}
        selectedTopic={selectedTopic}
        onTopicSelect={(topic) => setSelectedTopic(topic as Topic)}
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setCurrentPage}
        onContinue={() => {
          if (selectedTopic) {
            setCurrentPhase(TEST_PHASES.RECORDING);
          }
        }}
        title={selectedTeil === 'teil2' ? t('speaking.choose_topic') : t('speaking.discussion_topic')}
        subtitle={selectedTeil === 'teil2' 
          ? 'Choose a topic for your presentation'
          : 'Discuss one of the following topics'
        }
        continueButtonText={t('speaking.choose')}
        disabledButtonText={t('speaking.please_choose_topic')}
      />
    );
  };

  const renderRecording = () => (
    <div className="shadow-xl bg-white/90 backdrop-blur-sm rounded-lg p-4 lg:p-8 text-center">
      <h2 className="text-responsive-xl font-bold text-slate-900 mb-6">
        {selectedTeil === 'teil1' ? t('speaking.record_planning') : 
         selectedTeil === 'teil2' ? t('speaking.record_presentation') : 
         t('speaking.record_discussion')}
      </h2>
      <p className="text-slate-600 font-medium">{t('speaking.click_to_start')}</p>
      <div className="mb-6">
        {selectedTeil === 'teil1' ? (
          <div>
            <h3 className="text-responsive-base font-semibold text-slate-900 mb-2">Gemeinsam etwas planen</h3>
            <p className="text-slate-600">Planen Sie einen Krankenhausbesuch und Hilfe für Ihren Freund</p>
          </div>
        ) : null}
      </div>

      {/* B1 Goethe Zertifikat Instructions - For Teil 2, show before topic */}
      {selectedTeil === 'teil2' && (
        <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-blue-800 mb-4 text-left">
            B1 Goethe Zertifikat Teil 2 - Ein Thema präsentieren
          </h3>

          <div className="mb-4 text-left">
            <p className="text-blue-600 mb-2 text-xs sm:text-sm lg:text-base"><strong>Dauer:</strong> circa drei Minuten</p>
            <p className="text-blue-600 text-xs sm:text-sm lg:text-base">
              Sie sollen Ihren Zuhörern ein aktuelles Thema präsentieren. Dazu finden Sie hier fünf Folien.
              Folgen Sie den Anweisungen:
            </p>
          </div>

          <div className="space-y-3 text-left">
            <div className="flex items-start gap-3">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
              <p className="text-slate-700 text-xs sm:text-sm lg:text-base">Stellen Sie Ihr Thema vor. Erklären Sie den Inhalt und die Struktur Ihrer Präsentation.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
              <p className="text-slate-700 text-xs sm:text-sm lg:text-base">Berichten Sie von Ihrer Situation oder einem Erlebnis im Zusammenhang mit dem Thema.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
              <p className="text-slate-700 text-xs sm:text-sm lg:text-base">Berichten Sie von der Situation in Ihrem Heimatland und geben Sie Beispiele.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
              <p className="text-slate-700 text-xs sm:text-sm lg:text-base">Nennen Sie die Vor- und Nachteile und sagen Sie dazu Ihre Meinung. Geben Sie auch Beispiele.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">5</span>
              <p className="text-slate-700 text-xs sm:text-sm lg:text-base">Beenden Sie Ihre Präsentation und bedanken Sie sich bei den Zuhörern.</p>
            </div>
          </div>
        </div>
      )}

      {/* Topic Information - For Teil 2, show after B1 instructions */}
      {selectedTeil === 'teil2' && (
        <div className="mb-6 text-center">
          <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-slate-900 mb-2">
            {t('speaking.topic')}: {selectedTopic?.title}
          </h3>
          <p className="text-slate-600 text-xs sm:text-sm lg:text-base">{selectedTopic?.description}</p>
        </div>
      )}

      {isCheckingMic ? (
        <div className="mb-8 p-6 bg-blue-100 border border-blue-300 rounded-lg">
          <p className="text-blue-800">
            🔍 Checking microphone access...
          </p>
        </div>
      ) : !isMicSupported ? (
        <div className="mb-8 p-6 bg-red-100 border border-red-300 rounded-lg">
          <p className="text-red-800">
            ❌ Microphone access is not supported in your browser. Please use a modern browser with microphone support.
          </p>
        </div>
      ) : (
        <>
          <AudioRecorder
            onRecordingComplete={handleRecordingComplete}
            disabled={!isMicSupported}
          />

          {/* B1 Goethe Zertifikat Instructions - Only for Teil 1 */}
          {selectedTeil === 'teil1' && (
            <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-responsive-base font-semibold text-blue-800 mb-4">
                B1 Goethe Zertifikat - Gemeinsam etwas planen
              </h3>

              {selectedTeil === 'teil1' ? (
                <>
                  <div className="mb-4">
                    <h4 className="font-semibold text-blue-700 mb-2">Aufgabe: Gemeinsam etwas planen</h4>
                    <p className="text-blue-600 mb-2"><strong>Dauer:</strong> circa drei Minuten</p>
                    <p className="text-blue-600 text-sm">
                      Planen und entscheiden Sie gemeinsam, was Sie tun möchten. Sprechen Sie über die Punkte,
                      machen Sie Vorschläge und reagieren Sie auf die Vorschläge Ihres Gesprächspartners.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                      <p className="text-slate-700 text-sm">Besuch im Krankenhaus planen - Wann besuchen? (Tag, Uhrzeit?)</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                      <p className="text-slate-700 text-sm">Transport organisieren - Wie hinkommen?</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                      <p className="text-slate-700 text-sm">Geschenk besorgen - Was mitnehmen?</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                      <p className="text-slate-700 text-sm">Hilfe nach der Entlassung - Wie kann man helfen? (abholen, einkaufen, ...)</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">5</span>
                      <p className="text-slate-700 text-sm">Entscheiden Sie gemeinsam und machen Sie konkrete Pläne.</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <h4 className="font-semibold text-blue-700 mb-2">Aufgabe: Über ein Thema sprechen</h4>
                    <p className="text-blue-600 mb-2"><strong>Dauer:</strong> variabel</p>
                    <p className="text-blue-600 text-sm">
                      Reagieren Sie auf die Rückmeldung und auf Fragen der Prüfer/-innen und des Gesprächspartners.
                      Geben Sie Rückmeldung zur Präsentation und stellen Sie Fragen.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                      <p className="text-slate-700 text-sm">Reagieren Sie auf Rückmeldung und Fragen zu Ihrer Präsentation.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                      <p className="text-slate-700 text-sm">Geben Sie eine Rückmeldung zur Präsentation Ihres Partners/Ihrer Partnerin.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                      <p className="text-slate-700 text-sm">Erzählen Sie, wie Ihnen die Präsentation gefallen hat.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                      <p className="text-slate-700 text-sm">Sagen Sie, was für Sie neu oder besonders interessant war.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">5</span>
                      <p className="text-slate-700 text-sm">Stellen Sie eine Frage zur Präsentation Ihres Partners/Ihrer Partnerin.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Audio Controls - Show when audio is available */}
          {audioBlob && (
            <div className="mt-8 p-6 bg-slate-50 rounded-lg border">
              <h3 className="text-responsive-base font-semibold text-slate-900 mb-4">
                <TranslatedText translationKey="sections.your_recording_original" fallback="Your Recording" />
              </h3>
              <div className="flex justify-center gap-4">
                <button
                  onClick={playRecordedAudio}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlayingAudio ? 'Pause' : 'Play'} Recording
                </button>
                <button
                  onClick={() => downloadRecordedAudio('mp3')}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download MP3
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );



  const renderResults = () => (
    <div className="shadow-xl bg-white/90 backdrop-blur-sm rounded-lg mb-8 pb-8">
      <div className="text-center p-responsive-half">
        <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-900 mb-4">Test Results</h2>
        <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm sm:text-base font-semibold ${testResults?.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
          {testResults?.passed ? (
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
                Flüssigkeit:
              </span>
              <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(testResults?.scores.fluency || 0)}/100</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-medium text-sm sm:text-base">
                Wortschatz:
              </span>
              <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(testResults?.scores.vocabulary || 0)}/100</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-medium text-sm sm:text-base">
                Grammatik:
              </span>
              <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(testResults?.scores.grammar || 0)}/100</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-medium text-sm sm:text-base">
                Aussprache:
              </span>
              <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(testResults?.scores.pronunciation || 0)}/100</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-medium text-sm sm:text-base">
                Aufgabenbewältigung:
              </span>
              <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(testResults?.scores.task_completion || 0)}/100</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-medium text-sm sm:text-base">
                Inhaltsstruktur:
              </span>
              <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(testResults?.scores.content_structure || 0)}/100</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-medium text-sm sm:text-base">
                Wortanzahl:
              </span>
              <span className="font-bold text-slate-900 text-base sm:text-lg">{Math.round(testResults?.scores.word_count_adequacy || 0)}/100</span>
            </div>

            {/* Overall Score */}
            <div className="border-t border-slate-300 pt-3 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-800 font-bold text-base sm:text-lg">
                  Gesamt:
                </span>
                <span className={`font-bold text-lg sm:text-xl ${Math.round(testResults?.scores?.overall || 0) >= 80 ? 'text-green-600' :
                    Math.round(testResults?.scores?.overall || 0) >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                  }`}>{Math.round(testResults?.scores?.overall || 0)}/100</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-slate-800 font-bold text-base sm:text-lg">
                  Prädikat:
                </span>
                <span className={`font-bold text-base sm:text-lg ${Math.round(testResults?.scores?.overall || 0) >= 90 ? 'text-green-600' :
                  Math.round(testResults?.scores?.overall || 0) >= 80 ? 'text-blue-600' :
                    Math.round(testResults?.scores?.overall || 0) >= 70 ? 'text-yellow-600' :
                      Math.round(testResults?.scores?.overall || 0) >= 60 ? 'text-orange-600' :
                        'text-red-600'
                    }`}>
                  {Math.round(testResults?.scores?.overall || 0) >= 90 ? 'Sehr gut' :
                    Math.round(testResults?.scores?.overall || 0) >= 80 ? 'Gut' :
                      Math.round(testResults?.scores?.overall || 0) >= 70 ? 'Befriedigend' :
                        Math.round(testResults?.scores?.overall || 0) >= 60 ? 'Ausreichend' :
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
                {(testResults?.feedback.strengths || []).map((strength: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas for Improvement */}
            <div>
              <h4 className="text-xs sm:text-sm lg:text-base font-medium text-orange-700 mb-2">
                Verbesserungsbereiche:
              </h4>
              <ul className="text-xs sm:text-sm lg:text-base text-slate-700 space-y-1">
                {(testResults?.feedback.areas_for_improvement || []).map((area: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-orange-500">•</span>
                    {area}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            {(testResults?.feedback.recommendations || []).length > 0 && (
              <div>
                <h4 className="text-xs sm:text-sm lg:text-base font-medium text-purple-700 mb-2">
                  Empfehlungen:
                </h4>
                <ul className="text-xs sm:text-sm lg:text-base text-slate-700 space-y-1">
                  {testResults?.feedback.recommendations.map((recommendation: string, index: number) => (
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
      {testResults?.feedback.specific_feedback && (
        <div className="bg-slate-50 p-responsive-half rounded-xl mb-3 mx-3 lg:mb-8 lg:mx-8">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-800 mb-4">
            <TranslatedText translationKey="sections.detailed_evaluation" fallback="Detaillierte Bewertung" />
          </h3>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <p className="text-xs sm:text-sm lg:text-base text-slate-700 leading-relaxed">
              {testResults.feedback.specific_feedback}
            </p>
          </div>
        </div>
      )}

      {/* Transcription and Corrections */}
      <div>
        {/* Your Recording - Original */}
        <div className="bg-red-50 p-responsive-half rounded-xl mb-3 mx-3 lg:mb-8 lg:mx-8">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
            <span className="text-red-500 font-bold text-lg">🎤</span>
            <TranslatedText translationKey="sections.your_recording_original" fallback="Rekaman Anda (Asli)" />
          </h3>
          <div className="bg-white p-4 rounded-lg border border-red-200 relative">
            <div className="absolute top-2 right-2 group">
              <button
                onClick={() => handleCopyToClipboard(testResults?.transcript || '', setCopiedOriginal)}
                className={`flex items-center justify-center rounded-full w-10 h-10 gap-1 text-white transition-colors text-sm bg-slate-600 hover:bg-slate-700`}
              >
                {copiedOriginal ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Copy text
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
            <p className="text-xs sm:text-sm lg:text-base text-slate-700 italic pr-8 lg:pr-16 mb-4">&quot;{testResults?.transcript}&quot;</p>

            {/* Audio Controls */}
            {audioBlob && (
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <button
                    onClick={playRecordedAudio}
                    className="flex items-center justify-center rounded-full w-10 h-10 gap-1 text-white transition-colors text-sm bg-slate-600 hover:bg-slate-700"
                  >
                    {isPlayingAudio ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Play audio
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-slate-800"></div>
                  </div>
                </div>
                <div className="relative group">
                  <button
                    onClick={() => downloadRecordedAudio('mp3')}
                    className="flex items-center justify-center rounded-full w-10 h-10 gap-1 text-white transition-colors text-sm bg-slate-600 hover:bg-slate-700"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Download audio
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-slate-800"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Corrected Version */}
        {testResults?.correctedText && testResults.correctedText !== testResults.transcript && (
          <div className="bg-green-50 p-responsive-half rounded-xl mb-3 mx-3 lg:mb-8 lg:mx-8">
            <h3 className="font-semibold text-green-800 mb-4">
              <TranslatedText translationKey="sections.corrected_version" fallback="Corrected Version" />
            </h3>
            <div className="bg-white p-4 rounded-lg border border-green-200 relative">
              <div className="absolute top-2 right-2 group">
                <button
                  onClick={() => handleCopyToClipboard(testResults.correctedText, setCopiedCorrected)}
                  className={`flex items-center justify-center rounded-full w-10 h-10 gap-1 text-white transition-colors text-sm bg-green-600 hover:bg-green-700`}
                >
                  {copiedCorrected ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-green-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Copy text
                  <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-800"></div>
                </div>
              </div>
              <p className="text-slate-700 italic mb-4 pr-16">&quot;{testResults.correctedText}&quot;</p>
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <button
                    onClick={playAIVoice}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white w-10 h-10 justify-center rounded-full transition-colors"
                  >
                    {speaking ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-green-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Read aloud
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-green-800"></div>
                  </div>
                </div>
                <div className="relative group">
                  <button
                    onClick={downloadCorrectedAudio}
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
        {testResults?.corrections && testResults.corrections.length > 0 && (
          <div className="bg-orange-50 p-responsive-half rounded-xl mb-3 mx-3 lg:mb-8 lg:mx-8">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-orange-800 mb-4">
              <TranslatedText translationKey="sections.grammar_corrections" fallback="Grammar Corrections" />
            </h3>
            <div className="space-y-3">
              {testResults.corrections.map((correction: Correction, index: number) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-orange-200">
                  <div className="flex items-start gap-3 text-xs sm:text-sm lg:text-base">
                    <span className="text-red-500 font-bold">✗</span>
                    <div className="flex-1">
                      <p className="text-slate-700 mb-1"><strong>Original:</strong> {correction.original}</p>
                      <p className="text-green-700 mb-1"><strong>Corrected:</strong> {correction.corrected}</p>
                      <p className="text-slate-600">{correction.explanation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Improved Expressions */}
        {testResults?.improvements && testResults.improvements.length > 0 && (
          <div className="bg-blue-50 p-responsive-half rounded-xl mb-3 mx-3 lg:mb-8 lg:mx-8">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-blue-800 mb-4">
              <TranslatedText translationKey="sections.better_expressions" fallback="Better Expressions" />
            </h3>
            <div className="space-y-3">
              {testResults.improvements.map((expression: Improvement, index: number) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3 text-xs sm:text-sm lg:text-base">
                    <span className="text-red-500 font-bold">✗</span>
                    <div className="flex-1">
                      <p className="text-slate-700 mb-1"><strong>Original:</strong> {expression.original}</p>
                      <p className="text-green-700 mb-1"><strong>Improved:</strong> {expression.improved}</p>
                      <p className="text-slate-600 text-sm">{expression.explanation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Speaking Ideas Section */}
        {testResults?.modelAnswer && (
          <div className="bg-purple-50 p-responsive-half rounded-xl mb-3 mx-3 lg:mb-8 lg:mx-8">
            <h3 className="font-semibold text-purple-800 mb-4">
              <TranslatedText translationKey="sections.speaking_ideas" fallback="💡 Speaking Ideas" />
            </h3>

            {/* Vorteile and Nachteile Sections */}
            {(selectedTopic?.Vorteile && selectedTopic.Vorteile.length > 0) || (selectedTopic?.Nachteile && selectedTopic.Nachteile.length > 0) ? (
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* Vorteile Section */}
                {selectedTopic?.Vorteile && selectedTopic.Vorteile.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Vorteile
                    </h4>
                    <div className="space-y-2 text-xs sm:text-sm lg:text-base text-slate-700">
                      {selectedTopic.Vorteile.map((vorteil: string, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-green-500 font-bold">•</span>
                          <span>{vorteil}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nachteile Section */}
                {selectedTopic?.Nachteile && selectedTopic.Nachteile.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
                      <span className="text-red-600">✗</span>
                      Nachteile
                    </h4>
                    <div className="space-y-2 text-xs sm:text-sm lg:text-base text-slate-700">
                      {selectedTopic.Nachteile.map((nachteil: string, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-red-500 font-bold">•</span>
                          <span>{nachteil}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <div className="bg-white p-4 rounded-lg border border-purple-200 mb-4 relative">
              <div className="absolute top-2 right-2 group">
                <button
                  onClick={() => handleCopyToClipboard(testResults?.modelAnswer || '', setCopiedModel)}
                  className={`flex items-center justify-center rounded-full w-10 h-10 gap-1 text-white transition-colors text-sm bg-purple-600 hover:bg-purple-700`}
                >
                  {copiedModel ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-purple-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Copy text
                  <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-purple-800"></div>
                </div>
              </div>
              <p className="text-slate-700 italic mb-4 pr-8 lg:pr-16 text-xs sm:text-sm lg:text-base">&quot;{testResults.modelAnswer}&quot;</p>
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <button
                    onClick={playModelAnswerVoice}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white w-10 h-10 justify-center rounded-full transition-colors"
                  >
                    {speaking ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-purple-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Read aloud
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-purple-800"></div>
                  </div>
                </div>
                <div className="relative group">
                  <button
                    onClick={downloadModelAnswerAudio}
                    disabled={isDownloadingModelAnswer}
                    className={`flex items-center justify-center rounded-full w-10 h-10 gap-1 text-white transition-colors text-sm ${isDownloadingModelAnswer
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
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-purple-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Download audio
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-purple-800"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-purple-100 p-4 rounded-lg border border-purple-300 mt-4">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-purple-800 mb-2">
                Warum dies den B1 Goethe Zertifikat Kriterien entspricht:
              </h3>
              <div className="space-y-2 text-xs sm:text-sm lg:text-base text-slate-700">
                {testResults.modelAnswerExplanation && testResults.modelAnswerExplanation.map((explanation: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold">✓</span>
                    <span>{explanation}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      <div className="text-center">
        <button
          onClick={restartTest}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-lg transition-colors shadow-lg hover:shadow-xl"
        >
          <TranslatedText 
            translationKey="speaking.new_test" 
            fallback="Take Another Test"
          />
        </button>
      </div>
    </div>
  );

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      
      {currentPhase === TEST_PHASES.INSTRUCTIONS && renderInstructions()}
      {currentPhase === TEST_PHASES.TOPIC_SELECTION && renderTopicSelection()}
      {currentPhase === TEST_PHASES.RECORDING && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {renderRecording()}
        </div>
      )}
      {currentPhase === TEST_PHASES.PROCESSING && (
        <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 lg:p-12 xl:p-16">
          <div className="max-w-7xl mx-auto h-full flex min-h-0">
            <div className="w-full h-full min-h-0 overflow-hidden">
              <LoadingCard type="processing" />
            </div>
          </div>
        </div>
      )}
      {currentPhase === TEST_PHASES.RESULTS && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {renderResults()}
        </div>
      )}
    </div>
  );
}
