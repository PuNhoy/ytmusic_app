import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useLocalStorage('beatstream_volume', 80);
  const [isMuted, setIsMuted] = useState(false);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off' | 'all' | 'one'
  const [playerError, setPlayerError] = useState(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const playerRef = useRef(null);
  const isSeekingRef = useRef(false);

  // Mutable refs to prevent stale closure or unnecessary re-binding in callbacks
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  // Play a specific song, optionally setting or updating the playback queue
  const playSong = useCallback((song, newQueue = null, index = null) => {
    if (!song?.videoId) return;

    setPlayerError(null);
    setCurrentTime(0);

    // If clicking the current song again, resume it
    if (currentSong?.videoId === song.videoId) {
      if (playerRef.current) {
        try {
          playerRef.current.playVideo();
        } catch (e) {
          console.warn('Error playing video:', e);
        }
      }
      setIsPlaying(true);
      return;
    }

    setCurrentSong(song);
    setIsPlaying(true);

    if (newQueue && Array.isArray(newQueue)) {
      setQueue(newQueue);
      const targetIndex =
        index !== null && index >= 0
          ? index
          : newQueue.findIndex((item) => item.videoId === song.videoId);
      setQueueIndex(targetIndex !== -1 ? targetIndex : 0);
    } else {
      setQueue((prev) => {
        const existingIdx = prev.findIndex((item) => item.videoId === song.videoId);
        if (existingIdx !== -1) {
          setQueueIndex(existingIdx);
          return prev;
        }
        const updated = [...prev, song];
        setQueueIndex(updated.length - 1);
        return updated;
      });
    }
  }, [currentSong]);

  // Pause playback
  const pauseSong = useCallback(() => {
    if (playerRef.current) {
      try {
        playerRef.current.pauseVideo();
      } catch (err) {
        console.warn('Error pausing video:', err);
      }
    }
    setIsPlaying(false);
  }, []);

  // Resume playback
  const resumeSong = useCallback(() => {
    if (playerRef.current) {
      try {
        playerRef.current.playVideo();
      } catch (err) {
        console.warn('Error resuming video:', err);
      }
    }
    setIsPlaying(true);
  }, []);

  // Stop playback completely
  const stopSong = useCallback(() => {
    if (playerRef.current) {
      try {
        playerRef.current.stopVideo();
      } catch (err) {
        console.warn('Error stopping video:', err);
      }
    }
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  // Toggle play / pause
  const togglePlay = useCallback(() => {
    if (!currentSong) return;

    if (!playerRef.current) {
      setIsPlaying((prev) => !prev);
      return;
    }

    try {
      let state = -1;
      try {
        state = playerRef.current.getPlayerState?.();
      } catch {
        state = -1;
      }

      // YouTube Player States: 1 = PLAYING, 3 = BUFFERING
      if (state === 1 || state === 3 || isPlayingRef.current) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } catch (err) {
      console.warn('Error in togglePlay:', err);
      if (isPlayingRef.current) {
        try { playerRef.current?.pauseVideo?.(); } catch {}
        setIsPlaying(false);
      } else {
        try { playerRef.current?.playVideo?.(); } catch {}
        setIsPlaying(true);
      }
    }
  }, [currentSong]);

  // Play next song in queue
  const playNext = useCallback(() => {
    if (queue.length === 0) return;

    if (repeatMode === 'one' && currentSong) {
      if (playerRef.current?.seekTo) {
        playerRef.current.seekTo(0);
        playerRef.current.playVideo();
      }
      return;
    }

    let nextIdx;
    if (isShuffle && queue.length > 1) {
      do {
        nextIdx = Math.floor(Math.random() * queue.length);
      } while (nextIdx === queueIndex);
    } else {
      nextIdx = queueIndex + 1;
      if (nextIdx >= queue.length) {
        if (repeatMode === 'all') {
          nextIdx = 0;
        } else {
          setIsPlaying(false);
          return;
        }
      }
    }

    const nextSong = queue[nextIdx];
    if (nextSong) {
      setQueueIndex(nextIdx);
      setCurrentSong(nextSong);
      setCurrentTime(0);
      setPlayerError(null);
      setIsPlaying(true);
    }
  }, [queue, queueIndex, isShuffle, repeatMode, currentSong]);

  // Play previous song in queue
  const playPrevious = useCallback(() => {
    if (currentTime > 3 && playerRef.current?.seekTo) {
      playerRef.current.seekTo(0);
      setCurrentTime(0);
      return;
    }

    if (queue.length === 0) return;

    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      prevIdx = queue.length - 1;
    }

    const prevSong = queue[prevIdx];
    if (prevSong) {
      setQueueIndex(prevIdx);
      setCurrentSong(prevSong);
      setCurrentTime(0);
      setPlayerError(null);
      setIsPlaying(true);
    }
  }, [currentTime, queue, queueIndex]);

  // Seek to specific second
  const seekTo = useCallback((seconds) => {
    setCurrentTime(seconds);
    if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(seconds, true);
    }
  }, []);

  // Set volume (0 - 100)
  const setVolume = useCallback((newVol) => {
    const clamped = Math.max(0, Math.min(100, Number(newVol)));
    setVolumeState(clamped);
    if (isMuted) setIsMuted(false);
    if (playerRef.current?.setVolume) {
      playerRef.current.unMute?.();
      playerRef.current.setVolume(clamped);
    }
  }, [isMuted, setVolumeState]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      playerRef.current?.unMute?.();
      playerRef.current?.setVolume?.(volume);
    } else {
      setIsMuted(true);
      playerRef.current?.mute?.();
    }
  }, [isMuted, volume]);

  // Toggle shuffle
  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  // Cycle repeat modes: off -> all -> one -> off
  const cycleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  // Add song to current queue
  const addToQueue = useCallback((song) => {
    if (!song?.videoId) return;
    setQueue((prev) => [...prev, song]);
  }, []);

  // Remove song from queue
  const removeFromQueue = useCallback((index) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
    setQueueIndex((prev) => (prev > index ? prev - 1 : prev));
  }, []);

  // Clear entire queue
  const clearQueue = useCallback(() => {
    setQueue(currentSong ? [currentSong] : []);
    setQueueIndex(currentSong ? 0 : -1);
  }, [currentSong]);

  // Periodic timer to sync current progress and duration
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (playerRef.current && !isSeekingRef.current) {
        try {
          const cur = playerRef.current.getCurrentTime?.() || 0;
          const dur = playerRef.current.getDuration?.() || 0;
          setCurrentTime(cur);
          if (dur > 0) setDuration(dur);
        } catch {
          // Ignore polling errors
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // YouTube player event handlers - stable references
  const handlePlayerReady = useCallback((event) => {
    playerRef.current = event.target;
    try {
      event.target.setVolume(volumeRef.current);
      if (isMutedRef.current) {
        event.target.mute();
      }
      if (isPlayingRef.current) {
        event.target.playVideo();
      }
    } catch (e) {
      console.warn('Error onPlayerReady:', e);
    }
  }, []);

  const handlePlayerStateChange = useCallback(
    (event) => {
      // YouTube Player States:
      // -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
      const state = event.data;
      if (state === 1) {
        setIsPlaying(true);
        setIsBuffering(false);
        try {
          const dur = event.target.getDuration?.() || 0;
          if (dur > 0) setDuration(dur);
        } catch {}
      } else if (state === 2) {
        setIsPlaying(false);
        setIsBuffering(false);
      } else if (state === 3) {
        setIsBuffering(true);
      } else if (state === 0) {
        setIsBuffering(false);
        playNext();
      }
    },
    [playNext]
  );

  const handlePlayerError = useCallback(
    (event) => {
      const errorCode = event.data;
      console.warn(`YouTube Player Error: ${errorCode}`);

      let message = 'Unable to play this track.';
      if (errorCode === 101 || errorCode === 150) {
        message = 'The owner does not allow this song to be embedded. Skipping to next song...';
      } else if (errorCode === 100) {
        message = 'Song not found or has been removed. Skipping to next song...';
      } else if (errorCode === 2) {
        message = 'Invalid video ID parameter. Skipping to next song...';
      }

      setPlayerError(message);
      setIsBuffering(false);

      const timer = setTimeout(() => {
        playNext();
      }, 1800);

      return () => clearTimeout(timer);
    },
    [playNext]
  );

  return (
    <PlayerContext.Provider
      value={{
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
        playSong,
        pauseSong,
        resumeSong,
        stopSong,
        togglePlay,
        playNext,
        playPrevious,
        seekTo,
        setVolume,
        toggleMute,
        toggleShuffle,
        cycleRepeat,
        addToQueue,
        removeFromQueue,
        clearQueue,
        handlePlayerReady,
        handlePlayerStateChange,
        handlePlayerError,
        isSeekingRef,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
