import React, { useState, useEffect } from 'react';
import YouTube from 'react-youtube';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  Volume1,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  ListMusic,
  Tv,
  ChevronDown,
  X,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useFavorites } from '../context/FavoritesContext';
import { formatTime, decodeHtml } from '../utils/formatters';

export default function PlayerBar() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    queue,
    queueIndex,
    isShuffle,
    repeatMode,
    playerError,
    isBuffering,
    showVideoModal,
    setShowVideoModal,
    togglePlay,
    pauseSong,
    stopSong,
    playNext,
    playPrevious,
    seekTo,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    removeFromQueue,
    playSong,
    handlePlayerReady,
    handlePlayerStateChange,
    handlePlayerError,
    isSeekingRef,
  } = usePlayer();

  const { isFavorite, toggleFavorite } = useFavorites();
  const [showQueue, setShowQueue] = useState(false);
  const [tempSeek, setTempSeek] = useState(null);

  // Keyboard shortcut: Spacebar to toggle Play/Pause (when not typing in an input)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay]);

  if (!currentSong) return null;

  const favorited = isFavorite(currentSong.videoId);
  const displayTime = tempSeek !== null ? tempSeek : currentTime;
  const seekPercentage = duration > 0 ? (displayTime / duration) * 100 : 0;
  const volumePercentage = isMuted ? 0 : volume;

  // Single YouTube player configuration options
  const playerOptions = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 1,
      modestbranding: 1,
      rel: 0,
      origin: typeof window !== 'undefined' ? window.location.origin : '',
    },
  };

  const handleSeekChange = (e) => {
    isSeekingRef.current = true;
    setTempSeek(Number(e.target.value));
  };

  const handleSeekCommit = (e) => {
    const targetSeconds = Number(e.target.value);
    seekTo(targetSeconds);
    setTempSeek(null);
    isSeekingRef.current = false;
  };

  return (
    <>
      {/* 1. EXACTLY ONE Official YouTube IFrame Player instance */}
      {/* Kept mounted at all times to prevent audio desync or duplicate players */}
      <div
        className={`fixed z-50 transition-all duration-300 ${
          showVideoModal
            ? 'bottom-24 right-4 sm:right-8 w-72 sm:w-96 aspect-video bg-black rounded-2xl border border-slate-700 overflow-hidden shadow-2xl pointer-events-auto opacity-100 scale-100'
            : 'fixed -bottom-[3000px] -left-[3000px] w-80 h-48 opacity-0 pointer-events-none scale-0'
        }`}
      >
        <div className="relative w-full h-full bg-black flex items-center justify-center">
          <YouTube
            videoId={currentSong.videoId}
            opts={playerOptions}
            onReady={handlePlayerReady}
            onStateChange={handlePlayerStateChange}
            onError={handlePlayerError}
            className="w-full h-full"
          />
          {showVideoModal && (
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white text-xs backdrop-blur-sm transition z-10"
              title="Minimize video window"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Skip / Unembeddable Error Toast Notification */}
      {playerError && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-amber-950/90 border border-amber-500/40 text-amber-200 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium shadow-2xl flex items-center gap-2 backdrop-blur-md animate-bounce">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{playerError}</span>
        </div>
      )}

      {/* 3. Up Next Queue Flyout Drawer */}
      {showQueue && (
        <div className="fixed bottom-24 right-4 sm:right-8 w-80 sm:w-96 max-h-[28rem] bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl z-40 backdrop-blur-xl flex flex-col overflow-hidden animate-fadeIn">
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-brand-400" />
              <h4 className="text-sm font-semibold text-white">Up Next ({queue.length})</h4>
            </div>
            <button
              onClick={() => setShowQueue(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-y-auto p-2 divide-y divide-slate-800/40">
            {queue.map((song, idx) => {
              const isItemPlaying = idx === queueIndex;
              return (
                <div
                  key={`${song.videoId}-${idx}`}
                  onClick={() => playSong(song, queue, idx)}
                  className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer group transition-colors ${
                    isItemPlaying
                      ? 'bg-brand-500/10 border border-brand-500/20 text-brand-300'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <img
                    src={song.thumbnail}
                    alt=""
                    className="w-10 h-10 object-cover rounded-lg shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{decodeHtml(song.title)}</p>
                    <p className="text-[11px] text-slate-500 truncate">{decodeHtml(song.channel)}</p>
                  </div>
                  {isItemPlaying && (
                    <span className="text-[10px] font-semibold text-brand-400 px-1.5 py-0.5 rounded bg-brand-500/20">
                      Now
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromQueue(idx);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 rounded transition"
                    title="Remove from queue"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Sticky Bottom Player Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 shadow-2xl px-4 py-2.5 sm:py-3 select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Track Information */}
          <div className="flex items-center gap-3 w-1/4 min-w-[160px] sm:min-w-[220px]">
            <div
              onClick={() => setShowVideoModal((prev) => !prev)}
              className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-900 shrink-0 cursor-pointer group shadow"
              title="Click to view video"
            >
              <img
                src={currentSong.thumbnail}
                alt={currentSong.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Tv className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h4
                className="text-xs sm:text-sm font-semibold text-white truncate"
                title={decodeHtml(currentSong.title)}
              >
                {decodeHtml(currentSong.title)}
              </h4>
              <p
                className="text-[11px] sm:text-xs text-slate-400 truncate"
                title={decodeHtml(currentSong.channel)}
              >
                {decodeHtml(currentSong.channel)}
              </p>
            </div>

            <button
              onClick={() => toggleFavorite(currentSong)}
              className={`p-1.5 rounded-lg transition-colors hidden sm:block ${
                favorited ? 'text-red-500' : 'text-slate-400 hover:text-white'
              }`}
              title={favorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Center: Controls & Scrubber */}
          <div className="flex flex-col items-center gap-1.5 flex-1 max-w-xl">
            {/* Control Buttons */}
            <div className="flex items-center gap-3 sm:gap-5">
              {/* Shuffle */}
              <button
                onClick={toggleShuffle}
                className={`p-1.5 rounded-lg transition-colors hidden sm:block ${
                  isShuffle ? 'text-brand-400 bg-brand-500/10' : 'text-slate-400 hover:text-white'
                }`}
                title={`Shuffle ${isShuffle ? 'On' : 'Off'}`}
              >
                <Shuffle className="w-4 h-4" />
              </button>

              {/* Previous */}
              <button
                onClick={playPrevious}
                className="p-1.5 text-slate-300 hover:text-white transition-colors active:scale-90"
                title="Previous track"
              >
                <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              </button>

              {/* Play / Pause / Stop Primary Button */}
              <button
                onClick={togglePlay}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-brand-500 hover:bg-brand-400 text-slate-950 flex items-center justify-center shadow-lg shadow-brand-500/20 active:scale-95 transition-all"
                title={isPlaying ? 'Pause / Stop (Space)' : 'Play (Space)'}
              >
                {isBuffering && !isPlaying ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              {/* Stop Button */}
              <button
                onClick={stopSong}
                className="p-1.5 text-slate-400 hover:text-red-400 transition-colors active:scale-90 hidden sm:block"
                title="Stop track"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>

              {/* Next */}
              <button
                onClick={playNext}
                className="p-1.5 text-slate-300 hover:text-white transition-colors active:scale-90"
                title="Next track"
              >
                <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              </button>

              {/* Repeat */}
              <button
                onClick={cycleRepeat}
                className={`p-1.5 rounded-lg transition-colors hidden sm:block ${
                  repeatMode !== 'off'
                    ? 'text-brand-400 bg-brand-500/10'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={`Repeat: ${repeatMode}`}
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-4 h-4" />
                ) : (
                  <Repeat className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Scrubber / Progress Bar */}
            <div className="w-full flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span className="w-9 text-right">{formatTime(displayTime)}</span>

              <div className="relative flex-1 group flex items-center">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={displayTime}
                  onChange={handleSeekChange}
                  onMouseUp={handleSeekCommit}
                  onTouchEnd={handleSeekCommit}
                  style={{
                    background: `linear-gradient(to right, #22c55e ${seekPercentage}%, #334155 ${seekPercentage}%)`,
                  }}
                  className="w-full h-1 group-hover:h-1.5 rounded-full outline-none transition-all"
                />
              </div>

              <span className="w-9 text-left">
                {duration > 0 ? formatTime(duration) : currentSong.duration || '0:00'}
              </span>
            </div>
          </div>

          {/* Right: Volume, Queue & Video Popout */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 w-1/4 min-w-[120px] sm:min-w-[180px]">
            {/* Toggle Video PIP */}
            <button
              onClick={() => setShowVideoModal((prev) => !prev)}
              className={`p-2 rounded-lg transition-colors ${
                showVideoModal ? 'text-brand-400 bg-brand-500/10' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle video window"
            >
              <Tv className="w-4 h-4" />
            </button>

            {/* Toggle Queue */}
            <button
              onClick={() => setShowQueue((prev) => !prev)}
              className={`relative p-2 rounded-lg transition-colors ${
                showQueue ? 'text-brand-400 bg-brand-500/10' : 'text-slate-400 hover:text-white'
              }`}
              title="Show queue"
            >
              <ListMusic className="w-4 h-4" />
              {queue.length > 1 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-500" />
              )}
            </button>

            {/* Volume Control */}
            <div className="hidden md:flex items-center gap-2 group">
              <button
                onClick={toggleMute}
                className="text-slate-400 hover:text-white transition-colors p-1"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : volume < 50 ? (
                  <Volume1 className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              <input
                type="range"
                min={0}
                max={100}
                value={volumePercentage}
                onChange={(e) => setVolume(e.target.value)}
                style={{
                  background: `linear-gradient(to right, #22c55e ${volumePercentage}%, #334155 ${volumePercentage}%)`,
                }}
                className="w-16 lg:w-24 h-1 group-hover:h-1.5 rounded-full outline-none transition-all"
                title={`Volume: ${isMuted ? '0' : volume}%`}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
