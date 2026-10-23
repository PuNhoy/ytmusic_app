import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Play, Trash2, Music, Sparkles } from 'lucide-react';
import VideoGrid from '../components/VideoGrid';
import { useFavorites } from '../context/FavoritesContext';
import { usePlayer } from '../context/PlayerContext';

export default function FavoritesPage() {
  const { favorites, clearFavorites } = useFavorites();
  const { playSong } = usePlayer();

  const handlePlayAll = () => {
    if (favorites.length > 0) {
      playSong(favorites[0], favorites, 0);
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to remove all favorite songs?')) {
      clearFavorites();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-8">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Favorite Songs
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                {favorites.length} {favorites.length === 1 ? 'track' : 'tracks'} saved to your device
              </p>
            </div>
          </div>
        </div>

        {favorites.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-semibold text-xs sm:text-sm shadow-lg shadow-brand-500/20 transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              Play All
            </button>

            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-red-500/20 border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-300 font-medium text-xs sm:text-sm transition-all active:scale-95"
              title="Clear all favorites"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Favorites List or Empty State */}
      {favorites.length > 0 ? (
        <VideoGrid songs={favorites} />
      ) : (
        <div className="text-center py-20 px-4 bg-slate-900/40 rounded-3xl border border-slate-800/80 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto mb-4 text-slate-500">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No favorite songs yet</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto mb-6">
            When you find songs you love, click the heart icon on any track card to save them here.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 text-xs sm:text-sm font-semibold shadow-lg shadow-brand-500/20 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            Discover Music
          </Link>
        </div>
      )}
    </div>
  );
}
