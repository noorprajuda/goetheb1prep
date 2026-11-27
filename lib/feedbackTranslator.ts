'use client';

// Feedback mapping for different test parts
const FEEDBACK_MAPPINGS = {
  teil1: {
    strengths: {
      'fluency': ['fluency_good', 'fluency_excellent'],
      'vocabulary': ['vocabulary_diverse', 'vocabulary_appropriate'],
      'grammar': ['grammar_correct', 'grammar_good'],
      'pronunciation': ['pronunciation_clear', 'pronunciation_good'],
      'task_completion': ['task_completion_good', 'task_completion_excellent'],
      'engagement': ['engagement_good', 'engagement_excellent'],
      'redemittel': ['redemittel_used'],
      'opinions': ['opinions_clear'],
      'arguments': ['arguments_good']
    },
    improvements: {
      'fluency': ['fluency_practice', 'fluency_pace'],
      'vocabulary': ['vocabulary_expand', 'vocabulary_precision'],
      'grammar': ['grammar_complex', 'grammar_accuracy'],
      'pronunciation': ['pronunciation_practice', 'pronunciation_intonation'],
      'task_completion': ['task_completion_structure', 'task_completion_engagement'],
      'redemittel': ['redemittel_more'],
      'opinions': ['opinions_develop'],
      'arguments': ['arguments_stronger']
    },
    recommendations: {
      'general': ['daily_practice', 'conversation_partners'],
      'vocabulary': ['vocabulary_learning'],
      'grammar': ['grammar_exercises'],
      'pronunciation': ['pronunciation_practice'],
      'redemittel': ['redemittel_study'],
      'preparation': ['topic_preparation'],
      'practice': ['recording_practice']
    }
  },
  teil2: {
    strengths: {
      'fluency': ['fluency_good', 'fluency_excellent'],
      'vocabulary': ['vocabulary_diverse', 'vocabulary_appropriate'],
      'grammar': ['grammar_correct', 'grammar_good'],
      'pronunciation': ['pronunciation_clear', 'pronunciation_good'],
      'task_completion': ['task_completion_good', 'task_completion_excellent'],
      'structure': ['structure_good', 'structure_excellent'],
      'content': ['content_rich', 'content_organized'],
      'word_count': ['word_count_adequate', 'word_count_excellent'],
      'opinions': ['opinions_clear'],
      'arguments': ['arguments_good']
    },
    improvements: {
      'fluency': ['fluency_practice', 'fluency_pace'],
      'vocabulary': ['vocabulary_expand', 'vocabulary_precision'],
      'grammar': ['grammar_complex', 'grammar_accuracy'],
      'pronunciation': ['pronunciation_practice', 'pronunciation_intonation'],
      'task_completion': ['task_completion_structure', 'task_completion_content'],
      'structure': ['structure_organization', 'structure_transitions'],
      'content': ['content_depth', 'content_examples'],
      'word_count': ['word_count_increase', 'word_count_balance'],
      'opinions': ['opinions_develop'],
      'arguments': ['arguments_stronger']
    },
    recommendations: {
      'general': ['daily_practice', 'structure_study'],
      'vocabulary': ['vocabulary_learning'],
      'grammar': ['grammar_exercises'],
      'pronunciation': ['pronunciation_practice'],
      'preparation': ['topic_preparation'],
      'practice': ['recording_practice', 'time_management'],
      'content': ['content_development']
    }
  },
  teil3: {
    strengths: {
      'reaction': ['reaction_good', 'reaction_excellent'],
      'questions': ['questions_relevant', 'questions_thoughtful'],
      'feedback': ['feedback_clear', 'feedback_constructive'],
      'spontaneous': ['spontaneous_reaction', 'spontaneous_excellent'],
      'listening': ['listening_active', 'listening_excellent'],
      'politeness': ['politeness_appropriate', 'politeness_good'],
      'language': ['language_appropriate', 'language_good'],
      'engagement': ['engagement_good', 'engagement_excellent']
    },
    improvements: {
      'reaction': ['reaction_precision', 'reaction_depth'],
      'questions': ['questions_formulation', 'questions_relevance'],
      'feedback': ['feedback_clarity', 'feedback_structure'],
      'spontaneous': ['spontaneous_practice', 'spontaneous_confidence'],
      'listening': ['listening_skills', 'listening_comprehension'],
      'politeness': ['politeness_variety', 'politeness_appropriateness'],
      'language': ['language_accuracy', 'language_fluency'],
      'engagement': ['engagement_consistency', 'engagement_quality']
    },
    recommendations: {
      'general': ['presentation_practice', 'question_formulation'],
      'feedback': ['feedback_practice'],
      'spontaneous': ['spontaneous_practice'],
      'listening': ['listening_practice'],
      'politeness': ['politeness_study'],
      'language': ['language_practice'],
      'engagement': ['engagement_practice']
    }
  }
};

