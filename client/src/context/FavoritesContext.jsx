import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  getDbFavorites,
  addDbFavorite,
  removeDbFavorite,
  clearDbFavorites,
} from '../utils/api';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [localFavorites, setLocalFavorites] = useLocalStorage('beatstream_favorites', []);
  const [favorites, setFavorites] = useState(localFavorites);

  // Sync favorites with PostgreSQL on load
  useEffect(() => {
    let isMounted = true;
    async function loadFavorites() {
      try {
        const dbItems = await getDbFavorites();
        if (isMounted && Array.isArray(dbItems) && dbItems.length > 0) {
          setFavorites(dbItems);
          setLocalFavorites(dbItems);
        }
      } catch (err) {
        // Fallback to localStorage if database is not yet initialized
        if (isMounted) {
          setFavorites(localFavorites);
        }
      }
    }
    loadFavorites();
    return () => {
      isMounted = false;
    };
  }, []);

  const isFavorite = (videoId) => {
    return favorites.some((item) => item.videoId === videoId);
  };

  const addFavorite = async (song) => {
    if (!song?.videoId) return;

    // Optimistic UI update
    setFavorites((prev) => {
      if (prev.some((item) => item.videoId === song.videoId)) return prev;
      const updated = [song, ...prev];
      setLocalFavorites(updated);
      return updated;
    });

    // Sync to PostgreSQL backend
    try {
      await addDbFavorite(song);
    } catch (e) {
      // Retained in localStorage if DB is unavailable
    }
  };

  const removeFavorite = async (videoId) => {
    // Optimistic UI update
    setFavorites((prev) => {
      const updated = prev.filter((item) => item.videoId !== videoId);
      setLocalFavorites(updated);
      return updated;
    });

    // Sync to PostgreSQL backend
    try {
      await removeDbFavorite(videoId);
    } catch (e) {
      // Retained in localStorage
    }
  };

  const toggleFavorite = (song) => {
    if (!song?.videoId) return;
    if (isFavorite(song.videoId)) {
      removeFavorite(song.videoId);
    } else {
      addFavorite(song);
    }
  };

  const clearFavorites = async () => {
    setFavorites([]);
    setLocalFavorites([]);
    try {
      await clearDbFavorites();
    } catch (e) {}
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        clearFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
