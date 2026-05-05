import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '@/api';
import type { User, LoginForm } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  login: (data: LoginForm) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  clearMustChangePassword: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const me = await authApi.getMe();
      setUser(me);
      if (me.mustChangePassword) {
        setMustChangePassword(true);
      }
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (data: LoginForm) => {
    const result = await authApi.login(data);
    localStorage.setItem('accessToken', result.accessToken);
    localStorage.setItem('refreshToken', result.refreshToken);
    setUser(result.user);
    if (result.user.mustChangePassword) {
      setMustChangePassword(true);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setMustChangePassword(false);
    }
  };

  const updateUser = (updatedUser: User) => setUser(updatedUser);

  const clearMustChangePassword = () => {
    setMustChangePassword(false);
    if (user) {
      setUser({ ...user, mustChangePassword: false });
    }
  };

  return (
    <AuthContext.Provider value={{
      user, isLoading,
      isAuthenticated: !!user,
      mustChangePassword,
      login, logout, updateUser,
      clearMustChangePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