// Direct German text to translation key mappings
const GERMAN_TO_TRANSLATION_MAPPINGS = {
  'verständnis des themas': 'feedback.teil1.strengths.engagement_good',
  'angemessene reaktion auf die situation': 'feedback.teil1.strengths.task_completion_good',
  'gute flüssigkeit': 'feedback.teil1.strengths.fluency_good',
  'sehr gute flüssigkeit': 'feedback.teil1.strengths.fluency_excellent',
  'angemessener wortschatz': 'feedback.teil1.strengths.vocabulary_appropriate',
  'vielfältiger wortschatz': 'feedback.teil1.strengths.vocabulary_diverse',
  'korrekte grammatik': 'feedback.teil1.strengths.grammar_correct',
  'gute grammatik': 'feedback.teil1.strengths.grammar_good',
  'klare aussprache': 'feedback.teil1.strengths.pronunciation_clear',
  'gute aussprache': 'feedback.teil1.strengths.pronunciation_good',
  'gute aufgabenbewältigung': 'feedback.teil1.strengths.task_completion_good',
  'sehr gute aufgabenbewältigung': 'feedback.teil1.strengths.task_completion_excellent',
  'gute beteiligung': 'feedback.teil1.strengths.engagement_good',
  'sehr gute beteiligung': 'feedback.teil1.strengths.engagement_excellent',
  'angemessene redemittel': 'feedback.teil1.strengths.redemittel_used',
  'klare meinungen': 'feedback.teil1.strengths.opinions_clear',
  'gute argumente': 'feedback.teil1.strengths.arguments_good',
  
  // Additional common German feedback phrases
  'verständnis für das thema': 'feedback.teil1.strengths.engagement_good',
  'gutes verständnis des themas': 'feedback.teil1.strengths.engagement_good',
  'sehr gutes verständnis des themas': 'feedback.teil1.strengths.engagement_excellent',
  'angemessene reaktion': 'feedback.teil1.strengths.task_completion_good',
  'gute reaktion auf die situation': 'feedback.teil1.strengths.task_completion_good',
  'sehr gute reaktion auf die situation': 'feedback.teil1.strengths.task_completion_excellent',
  'passende reaktion': 'feedback.teil1.strengths.task_completion_good',
  'angemessene antworten': 'feedback.teil1.strengths.task_completion_good',
  'gute antworten': 'feedback.teil1.strengths.task_completion_good',
  'sehr gute antworten': 'feedback.teil1.strengths.task_completion_excellent',
  'flüssiges sprechen': 'feedback.teil1.strengths.fluency_good',
  'sehr flüssiges sprechen': 'feedback.teil1.strengths.fluency_excellent',
  'natürliches sprechen': 'feedback.teil1.strengths.fluency_good',
  'angemessener sprachgebrauch': 'feedback.teil1.strengths.language_appropriate',
  'guter sprachgebrauch': 'feedback.teil1.strengths.language_good',
  'klare sprache': 'feedback.teil1.strengths.language_appropriate',
  'verständliche sprache': 'feedback.teil1.strengths.language_appropriate',
  'gute kommunikation': 'feedback.teil1.strengths.engagement_good',
  'sehr gute kommunikation': 'feedback.teil1.strengths.engagement_excellent',
  'aktive teilnahme': 'feedback.teil1.strengths.engagement_good',
  'sehr aktive teilnahme': 'feedback.teil1.strengths.engagement_excellent',
  'gute mitarbeit': 'feedback.teil1.strengths.engagement_good',
  'sehr gute mitarbeit': 'feedback.teil1.strengths.engagement_excellent',
  
  // Teil 2 mappings
  'gute präsentationsflüssigkeit': 'feedback.teil2.strengths.fluency_good',
  'sehr gute präsentationsflüssigkeit': 'feedback.teil2.strengths.fluency_excellent',
  'gute präsentationsstruktur': 'feedback.teil2.strengths.structure_good',
  'sehr gute präsentationsstruktur': 'feedback.teil2.strengths.structure_excellent',
  'reicher inhalt': 'feedback.teil2.strengths.content_rich',
  'organisierter inhalt': 'feedback.teil2.strengths.content_organized',
  'angemessene wortanzahl': 'feedback.teil2.strengths.word_count_adequate',
  'sehr gute wortanzahl': 'feedback.teil2.strengths.word_count_excellent',
  
  // Teil 3 mappings
  'gute reaktion auf präsentation': 'feedback.teil3.strengths.reaction_good',
  'sehr gute reaktion auf präsentation': 'feedback.teil3.strengths.reaction_excellent',
  'relevante fragen': 'feedback.teil3.strengths.questions_relevant',
  'durchdachte fragen': 'feedback.teil3.strengths.questions_thoughtful',
  'klare rückmeldung': 'feedback.teil3.strengths.feedback_clear',
  'konstruktive rückmeldung': 'feedback.teil3.strengths.feedback_constructive',
  'spontane reaktion': 'feedback.teil3.strengths.spontaneous_reaction',
  'sehr gute spontane reaktion': 'feedback.teil3.strengths.spontaneous_excellent',
  'aktives zuhören': 'feedback.teil3.strengths.listening_active',
  'sehr gutes aktives zuhören': 'feedback.teil3.strengths.listening_excellent',
  'angemessene höflichkeit': 'feedback.teil3.strengths.politeness_appropriate',
  'gute höflichkeit': 'feedback.teil3.strengths.politeness_good',
  'angemessene sprache': 'feedback.teil3.strengths.language_appropriate',
  'gute sprache': 'feedback.teil3.strengths.language_good',
  'gute diskussionsbeteiligung': 'feedback.teil3.strengths.engagement_good',
  'sehr gute diskussionsbeteiligung': 'feedback.teil3.strengths.engagement_excellent'
};

