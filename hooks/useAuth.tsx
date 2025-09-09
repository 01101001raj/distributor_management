
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/mockApiService';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  userRole: UserRole | null;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const storedUser = sessionStorage.getItem('currentUser');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Failed to parse stored user:", error);
      return null;
    }
  });

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  const login = async (username: string, password: string): Promise<User> => {
    const user = await api.loginUser(username, password);
    if (user) {
      setCurrentUser(user);
      return user;
    } else {
      throw new Error('Invalid username or password');
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };
  
  const isAuthenticated = !!currentUser;
  const userRole = currentUser?.role || null;

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
