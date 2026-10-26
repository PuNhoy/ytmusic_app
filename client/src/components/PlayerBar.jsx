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
  ChevronUp,
  X,
  AlertTriangle,
  Loader2,
  Maximize2,
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
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

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
      {/* 1. Single Official YouTube IFrame Player instance */}
      <div
        className={`fixed z-50 transition-all duration-300 ${
          showVideoModal
            ? 'bottom-20 sm:bottom-24 right-2 sm:right-8 w-[calc(100vw-1rem)] sm:w-96 max-w-sm aspect-video bg-black rounded-2xl border border-slate-700 overflow-hidden shadow-2xl pointer-events-auto opacity-100 scale-100'
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
        <div className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-50 bg-amber-950/95 border border-amber-500/40 text-amber-200 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium shadow-2xl flex items-center gap-2 backdrop-blur-md animate-bounce max-w-[90vw]">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="truncate">{playerError}</span>
        </div>
      )}

      {/* 3. Up Next Queue Flyout / Modal */}
      {showQueue && (
        <div className="fixed inset-x-2 sm:inset-x-auto sm:right-8 bottom-20 sm:bottom-24 sm:w-96 max-h-[70vh] sm:max-h-[28rem] bg-slate-900/98 border border-slate-800 rounded-3xl shadow-2xl z-50 backdrop-blur-2xl flex flex-col overflow-hidden animate-fadeIn">
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
                    className="opacity-70 sm:opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 rounded transition"
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

      {/* 4. Full-Screen Mobile Player Sheet (when tapped on mobile) */}
      {isMobileExpanded && (
        <div className="fixed inset-0 z-50 sm:hidden bg-slate-950 flex flex-col justify-between p-6 animate-fadeIn select-none overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-2">
            <button
              onClick={() => setIsMobileExpanded(false)}
              className="p-2 -ml-2 text-slate-400 hover:text-white"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
              Now Playing
            </span>
            <button
              onClick={() => setShowVideoModal((prev) => !prev)}
              className={`p-2 rounded-xl ${showVideoModal ? 'text-brand-400' : 'text-slate-400'}`}
              title="Toggle video"
            >
              <Tv className="w-5 h-5" />
            </button>
          </div>

          {/* Large Artwork */}
          <div className="relative aspect-video w-full max-w-sm mx-auto my-4 rounded-2xl overflow-hidden shadow-2xl bg-black">
            <img
              src={currentSong.thumbnail}
              alt={currentSong.title}
              className="w-full h-full object-cover"
            />
            {isPlaying && (
              <div className="absolute top-3 left-3 flex items-end gap-1 px-2.5 py-1.5 rounded-lg bg-black/70 backdrop-blur-md">
                <span className="w-1 h-3.5 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1 h-5 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1 h-2.5 bg-brand-400 rounded-full animate-bounce" />
              </div>
            )}
          </div>

          {/* Title & Channel & Favorite */}
          <div className="flex items-center justify-between my-2">
            <div className="min-w-0 flex-1 pr-3">
              <h2 className="text-lg font-black text-white truncate">
                {decodeHtml(currentSong.title)}
              </h2>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {decodeHtml(currentSong.channel)}
              </p>
            </div>
            <button
              onClick={() => toggleFavorite(currentSong)}
              className={`p-2 rounded-xl transition ${
                favorited ? 'text-red-500' : 'text-slate-400'
              }`}
            >
              <Heart className={`w-6 h-6 ${favorited ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Scrubber / Progress Slider */}
          <div className="my-3">
            <div className="relative group flex items-center py-2">
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
                className="w-full h-1.5 rounded-full outline-none"
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 font-mono mt-1">
              <span>{formatTime(displayTime)}</span>
              <span>{duration > 0 ? formatTime(duration) : currentSong.duration || '0:00'}</span>
            </div>
          </div>

          {/* Large Touch Playback Controls */}
          <div className="flex items-center justify-between px-2 my-3">
            <button
              onClick={toggleShuffle}
              className={`p-2 ${isShuffle ? 'text-brand-400' : 'text-slate-400'}`}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            <button
              onClick={playPrevious}
              className="p-3 text-slate-200 active:scale-90 transition"
            >
              <SkipBack className="w-7 h-7 fill-current" />
            </button>

            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-brand-500 text-slate-950 flex items-center justify-center shadow-xl shadow-brand-500/30 active:scale-95 transition"
            >
              {isBuffering && !isPlaying ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-8 h-8 fill-current" />
              ) : (
                <Play className="w-8 h-8 fill-current ml-1" />
              )}
            </button>

            <button
              onClick={playNext}
              className="p-3 text-slate-200 active:scale-90 transition"
            >
              <SkipForward className="w-7 h-7 fill-current" />
            </button>

            <button
              onClick={cycleRepeat}
              className={`p-2 ${repeatMode !== 'off' ? 'text-brand-400' : 'text-slate-400'}`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
            </button>
          </div>

          {/* Volume & Bottom Actions */}
          <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2 flex-1">
              <button onClick={toggleMute} className="text-slate-400">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
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
                className="w-full h-1.5 rounded-full"
              />
            </div>

            <button
              onClick={() => setShowQueue(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5 text-xs font-semibold"
            >
              <ListMusic className="w-4 h-4 text-brand-400" />
              <span>Queue ({queue.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Sticky Bottom Player Bar (Adaptive for Mobile & Desktop) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800 shadow-2xl select-none">
        {/* Mobile Slim Progress Line on Top of Bar */}
        <div className="sm:hidden w-full h-[2.5px] bg-slate-800">
          <div
            className="h-full bg-brand-500 transition-all duration-300"
            style={{ width: `${seekPercentage}%` }}
          />
        </div>

        {/* --- MOBILE COMPACT MINI-BAR (< 640px) --- */}
        <div className="sm:hidden flex items-center justify-between px-3 py-2 h-16">
          {/* Left: Tappable Track Info (expands player) */}
          <div
            onClick={() => setIsMobileExpanded(true)}
            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer pr-2"
          >
            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-900 shrink-0">
              <img
                src={currentSong.thumbnail}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white truncate">
                {decodeHtml(currentSong.title)}
              </h4>
              <p className="text-[11px] text-slate-400 truncate">
                {decodeHtml(currentSong.channel)}
              </p>
            </div>
          </div>

          {/* Right: Quick Touch Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => toggleFavorite(currentSong)}
              className={`p-2 transition ${favorited ? 'text-red-500' : 'text-slate-400'}`}
              title="Favorite"
            >
              <Heart className={`w-5 h-5 ${favorited ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-full bg-brand-500 text-slate-950 flex items-center justify-center active:scale-90 transition shadow-md shadow-brand-500/20"
              title="Play/Pause"
            >
              {isBuffering && !isPlaying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={playNext}
              className="p-2 text-slate-300 active:scale-90 transition"
              title="Next track"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={() => setIsMobileExpanded(true)}
              className="p-1.5 text-slate-400 hover:text-white"
              title="Expand player"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* --- DESKTOP & TABLET RICH 3-COLUMN BAR (>= 640px) --- */}
        <div className="hidden sm:flex max-w-7xl mx-auto items-center justify-between gap-4 px-4 py-2.5 sm:py-3">
          {/* Left: Track Information */}
          <div className="flex items-center gap-3 w-1/4 min-w-[180px] lg:min-w-[240px]">
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
              className={`p-1.5 rounded-lg transition-colors ${
                favorited ? 'text-red-500' : 'text-slate-400 hover:text-white'
              }`}
              title={favorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Center: Controls & Scrubber */}
          <div className="flex flex-col items-center gap-1.5 flex-1 max-w-xl">
            <div className="flex items-center gap-3 md:gap-5">
              <button
                onClick={toggleShuffle}
                className={`p-1.5 rounded-lg transition-colors ${
                  isShuffle ? 'text-brand-400 bg-brand-500/10' : 'text-slate-400 hover:text-white'
                }`}
                title={`Shuffle ${isShuffle ? 'On' : 'Off'}`}
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={playPrevious}
                className="p-1.5 text-slate-300 hover:text-white transition-colors active:scale-90"
                title="Previous track"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              <button
                onClick={togglePlay}
                className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-brand-500 hover:bg-brand-400 text-slate-950 flex items-center justify-center shadow-lg shadow-brand-500/20 active:scale-95 transition-all"
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

              <button
                onClick={stopSong}
                className="p-1.5 text-slate-400 hover:text-red-400 transition-colors active:scale-90"
                title="Stop track"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>

              <button
                onClick={playNext}
                className="p-1.5 text-slate-300 hover:text-white transition-colors active:scale-90"
                title="Next track"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>

              <button
                onClick={cycleRepeat}
                className={`p-1.5 rounded-lg transition-colors ${
                  repeatMode !== 'off' ? 'text-brand-400 bg-brand-500/10' : 'text-slate-400 hover:text-white'
                }`}
                title={`Repeat: ${repeatMode}`}
              >
                {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
              </button>
            </div>

            {/* Scrubber Bar */}
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
                  className="w-full h-1 group-hover:h-1.5 rounded-full outline-none transition-all cursor-pointer"
                />
              </div>

              <span className="w-9 text-left">
                {duration > 0 ? formatTime(duration) : currentSong.duration || '0:00'}
              </span>
            </div>
          </div>

          {/* Right: Volume, Queue & Video Popout */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 w-1/4 min-w-[140px] lg:min-w-[200px]">
            <button
              onClick={() => setShowVideoModal((prev) => !prev)}
              className={`p-2 rounded-lg transition-colors ${
                showVideoModal ? 'text-brand-400 bg-brand-500/10' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle video window"
            >
              <Tv className="w-4 h-4" />
            </button>

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

            <div className="flex items-center gap-2 group">
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
                className="w-16 lg:w-24 h-1 group-hover:h-1.5 rounded-full outline-none transition-all cursor-pointer"
                title={`Volume: ${isMuted ? '0' : volume}%`}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
