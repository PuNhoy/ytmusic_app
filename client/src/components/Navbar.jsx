import React from 'react';
import { NavLink } from 'react-router-dom';
import { Music2, Heart, Home, LogIn, LogOut, UserCircle } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { favorites } = useFavorites();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
            <Music2 className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-1.5">
              BeatStream
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                PRO
              </span>
            </span>
            <span className="text-[11px] text-slate-400 -mt-1 hidden sm:block">
              YouTube Music Player
            </span>
          </div>
        </NavLink>

        {/* Navigation Links & User Authentication */}
        <nav className="flex items-center gap-1.5 sm:gap-3">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`
            }
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Discover</span>
          </NavLink>

          <NavLink
            to="/favorites"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-slate-800 text-brand-400 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`
            }
          >
            <Heart className="w-4 h-4 fill-current" />
            <span className="hidden sm:inline">Favorites</span>
            {favorites.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                {favorites.length}
              </span>
            )}
          </NavLink>

          <div className="h-5 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

          {/* User Sign In / Profile Button */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-medium">
                <UserCircle className="w-4 h-4 text-brand-400" />
                <span className="truncate max-w-[90px]">{user.username}</span>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-brand-500/20 transition-all active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
