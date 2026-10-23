import React, { useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

export default function SearchBar({ onSearch, isLoading, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [inputError, setInputError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setInputError('Please enter an artist, song title, or genre.');
      return;
    }
    setInputError('');
    onSearch(trimmed);
  };

  const handleClear = () => {
    setQuery('');
    setInputError('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        {/* Left Search Icon */}
        <div className="absolute left-4 pointer-events-none text-slate-400">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
          ) : (
            <Search className="w-5 h-5" />
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
          placeholder="Search for songs, artists, or albums on YouTube..."
          className={`w-full pl-12 pr-28 py-3.5 bg-slate-900/90 border rounded-2xl text-slate-100 placeholder-slate-400 text-sm sm:text-base shadow-lg transition-all duration-200 outline-none focus:ring-2 ${
            inputError
              ? 'border-red-500 focus:ring-red-500/20'
              : 'border-slate-800 focus:border-brand-500 focus:ring-brand-500/20'
          }`}
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-20 text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
            title="Clear search input"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="absolute right-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 text-slate-950 font-semibold rounded-xl text-xs sm:text-sm shadow transition-all duration-150 flex items-center gap-1.5 active:scale-95"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Input validation notice */}
      {inputError && (
        <p className="mt-2 text-xs text-red-400 pl-4 animate-fadeIn">{inputError}</p>
      )}
    </div>
  );
}
