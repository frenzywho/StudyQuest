"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession, signOut } from 'next-auth/react';

type User = {
  name: string;
  level: number;
  xp: number;
  points: number;
  avatarUrl?: string;
  email?: string;
  id?: string;
}

type AuthContextType = {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);

  // Sync with NextAuth session
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setUser({
        id: session.user.id as string,
        name: session.user.name || 'Anonymous User',
        email: session.user.email || undefined,
        avatarUrl: session.user.image || '/avatar-placeholder.png',
        // These would normally come from your database
        level: 1,
        xp: 0,
        points: 0
      });
    } else if (status === 'unauthenticated') {
      setUser(null);
    }
  }, [session, status]);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    signOut({ callbackUrl: '/' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// This needs to be exported for your components to use
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}