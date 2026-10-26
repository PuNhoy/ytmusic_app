import React, { useState, useEffect } from 'react';
import { Search, X, Loader2, Mic, RotateCcw, Sparkles } from 'lucide-react';
import { useVoiceSearch, SUPPORTED_VOICE_LANGUAGES } from '../hooks/useVoiceSearch';

export default function SearchBar({ onSearch, isLoading, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [inputError, setInputError] = useState('');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Voice Search Hook with multi-language (Khmer km-KH & English en-US)
  const {
    isSupported,
    isListening,
    transcript,
    error: voiceError,
    errorCode,
    currentLang,
    setLanguage,
    startListening,
    stopListening,
    clearError,
  } = useVoiceSearch({
    onResult: (spokenText) => {
      setQuery(spokenText);
      setInputError('');
      setIsVoiceModalOpen(false);
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
    setIsVoiceModalOpen(false);

    const trimmed = query.trim();
    if (!trimmed) {
      setInputError(
        currentLang === 'km-KH'
          ? 'សូមបញ្ចូល ឬនិយាយឈ្មោះបទចម្រៀង ឬតារាចម្រៀង'
          : 'Please enter or speak an artist, song title, or genre.'
      );
      return;
    }
    setInputError('');
    onSearch(trimmed);
  };

  const handleClear = () => {
    setQuery('');
    setInputError('');
    if (isListening) stopListening();
    setIsVoiceModalOpen(false);
  };

  const handleOpenVoice = (lang = null) => {
    setInputError('');
    clearError();
    setIsVoiceModalOpen(true);
    startListening(lang || currentLang);
  };

  const handleCloseVoice = () => {
    stopListening();
    setIsVoiceModalOpen(false);
  };

  const isKhmer = currentLang === 'km-KH';

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

        {/* Bilingual Search Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (inputError) setInputError('');
          }}
          placeholder="Search in English or ភាសាខ្មែរ (Type or Voice)..."
          className={`w-full pl-10 sm:pl-12 pr-40 sm:pr-48 py-3 sm:py-3.5 bg-slate-900/90 border rounded-2xl text-slate-100 placeholder-slate-400 text-xs sm:text-base shadow-lg transition-all duration-200 outline-none focus:ring-2 ${
            isListening
              ? 'border-red-500/80 ring-2 ring-red-500/20 bg-slate-900'
              : inputError
              ? 'border-red-500 focus:ring-red-500/20'
              : 'border-slate-800 focus:border-brand-500 focus:ring-brand-500/20'
          }`}
        />

        {/* Right Action Cluster: Clear, Bilingual Toggle, Mic, Search */}
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

          {/* Dual Language Switcher: 🇰🇭 ខ្មែរ & 🇺🇸 EN */}
          <div className="flex items-center bg-slate-950/80 rounded-lg p-0.5 border border-slate-700/60 shadow-inner">
            <button
              type="button"
              onClick={() => setLanguage('km-KH', isListening)}
              className={`px-1.5 sm:px-2 py-1 rounded-md text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 ${
                isKhmer
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="ស្វែងរកជាភាសាខ្មែរ (Khmer Voice Search)"
            >
              <span>🇰🇭</span>
              <span className="hidden sm:inline">ខ្មែរ</span>
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en-US', isListening)}
              className={`px-1.5 sm:px-2 py-1 rounded-md text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 ${
                !isKhmer
                  ? 'bg-brand-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Search in English (English Voice Search)"
            >
              <span>🇺🇸</span>
              <span className="hidden sm:inline">EN</span>
            </button>
          </div>

          {/* Voice Search Microphone Button */}
          <button
            type="button"
            onClick={() => (isVoiceModalOpen ? handleCloseVoice() : handleOpenVoice())}
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
                : 'Search by voice (English & ភាសាខ្មែរ)'
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
            className="px-2.5 sm:px-4 py-2 sm:py-2.5 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow transition-all duration-150 flex items-center gap-1 active:scale-95"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Search className="w-3.5 h-3.5 sm:hidden" />
                <span className="hidden sm:inline">Search</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Input validation notice */}
      {inputError && (
        <p className="mt-2 text-xs text-red-400 pl-4 animate-fadeIn">{inputError}</p>
      )}

      {/* Voice Recognition Error Notice (when modal closed) */}
      {voiceError && !isVoiceModalOpen && (
        <div className="mt-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center justify-between animate-fadeIn">
          <span>{voiceError}</span>
          <button onClick={clearError} className="text-amber-400 hover:text-white p-0.5 ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Full-Screen Interactive Voice Search Modal */}
      {isVoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm sm:max-w-md bg-slate-900/95 border border-slate-700/80 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative flex flex-col items-center">
            {/* Close / Cancel Button */}
            <button
              onClick={handleCloseVoice}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              title="Close voice search"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Prominent Bilingual Selector: Switch between Khmer and English anytime */}
            <div className="flex items-center justify-center p-1 bg-slate-950/90 rounded-2xl border border-slate-800 mb-5 gap-1.5">
              {SUPPORTED_VOICE_LANGUAGES.map((lang) => {
                const isActive = currentLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLanguage(lang.code, true)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-500 to-emerald-400 text-slate-950 shadow-md font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="text-base">{lang.flag}</span>
                    <span>{lang.name}</span>
                    <span
                      className={`text-[10px] hidden sm:inline ${
                        isActive ? 'text-slate-950/80 font-bold' : 'text-slate-500'
                      }`}
                    >
                      ({lang.subtitle})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Glowing Pulsing Animated Microphone */}
            <div className="relative mb-4">
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-xl relative border-2 ${
                  isListening
                    ? 'bg-red-500/20 border-red-500 shadow-red-500/30'
                    : 'bg-slate-800/50 border-slate-700 shadow-slate-900'
                }`}
              >
                {isListening && (
                  <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
                )}
                <Mic
                  className={`w-8 h-8 sm:w-10 sm:h-10 ${
                    isListening ? 'text-red-400 animate-pulse' : 'text-slate-400'
                  }`}
                />
              </div>
            </div>

            {/* Sound Wave Equalizer Simulation */}
            {isListening ? (
              <div className="flex items-center justify-center gap-1.5 h-8 mb-3">
                <span className="w-1.5 bg-red-400 rounded-full animate-bounce [animation-delay:-0.4s] h-4" />
                <span className="w-1.5 bg-red-400 rounded-full animate-bounce [animation-delay:-0.2s] h-7" />
                <span className="w-1.5 bg-red-400 rounded-full animate-bounce [animation-delay:-0.3s] h-5" />
                <span className="w-1.5 bg-red-400 rounded-full animate-bounce [animation-delay:-0.1s] h-8" />
                <span className="w-1.5 bg-red-400 rounded-full animate-bounce [animation-delay:-0.25s] h-6" />
                <span className="w-1.5 bg-red-400 rounded-full animate-bounce [animation-delay:-0.35s] h-3" />
              </div>
            ) : (
              <div className="h-8 mb-3 flex items-center justify-center">
                <span className="text-xs text-slate-500">Microphone paused</span>
              </div>
            )}

            {/* Status Headings */}
            <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
              {isKhmer ? 'កំពុងស្តាប់ជាភាសាខ្មែរ...' : 'Listening in English...'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {isKhmer
                ? 'សូមនិយាយឈ្មោះបទចម្រៀង ឬតារាចម្រៀង (ឬចុច 🇺🇸 English ដើម្បីប្តូរ)'
                : 'Speak the song name or artist (or tap 🇰🇭 ភាសាខ្មែរ to switch)'}
            </p>

            {/* Live Transcript Display */}
            <div className="w-full min-h-[56px] px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-center mb-4">
              <p className="text-sm sm:text-base font-semibold text-brand-300 italic truncate max-w-full">
                {transcript
                  ? `“${transcript}”`
                  : isKhmer
                  ? 'សូមនិយាយ... ឧទាហរណ៍៖ "វណ្ណដា Time to Rise"'
                  : 'Say something like "Ed Sheeran Shape of You"...'}
              </p>
            </div>

            {/* Smart Bilingual Retry / Switch Prompt on No-Speech */}
            {errorCode === 'no-speech' && (
              <div className="w-full mb-4 p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-center animate-fadeIn">
                <p className="text-xs text-amber-200 mb-2">
                  {isKhmer
                    ? 'មិនបានឮសំឡេងទេ។ តើអ្នកបាននិយាយជាភាសាអង់គ្លេសមែនទេ?'
                    : "Didn't hear any speech. Did you want to speak in Khmer?"}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLanguage(isKhmer ? 'en-US' : 'km-KH', true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1 shadow-sm"
                  >
                    <span>{isKhmer ? '🇺🇸 និយាយជា English' : '🇰🇭 និយាយជាភាសាខ្មែរ'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => startListening(currentLang)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isKhmer ? 'ម្តងទៀត' : 'Try Again'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bilingual Popular Suggestions */}
            <div className="mb-5 w-full">
              <p className="text-[11px] text-slate-400 mb-2">
                {isKhmer
                  ? 'គន្លឹះ ឬចុចឈ្មោះបទចម្រៀងដើម្បីស្វែងរកភ្លាមៗ៖'
                  : 'Tap any suggestion to search instantly:'}
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {[
                  '🇰🇭 វណ្ណដា Time to Rise',
                  '🇰🇭 ព្រាប សុវត្ថិ',
                  '🇰🇭 ខេម',
                  '🇺🇸 Shape of You',
                  '🇺🇸 Coldplay Yellow',
                  '🇺🇸 Adele',
                ].map((suggestion) => {
                  const cleanedText = suggestion.replace(/^[🇰🇭🇺🇸\s]+/, '');
                  return (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        onSearch(cleanedText);
                        handleCloseVoice();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 hover:text-white border border-slate-700/60 transition"
                    >
                      {suggestion}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions: Cancel & Search Now */}
            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={handleCloseVoice}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm transition"
              >
                {isKhmer ? 'បោះបង់' : 'Cancel'}
              </button>
              {transcript && (
                <button
                  type="button"
                  onClick={() => {
                    const clean = transcript.trim();
                    if (clean) {
                      onSearch(clean);
                      handleCloseVoice();
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-brand-500/20 transition active:scale-95"
                >
                  {isKhmer ? 'ស្វែងរកឥឡូវនេះ' : 'Search Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}