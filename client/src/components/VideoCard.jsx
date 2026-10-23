import React from 'react';
import { Play, Pause, Heart, ListPlus, Volume2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useFavorites } from '../context/FavoritesContext';
import { decodeHtml } from '../utils/formatters';

export default function VideoCard({ song, queueList, index }) {
  const { currentSong, isPlaying, playSong, togglePlay, addToQueue } = usePlayer();
  const { isFavorite, toggleFavorite } = useFavorites();

  const isCurrent = currentSong?.videoId === song.videoId;
  const favorited = isFavorite(song.videoId);

  const handleCardClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playSong(song, queueList, index);
    }
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    toggleFavorite(song);
  };

  const handleAddToQueue = (e) => {
    e.stopPropagation();
    addToQueue(song);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative bg-slate-900/60 hover:bg-slate-800/80 border rounded-2xl p-3 transition-all duration-300 cursor-pointer flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 ${
        isCurrent
          ? 'border-brand-500/50 ring-1 ring-brand-500/30 bg-slate-800/90'
          : 'border-slate-800/80 hover:border-slate-700'
      }`}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 mb-3 shadow-inner">
        <img
          src={song.thumbnail}
          alt={song.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Duration Badge */}
        {song.duration && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[11px] font-semibold text-white tracking-wide">
            {song.duration}
          </div>
        )}

        {/* Hover / Active Play Button Overlay */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-200 ${
            isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-brand-500 text-slate-950 flex items-center justify-center shadow-lg shadow-brand-500/30 transform group-hover:scale-110 active:scale-95 transition-all">
            {isCurrent && isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </div>
        </div>

        {/* Now Playing Animated Equalizer Bar */}
        {isCurrent && isPlaying && (
          <div className="absolute top-2 left-2 flex items-end gap-1 px-2 py-1 rounded bg-black/70 backdrop-blur-sm">
            <span className="w-1 h-3.5 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1 h-4 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1 h-2.5 bg-brand-400 rounded-full animate-bounce"></span>
          </div>
        )}
      </div>

      {/* Song Info */}
      <div className="flex flex-col flex-grow">
        <h3
          className={`text-sm font-semibold line-clamp-2 transition-colors mb-1 ${
            isCurrent ? 'text-brand-400' : 'text-slate-100 group-hover:text-white'
          }`}
          title={decodeHtml(song.title)}
        >
          {decodeHtml(song.title)}
        </h3>

        <p
          className="text-xs text-slate-400 group-hover:text-slate-300 line-clamp-1 mb-2"
          title={decodeHtml(song.channel)}
        >
          {decodeHtml(song.channel)}
        </p>
      </div>

      {/* Card Actions Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-auto">
        {/* Favorite Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={`p-1.5 rounded-lg transition-all ${
            favorited
              ? 'text-red-500 hover:text-red-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title={favorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`w-4 h-4 ${favorited ? 'fill-red-500' : ''}`}
          />
        </button>

        {/* Add to Queue Button */}
        <button
          type="button"
          onClick={handleAddToQueue}
          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-slate-700/50 transition-all flex items-center gap-1 text-xs"
          title="Add to queue"
        >
          <ListPlus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