// Function to detect feedback category from German text
function detectFeedbackCategory(text: string, category: 'strengths' | 'improvements' | 'recommendations'): string[] {
  const lowerText = text.toLowerCase();
  const detectedCategories: string[] = [];

  // First, try direct mapping
  if (lowerText in GERMAN_TO_TRANSLATION_MAPPINGS) {
    const translationKey = (GERMAN_TO_TRANSLATION_MAPPINGS as Record<string, string>)[lowerText];
    const parts = translationKey.split('.');
    if (parts.length >= 4) {
      detectedCategories.push(parts[3]); // Extract the category part
    }
  }

  // If no direct mapping found, try keyword detection
  if (detectedCategories.length === 0) {
    // Common German keywords for different categories
    const keywordMappings = {
      strengths: {
        'fluency': ['flüssigkeit', 'flüssig', 'natürlich', 'rhythmus'],
        'vocabulary': ['wortschatz', 'vokabular', 'wörter', 'ausdruck'],
        'grammar': ['grammatik', 'grammatisch', 'struktur', 'satz'],
        'pronunciation': ['aussprache', 'pronunciation', 'verständlich', 'klar'],
        'task_completion': ['aufgabe', 'aufgabenbewältigung', 'erfüllung', 'vollständig', 'reaktion', 'situation'],
        'engagement': ['beteiligung', 'engagement', 'aktiv', 'teilnahme', 'verständnis'],
        'redemittel': ['redemittel', 'formeln', 'phrasen', 'ausdrücke'],
        'opinions': ['meinung', 'ansicht', 'standpunkt', 'position'],
        'arguments': ['argument', 'begründung', 'überzeugend', 'logisch']
      },
      improvements: {
        'fluency': ['flüssigkeit', 'flüssig', 'tempo', 'rhythmus'],
        'vocabulary': ['wortschatz', 'vokabular', 'wörter', 'ausdruck'],
        'grammar': ['grammatik', 'grammatisch', 'struktur', 'satz'],
        'pronunciation': ['aussprache', 'pronunciation', 'verständlich', 'klar'],
        'task_completion': ['aufgabe', 'aufgabenbewältigung', 'erfüllung', 'vollständig'],
        'structure': ['struktur', 'aufbau', 'organisation', 'gliederung'],
        'content': ['inhalt', 'content', 'tiefe', 'beispiele'],
        'word_count': ['wortanzahl', 'länge', 'umfang', 'dauer'],
        'reaction': ['reaktion', 'reagieren', 'antwort', 'feedback'],
        'questions': ['frage', 'fragen', 'nachfrage', 'interesse'],
        'listening': ['zuhören', 'verstehen', 'aufmerksam', 'konzentration'],
        'politeness': ['höflichkeit', 'formeln', 'respekt', 'angemessen'],
        'language': ['sprache', 'sprachlich', 'ausdruck', 'formulierung'],
        'engagement': ['beteiligung', 'engagement', 'aktiv', 'teilnahme']
      },
      recommendations: {
        'general': ['üben', 'praxis', 'training', 'wiederholung'],
        'vocabulary': ['wortschatz', 'vokabular', 'wörter', 'lernen'],
        'grammar': ['grammatik', 'grammatisch', 'struktur', 'übungen'],
        'pronunciation': ['aussprache', 'pronunciation', 'audio', 'hören'],
        'preparation': ['vorbereitung', 'vorbereiten', 'planung', 'struktur'],
        'practice': ['üben', 'praxis', 'training', 'wiederholung'],
        'content': ['inhalt', 'content', 'entwicklung', 'vertiefung'],
        'feedback': ['feedback', 'rückmeldung', 'kritik', 'bewertung'],
        'spontaneous': ['spontan', 'spontanität', 'reaktion', 'flexibilität'],
        'listening': ['zuhören', 'verstehen', 'aufmerksam', 'konzentration'],
        'politeness': ['höflichkeit', 'formeln', 'respekt', 'angemessen'],
        'language': ['sprache', 'sprachlich', 'ausdruck', 'formulierung'],
        'engagement': ['beteiligung', 'engagement', 'aktiv', 'teilnahme']
      }
    };

    const mappings = keywordMappings[category];
    for (const [categoryKey, keywords] of Object.entries(mappings)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        detectedCategories.push(categoryKey);
      }
    }
  }

  return detectedCategories;
}

