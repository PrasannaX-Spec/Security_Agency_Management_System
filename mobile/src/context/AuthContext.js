import React, { createContext, useContext, useState, useEffect } from 'react';
import { getItem, setItem, deleteItem } from '../services/storage';
import { login as apiLogin, getMe, acceptTerms as apiAcceptTerms } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStoredUser() {
      try {
        const token = await getItem('access_token');
        if (token) {
          const userData = await getMe();
          setUser(userData);
        }
      } catch {
        await deleteItem('access_token');
        await deleteItem('refresh_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadStoredUser();
  }, []);

  async function handleLogin(username, password) {
    const data = await apiLogin(username, password);
    if (!data || !data.access) {
      throw new Error('Invalid authentication response from server.');
    }
    await setItem('access_token', data.access);
    await setItem('refresh_token', data.refresh);
    const userData = await getMe();
    setUser(userData);
    return userData;
  }

  async function handleLogout() {
    try {
      await deleteItem('access_token');
      await deleteItem('refresh_token');
    } catch {
      // Ignore deletion errors
    }
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
