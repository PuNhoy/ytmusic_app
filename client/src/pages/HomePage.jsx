import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Disc3 } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import SearchHistory from '../components/SearchHistory';
import VideoGrid from '../components/VideoGrid';
import { SkeletonGrid } from '../components/SkeletonCard';
import ErrorAlert from '../components/ErrorAlert';
import {
  searchSongs,
  getDbHistory,
  addDbHistory,
  removeDbHistoryItem,
  clearDbHistory,
} from '../utils/api';
import { useLocalStorage } from '../hooks/useLocalStorage';

const POPULAR_SUGGESTIONS = [
  'Lofi Hip Hop Chill',
  'Synthwave 80s Retro',
  'Acoustic Pop',
  'Deep House Chillout',
  'Rock Classics',
  'Ambient Study Beats',
];

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Search history state, synced with PostgreSQL & backed by localStorage
  const [localHistory, setLocalHistory] = useLocalStorage('beatstream_search_history', []);
  const [history, setHistory] = useState(localHistory);

  // Sync recent searches from PostgreSQL on load
  useEffect(() => {
    let isMounted = true;
    async function loadHistory() {
      try {
        const dbItems = await getDbHistory();
        if (isMounted && Array.isArray(dbItems) && dbItems.length > 0) {
          setHistory(dbItems);
          setLocalHistory(dbItems);
        }
      } catch (err) {
        // Fallback to local storage if DB is not yet initialized
        if (isMounted) setHistory(localHistory);
      }
    }
    loadHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  const executeSearch = async (searchTerm, pageToken = null) => {
    if (!searchTerm || !searchTerm.trim()) return;

    setError(null);
    if (!pageToken) {
      setIsLoading(true);
      setResults([]);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const data = await searchSongs(searchTerm, pageToken);

      if (pageToken) {
        setResults((prev) => [...prev, ...data.items]);
      } else {
        setResults(data.items || []);
        setHasSearched(true);

        // Update local search history
        const filtered = history.filter(
          (item) => item.toLowerCase() !== searchTerm.toLowerCase()
        );
        const updated = [searchTerm, ...filtered].slice(0, 10);
        setHistory(updated);
        setLocalHistory(updated);

        // Persist to PostgreSQL in background
        addDbHistory(searchTerm).catch(() => {});
      }

      setNextPageToken(data.nextPageToken || null);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleSearchSubmit = (searchTerm) => {
    setQuery(searchTerm);
    executeSearch(searchTerm, null);
  };

  const handleLoadMore = () => {
    if (nextPageToken && !isLoadingMore) {
      executeSearch(query, nextPageToken);
    }
  };

  const handleRemoveHistoryItem = (itemToRemove) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item !== itemToRemove);
      setLocalHistory(updated);
      return updated;
    });
    removeDbHistoryItem(itemToRemove).catch(() => {});
  };

  const handleClearHistory = () => {
    setHistory([]);
    setLocalHistory([]);
    clearDbHistory().catch(() => {});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Hero Search Section */}
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">
          Discover & Stream{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-emerald-300">
            Music
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto mb-6">
          Search millions of official songs and tracks on YouTube with high-fidelity playback.
        </p>

        {/* Search Bar */}
        <SearchBar
          onSearch={handleSearchSubmit}
          isLoading={isLoading}
          initialQuery={query}
        />

        {/* Search History Chips */}
        <SearchHistory
          history={history}
          onSelectSearch={handleSearchSubmit}
          onRemoveItem={handleRemoveHistoryItem}
          onClearAll={handleClearHistory}
        />
      </div>

      {/* Error Alert Display */}
      {error && (
        <ErrorAlert
          error={error}
          onRetry={() => executeSearch(query || 'Lofi Beats', nextPageToken)}
        />
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="mt-8">
          <SkeletonGrid count={8} />
        </div>
      )}

      {/* Search Results Display */}
      {!isLoading && results.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Disc3 className="w-5 h-5 text-brand-400 animate-spin [animation-duration:8s]" />
              Results for &ldquo;<span className="text-brand-300">{query}</span>&rdquo;
            </h2>
            <span className="text-xs text-slate-400">
              Showing {results.length} tracks
            </span>
          </div>

          <VideoGrid songs={results} />

          {/* Load More Pagination Button */}
          {nextPageToken && (
            <div className="mt-10 flex justify-center pb-8">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-sm font-semibold text-slate-200 transition-all flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                    Loading more tracks...
                  </>
                ) : (
                  'Load More Songs'
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* No Results Found State */}
      {!isLoading && hasSearched && results.length === 0 && !error && (
        <div className="text-center py-16 px-4 bg-slate-900/40 rounded-3xl border border-slate-800/80 max-w-xl mx-auto mt-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Disc3 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No songs found</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto mb-6">
            We couldn't find any embeddable music matching &ldquo;{query}&rdquo;. Try another song, artist, or genre.
          </p>
        </div>
      )}

      {/* Empty State / Suggested Music exploration */}
      {!hasSearched && !isLoading && !error && (
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            Trending exploration queries
          </div>

          <div className="flex flex-wrap justify-center gap-2.5 max-w-2xl mx-auto">
            {POPULAR_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSearchSubmit(suggestion)}
                className="px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-brand-500/40 text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-all shadow-sm active:scale-95"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
