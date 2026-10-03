import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, getMe, acceptTerms as apiAcceptTerms } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const userData = await getMe();
          setUser(userData);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  async function handleLogin(username, password) {
    const data = await apiLogin(username, password);
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    const userData = await getMe();
    setUser(userData);
    return userData;
  }

  function handleLogout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  }

  async function handleAcceptTerms() {
    await apiAcceptTerms();
    const updated = await getMe();
    setUser(updated);
    return updated;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login: handleLogin,
        logout: handleLogout,
        acceptTerms: handleAcceptTerms,
        isAuthenticated: !!user,
        role: user?.role || null,
        needsConsent: !!user?.needs_terms_acceptance,
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