// Function to get quality level from text
function getQualityLevel(text: string): 'good' | 'excellent' | 'basic' {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('sehr gut') || lowerText.includes('excellent') || 
      lowerText.includes('ausgezeichnet') || lowerText.includes('hervorragend')) {
    return 'excellent';
  }
  
  if (lowerText.includes('gut') || lowerText.includes('good') || 
      lowerText.includes('angemessen') || lowerText.includes('appropriate')) {
    return 'good';
  }
  
  return 'basic';
}

// Main function to translate feedback
export function translateFeedback(
  feedback: string[], 
  category: 'strengths' | 'improvements' | 'recommendations',
  testPart: 'teil1' | 'teil2' | 'teil3',
  language: 'id' | 'en',
  t: (key: string) => string
): string[] {
  return feedback.map(item => {
    const lowerText = item.toLowerCase();
    
    // First, try direct German text mapping
    if (lowerText in GERMAN_TO_TRANSLATION_MAPPINGS) {
      const translationKey = (GERMAN_TO_TRANSLATION_MAPPINGS as Record<string, string>)[lowerText];
      const translation = t(translationKey);
      
      // If translation exists and is different from the key, use it
      if (translation && translation !== translationKey) {
        return translation;
      }
    }
    
    // If no direct mapping found, try category detection
    const detectedCategories = detectFeedbackCategory(item, category);
    const qualityLevel = getQualityLevel(item);
    
    // Try to find a matching translation key
    for (const detectedCategory of detectedCategories) {
      const categoryMappings = FEEDBACK_MAPPINGS[testPart][category];
      if (detectedCategory in categoryMappings) {
        const possibleKeys = (categoryMappings as Record<string, string[]>)[detectedCategory];
        
        // Try to find a key that matches the quality level
        let keyToUse = possibleKeys[0]; // Default to first key
        
        if (qualityLevel === 'excellent' && possibleKeys.length > 1) {
          keyToUse = possibleKeys[1];
        }
        
        const translationKey = `feedback.${testPart}.${category}.${keyToUse}`;
        const translation = t(translationKey);
        
        // If translation exists and is different from the key, use it
        if (translation && translation !== translationKey) {
          return translation;
        }
      }
    }
    
    // If no specific translation found, return the original text
    return item;
  });
}

// Fallback function for when useTranslation is not available
export function translateFeedbackStatic(
  feedback: string[], 
  // category: 'strengths' | 'improvements' | 'recommendations',
  // testPart: 'teil1' | 'teil2' | 'teil3',
  // language: 'id' | 'en'
): string[] {
  // This would need to be implemented with a static translation object
  // For now, return the original feedback
  return feedback;
}
