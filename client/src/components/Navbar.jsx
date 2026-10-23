import React from 'react';
import { NavLink } from 'react-router-dom';
import { Music2, Heart, Home, Radio } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';

export default function Navbar() {
  const { favorites } = useFavorites();

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
              Music App
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                PRO
              </span>
            </span>
            <span className="text-[11px] text-slate-400 -mt-1 hidden sm:block">
              YouTube Music Player
            </span>
          </div>
        </NavLink>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`
            }
          >
            <Home className="w-4 h-4" />
            <span>Discover</span>
          </NavLink>

          <NavLink
            to="/favorites"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-slate-800 text-brand-400 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`
            }
          >
            <Heart className="w-4 h-4 fill-current" />
            <span>Favorites</span>
            {favorites.length > 0 && (
              <span className="ml-0.5 px-2 py-0.2 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                {favorites.length}
              </span>
            )}
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
