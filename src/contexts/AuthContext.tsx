// ==========================================
// Common Ground - Auth Context
// ==========================================
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types';
import { mockAuth, mockProfile, mockNotifications } from '../services/mockService';
import { authStorage } from '../lib/storage';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  unreadCount: number;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  isLoading: true,
  unreadCount: 0,
  signUp: async () => ({}),
  signIn: async () => ({}),
  signOut: async () => {},
  refreshUser: async () => {},
  refreshUnreadCount: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUser = useCallback(async () => {
    const u = await mockProfile.getMyProfile();
    setUser(u);
    if (u) await authStorage.saveUser(u);
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    const count = await mockNotifications.getUnreadCount();
    setUnreadCount(count);
  }, []);

  useEffect(() => {
    // 앱 시작 시 저장된 세션 복원
    (async () => {
      // 1) AsyncStorage에서 캐시된 유저 즉시 표시 (빠른 UX)
      const cachedUser = await authStorage.getUser<User>();
      if (cachedUser) {
        setUser(cachedUser);
      }

      // 2) 저장된 userId로 실제 세션 복원
      const savedId = await authStorage.getUserId();
      if (savedId) {
        const restored = await mockAuth.restoreSession(savedId);
        if (restored) {
          setUser(restored);
          await authStorage.saveUser(restored);
          const count = await mockNotifications.getUnreadCount();
          setUnreadCount(count);
        } else {
          // 세션 복원 실패 → 캐시 정리
          await authStorage.clear();
          setUser(null);
        }
      } else {
        // 저장된 세션 없음 → 기존 로직
        const u = await mockAuth.getCurrentUser();
        setUser(u);
        if (u) {
          const count = await mockNotifications.getUnreadCount();
          setUnreadCount(count);
        }
      }
      setIsLoading(false);
    })();
  }, []);

  const signUp = async (email: string, password: string) => {
    const result = await mockAuth.signUp(email, password);
    if (result.error) return { error: result.error };
    setUser(result.user);
    await authStorage.saveUserId(result.user.id);
    await authStorage.saveUser(result.user);
    await refreshUnreadCount();
    return {};
  };

  const signIn = async (email: string, password: string) => {
    const result = await mockAuth.signIn(email, password);
    if (result.error) return { error: result.error };
    setUser(result.user);
    if (result.user) {
      await authStorage.saveUserId(result.user.id);
      await authStorage.saveUser(result.user);
    }
    await refreshUnreadCount();
    return {};
  };

  const signOut = async () => {
    await mockAuth.signOut();
    await authStorage.clear();
    setUser(null);
    setUnreadCount(0);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isLoading,
        unreadCount,
        signUp,
        signIn,
        signOut,
        refreshUser,
        refreshUnreadCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
