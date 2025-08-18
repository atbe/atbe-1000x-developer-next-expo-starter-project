import React, { createContext, useContext, useEffect } from 'react';
import { authClient, useSession } from '~/lib/auth-client';
import { useAuthStore } from '~/stores/auth-store';

interface AuthContextValue {
  signIn: typeof authClient.signIn.email;
  signUp: typeof authClient.signUp.email;
  signOut: typeof authClient.signOut;
  session: ReturnType<typeof useSession>;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  refresh: typeof authClient.getSession;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const setHasHydrated = useAuthStore((state) => state.setHasHydrated);
  const setUser = useAuthStore((state) => state.updateUser);
  const updateToken = useAuthStore((state) => state.updateToken);
  const logout = useAuthStore((state) => state.logout);

  // Use better-auth's built-in useSession hook
  const session = useSession();

  // Sync session with auth store
  useEffect(() => {
    if (session.data) {
      setUser(session.data.user);
      // Store token if available
      const token = session.data.session.token || '';
      updateToken(token);
    }
  }, [session.data, setUser, updateToken]);

  // Handle hydration
  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });
    useAuthStore.persist.rehydrate();
    return () => unsubscribe();
  }, [setHasHydrated]);

  const value: AuthContextValue = {
    signIn: authClient.signIn.email,
    signUp: authClient.signUp.email,
    signOut: authClient.signOut,
    session,
    isAuthenticated: !!session.data,
    hasHydrated: session.isPending === false,
    refresh: authClient.getSession,
  };

  // Handle logout separately
  useEffect(() => {
    if (!session.data && session.isPending === false) {
      // Session is gone, clear local state
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        logout();
      }
    }
  }, [session.data, session.isPending, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
