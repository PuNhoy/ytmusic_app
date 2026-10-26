import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook for Web Speech API Voice Search
 * Supports Chrome, Edge, Safari, and other modern browsers.
 */
export function useVoiceSearch({ onResult, onError } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  // Check if browser supports Web Speech API
  const isSupported =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // Ignore stop error
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      const msg = 'Voice search is not supported in this browser. Please use Chrome, Edge, or Safari.';
      setError(msg);
      if (onError) onError(msg);
      return;
    }

    // Stop any existing instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    setError(null);
    setTranscript('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // Configuration
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          final += item[0].transcript;
        } else {
          interim += item[0].transcript;
        }
      }

      const current = final || interim;
      setTranscript(current);

      if (final && final.trim()) {
        const cleaned = final.trim();
        if (onResult) onResult(cleaned);
        stopListening();
      }
    };

    recognition.onerror = (event) => {
      let message = 'Voice recognition error.';
      if (event.error === 'not-allowed') {
        message = 'Microphone access denied. Please allow microphone permission in your browser settings.';
      } else if (event.error === 'no-speech') {
        message = 'No speech detected. Please speak closer to your microphone.';
      } else if (event.error === 'network') {
        message = 'Network error during speech recognition.';
      }

      setError(message);
      setIsListening(false);
      if (onError) onError(message);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start error:', err);
      setIsListening(false);
    }
  }, [isSupported, onError, onResult, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    clearError: () => setError(null),
  };
}
