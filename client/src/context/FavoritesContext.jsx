import React, { createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useLocalStorage('beatstream_favorites', []);

  const isFavorite = (videoId) => {
    return favorites.some((item) => item.videoId === videoId);
  };

  const addFavorite = (song) => {
    if (!song?.videoId) return;
    setFavorites((prev) => {
      if (prev.some((item) => item.videoId === song.videoId)) return prev;
      return [song, ...prev];
    });
  };

  const removeFavorite = (videoId) => {
    setFavorites((prev) => prev.filter((item) => item.videoId !== videoId));
  };

  const toggleFavorite = (song) => {
    if (!song?.videoId) return;
    if (isFavorite(song.videoId)) {
      removeFavorite(song.videoId);
    } else {
      addFavorite(song);
    }
  };

  const clearFavorites = () => {
    setFavorites([]);
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
