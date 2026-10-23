import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import PlayerBar from './components/PlayerBar';
import AuthModal from './components/AuthModal';
import HomePage from './pages/HomePage';
import FavoritesPage from './pages/FavoritesPage';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { PlayerProvider } from './context/PlayerContext';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FavoritesProvider>
          <PlayerProvider>
            <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
              {/* Top Navigation */}
              <Navbar />

              {/* Main Application Body */}
              <main className="flex-1 pb-32">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/favorites" element={<FavoritesPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>

              {/* Sticky Bottom Player Bar */}
              <PlayerBar />

              {/* Authentication Modal (Sign In / Sign Up) */}
              <AuthModal />
            </div>
          </PlayerProvider>
        </FavoritesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
