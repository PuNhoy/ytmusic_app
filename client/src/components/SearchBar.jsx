import React, { useState, useEffect } from 'react';
import { Search, X, Loader2, Mic, MicOff, Volume2, Sparkles } from 'lucide-react';
import { useVoiceSearch } from '../hooks/useVoiceSearch';

export default function SearchBar({ onSearch, isLoading, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [inputError, setInputError] = useState('');

  // Voice Search Hook
  const {
    isSupported,
    isListening,
    transcript,
    error: voiceError,
    startListening,
    stopListening,
    clearError,
  } = useVoiceSearch({
    onResult: (spokenText) => {
      setQuery(spokenText);
      setInputError('');
      onSearch(spokenText);
    },
  });

  // Keep query in sync with interim transcript while speaking
  useEffect(() => {
    if (isListening && transcript) {
      setQuery(transcript);
    }
  }, [isListening, transcript]);

  // Keep local query updated if initialQuery changes from outside (e.g. clicking a history chip)
  useEffect(() => {
    if (initialQuery !== undefined) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isListening) stopListening();

    const trimmed = query.trim();
    if (!trimmed) {
      setInputError('Please enter or speak an artist, song title, or genre.');
      return;
    }
    setInputError('');
    onSearch(trimmed);
  };

  const handleClear = () => {
    setQuery('');
    setInputError('');
    if (isListening) stopListening();
  };

  const handleMicClick = () => {
    setInputError('');
    clearError();
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-0">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        {/* Left Search Icon */}
        <div className="absolute left-3.5 sm:left-4 pointer-events-none text-slate-400">
          {isLoading ? (
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-brand-500" />
          ) : (
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </div>

        {/* Search Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (inputError) setInputError('');
          }}
          placeholder="Search songs, artists, or speak..."
          className={`w-full pl-10 sm:pl-12 pr-28 sm:pr-32 py-3 sm:py-3.5 bg-slate-900/90 border rounded-2xl text-slate-100 placeholder-slate-400 text-xs sm:text-base shadow-lg transition-all duration-200 outline-none focus:ring-2 ${
            isListening
              ? 'border-red-500/80 ring-2 ring-red-500/20 bg-slate-900'
              : inputError
              ? 'border-red-500 focus:ring-red-500/20'
              : 'border-slate-800 focus:border-brand-500 focus:ring-brand-500/20'
          }`}
        />

        {/* Right Icons: Clear & Voice Search Mic & Search Button */}
        <div className="absolute right-1.5 sm:right-2 flex items-center gap-1 sm:gap-1.5">
          {/* Clear Text Button */}
          {query && !isListening && (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-200 p-1 sm:p-1.5 rounded-lg hover:bg-slate-800 transition"
              title="Clear input"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          {/* Voice Search Microphone Button */}
          <button
            type="button"
            onClick={handleMicClick}
            className={`p-2 sm:p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center relative active:scale-90 ${
              isListening
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse'
                : 'text-slate-400 hover:text-brand-400 hover:bg-slate-800/80'
            }`}
            title={
              !isSupported
                ? 'Voice search is not supported in this browser'
                : isListening
                ? 'Listening... Click to stop'
                : 'Search by voice'
            }
          >
            {isListening ? (
              <>
                <span className="absolute inset-0 rounded-xl bg-red-500 animate-ping opacity-40 pointer-events-none" />
                <Mic className="w-4 h-4 sm:w-4.5 sm:h-4.5 animate-bounce" />
              </>
            ) : (
              <Mic className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            )}
          </button>

          {/* Submit Search Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow transition-all duration-150 flex items-center gap-1 active:scale-95"
          >
            {isLoading ? '...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Input validation notice */}
      {inputError && (
        <p className="mt-2 text-xs text-red-400 pl-4 animate-fadeIn">{inputError}</p>
      )}

      {/* Voice Recognition Error Notice */}
      {voiceError && (
        <div className="mt-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center justify-between animate-fadeIn">
          <span>{voiceError}</span>
          <button onClick={clearError} className="text-amber-400 hover:text-white p-0.5 ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Full-Screen Interactive Voice Search Listening Overlay */}
      {isListening && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm bg-slate-900/95 border border-red-500/30 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative flex flex-col items-center">
            {/* Close / Cancel Button */}
            <button
              onClick={stopListening}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              title="Cancel voice search"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing Pulsing Animated Microphone */}
            <div className="relative mb-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center shadow-xl shadow-red-500/30 relative">
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
                <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-red-400 animate-pulse" />
              </div>
            </div>

            {/* Sound Wave Equalizer Simulation */}
            <div className="flex items-center justify-center gap-1.5 h-8 mb-4">
              <span className="w-1.5 bg-red-400 rounded-full animate-bounce [animation-delay:-0.4s] h-4" />
              <span className="w-1.5 bg-red-400 rounded-full animate-bounce [animation-delay:-0.2s] h-7" />
              <span className="w-1.5 bg-red-400 rounded-full animate-bounce [animation-delay:-0.3s] h-5" />
              <span className="w-1.5 bg-red-400 rounded-full animate-bounce [animation-delay:-0.1s] h-8" />
              <span className="w-1.5 bg-red-400 rounded-full animate-bounce [animation-delay:-0.25s] h-6" />
              <span className="w-1.5 bg-red-400 rounded-full animate-bounce [animation-delay:-0.35s] h-3" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">Listening...</h3>
            <p className="text-xs text-slate-400 mb-4">
              Speak the song name, artist, or genre clearly
            </p>

            {/* Live Transcript Display */}
            <div className="w-full min-h-[52px] px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-center mb-6">
              <p className="text-sm font-semibold text-brand-300 italic truncate">
                {transcript ? `“${transcript}”` : 'Say something like "Ed Sheeran Shape of You"...'}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={stopListening}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm transition"
              >
                Cancel
              </button>
              {transcript && (
                <button
                  type="button"
                  onClick={() => {
                    const clean = transcript.trim();
                    if (clean) {
                      onSearch(clean);
                      stopListening();
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-brand-500/20 transition active:scale-95"
                >
                  Search Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
