import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMeApi, loginApi, signupApi } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('beatstream_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('beatstream_token') || null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [initialMode, setInitialMode] = useState('login'); // 'login' | 'signup'

  // Verify token on mount
  useEffect(() => {
    if (token) {
      getMeApi(token)
        .then((data) => {
          if (data?.user) {
            setUser(data.user);
            localStorage.setItem('beatstream_user', JSON.stringify(data.user));
          }
        })
        .catch(() => {
          // Token expired or invalid
          logout();
        });
    }
  }, [token]);

  const login = async (identifier, password) => {
    const data = await loginApi(identifier, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('beatstream_token', data.token);
    localStorage.setItem('beatstream_user', JSON.stringify(data.user));
    setIsAuthModalOpen(false);
    return data;
  };

  const signup = async (username, email, password) => {
    const data = await signupApi(username, email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('beatstream_token', data.token);
    localStorage.setItem('beatstream_user', JSON.stringify(data.user));
    setIsAuthModalOpen(false);
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('beatstream_token');
    localStorage.removeItem('beatstream_user');
  };

  const openAuthModal = (mode = 'login') => {
    setInitialMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        login,
        signup,
        logout,
        isAuthModalOpen,
        initialMode,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
