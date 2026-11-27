import { useState, useEffect } from "react";

export function useTextToSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Load voices when component mounts
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      setIsReady(true);
    };

    loadVoices();
    
    // Some browsers load voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Cleanup function
    return () => {
      try {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      } catch (error) {
        console.warn("Error during cleanup:", error);
      }
    };
  }, []);

  // Check if speech synthesis is ready
  const isSpeechSynthesisReady = () => {
    return isReady && voices.length > 0;
  };

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) {
      console.warn("Your browser does not support Text-to-Speech");
      return;
    }

    // Check if speech synthesis is ready
    if (!isSpeechSynthesisReady()) {
      console.warn("Speech synthesis is not ready yet, retrying in 500ms...");
      setTimeout(() => speak(text), 500);
      return;
    }

    // Stop any current speech before starting new one
    try {
      window.speechSynthesis.cancel();
    } catch (error) {
      console.warn("Error canceling previous speech:", error);
    }

    // Validate text input
    if (!text || text.trim().length === 0) {
      console.warn("Empty text provided for speech synthesis");
      return;
    }

    // Try to find Sol voice specifically
    let selectedVoice = voices.find(voice => 
      voice.name === "Sol" || 
      voice.name === "Microsoft Sol Online (Natural) - German (Germany)" ||
      voice.name.toLowerCase().includes('sol')
    );

    // Fallback to other German voices if Sol not available
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => 
        voice.lang === "de-DE" && 
        (voice.name.includes("Microsoft") || voice.name.includes("Google"))
      );
    }

    // Last fallback to any German voice
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => voice.lang.startsWith('de'));
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "de-DE";
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log("Using voice:", selectedVoice.name, selectedVoice.lang);
      } else {
        console.log("No German voice found, using default");
      }
      
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Store reference to current utterance
      setCurrentUtterance(utterance);
      
      utterance.onstart = () => {
        console.log("Speech synthesis started");
        setSpeaking(true);
      };
      
      utterance.onend = () => {
        console.log("Speech synthesis ended");
        setSpeaking(false);
        setCurrentUtterance(null);
      };
      
      utterance.onerror = (event) => {
        // Handle different error types appropriately
        if (event.error === 'interrupted' || event.error === 'canceled') {
          // These are normal when user stops speech or speech is interrupted
          console.log("Speech synthesis stopped:", event.error);
          setSpeaking(false);
          setCurrentUtterance(null);
        } else {
          // These are actual errors that should be logged
          console.error("Speech synthesis error:", event.error, event);
          setSpeaking(false);
          setCurrentUtterance(null);
        }
      };

      // Add a small delay to ensure speech synthesis is ready
      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance);
        } catch (error) {
          console.error("Error starting speech synthesis:", error);
          setSpeaking(false);
        }
      }, 100);
      
    } catch (error) {
      console.error("Error creating speech utterance:", error);
      setSpeaking(false);
    }
  };

  const stop = () => {
    try {
      // Check if speech synthesis is available
      if (!("speechSynthesis" in window)) {
        console.warn("Speech synthesis not available");
        setSpeaking(false);
        setCurrentUtterance(null);
        return;
      }

      // Reset speaking state first to prevent UI issues
      setSpeaking(false);
      setCurrentUtterance(null);
      
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      console.log("Speech synthesis stopped");
    } catch (error) {
      console.error("Error stopping speech synthesis:", error);
      // Always reset the speaking state even if there's an error
      setSpeaking(false);
      setCurrentUtterance(null);
    }
  };

  return { speak, stop, speaking, isReady };
}
