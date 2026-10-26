import { useState, useRef, useEffect, useCallback } from 'react';

export const SUPPORTED_VOICE_LANGUAGES = [
  { code: 'km-KH', name: 'ភាសាខ្មែរ', subtitle: 'Khmer', flag: '🇰🇭' },
  { code: 'en-US', name: 'English', subtitle: 'US', flag: '🇺🇸' },
];

/**
 * Custom hook for Web Speech API Voice Search with multi-language (Khmer km-KH & English) support.
 */
export function useVoiceSearch({ onResult, onError } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);

  // Default to Khmer 'km-KH' or user's saved preference
  const [currentLang, setCurrentLangState] = useState(() => {
    return localStorage.getItem('beatstream_voice_lang') || 'km-KH';
  });

  const recognitionRef = useRef(null);
  const currentLangRef = useRef(currentLang);
  currentLangRef.current = currentLang;

  // Check if browser supports Web Speech API
  const isSupported =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {}
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(
    (overrideLang = null) => {
      const activeLang = overrideLang || currentLangRef.current || 'km-KH';

      if (!isSupported) {
        const msg =
          activeLang === 'km-KH'
            ? 'មុខងារស្វែងរកដោយសំឡេងមិនទាន់គាំទ្រលើ browser នេះទេ។ សូមប្រើ Google Chrome ឬ Edge។'
            : 'Voice search is not supported in this browser. Please use Chrome, Edge, or Safari.';
        setError(msg);
        setErrorCode('not-supported');
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
      setErrorCode(null);
      setTranscript('');

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      // Set language to Khmer (km-KH) or English (en-US)
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = activeLang;
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        setErrorCode(null);
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
        let message = '';
        const isKm = activeLang === 'km-KH';
        setErrorCode(event.error);

        if (event.error === 'not-allowed') {
          message = isKm
            ? 'សូមអនុញ្ញាតសិទ្ធិប្រើ Microphone នៅក្នុង browser របស់អ្នកដើម្បីនិយាយ។'
            : 'Microphone access denied. Please allow microphone permission in your browser settings.';
        } else if (event.error === 'no-speech') {
          message = isKm
            ? 'មិនបានឮសំឡេងទេ។ តើអ្នកចង់និយាយជាភាសាអង់គ្លេសវិញទេ?'
            : 'No speech detected. Did you want to speak in Khmer instead?';
        } else if (event.error === 'network') {
          message = isKm
            ? 'មានបញ្ហាភ្ជាប់បណ្តាញពេលស្តាប់សំឡេង។'
            : 'Network error during speech recognition.';
        } else {
          message = isKm
            ? `មានបញ្ហាក្នុងការចាប់សំឡេង (${event.error})`
            : `Voice recognition error (${event.error})`;
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
    },
    [isSupported, onError, onResult, stopListening]
  );

  const setLanguage = useCallback(
    (langCode, autoRestart = true) => {
      setCurrentLangState(langCode);
      currentLangRef.current = langCode;
      localStorage.setItem('beatstream_voice_lang', langCode);

      if (autoRestart) {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch (e) {}
        }
        setTimeout(() => {
          startListening(langCode);
        }, 120);
      }
    },
    [startListening]
  );

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
    errorCode,
    currentLang,
    setLanguage,
    startListening,
    stopListening,
    clearError: () => {
      setError(null);
      setErrorCode(null);
    },
  };
}
