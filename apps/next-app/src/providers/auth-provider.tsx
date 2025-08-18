import { createAuthClient } from 'better-auth/react';
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useSetUserInfo } from '~/hooks/auth/useSetUserInfo';
import { useAuthStore } from '~/stores/auth-store';

interface AuthContextValue {
  client: ReturnType<typeof createAuthClient> | null;
  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, any>,
  ) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signOut: () => Promise<any>;
  getSession: () => Promise<any>;
  getUser: () => Promise<any>;
  useSession: () => any;
}

const AuthContext = createContext<AuthContextValue>({
  client: null,
  signUp: async () => ({}),
  signIn: async () => ({}),
  signInWithGoogle: async () => ({}),
  signOut: async () => ({}),
  getSession: async () => ({}),
  getUser: async () => ({}),
  useSession: () => null,
});

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
  const authStatus = useAuthStore((state) => state.isAuthenticated);
  const setHasHydrated = useAuthStore((state) => state.setHasHydrated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const setUser = useAuthStore((state) => state.updateUser);
  const updateToken = useAuthStore((state) => state.updateToken);
  const logout = useAuthStore((state) => state.logout);
  const setUserInfo = useSetUserInfo();

  const authClientRef = useRef<ReturnType<typeof createAuthClient> | null>(
    null,
  );

  // Initialize Better Auth client
  useEffect(() => {
    if (!authClientRef.current) {
      authClientRef.current = createAuthClient({
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3042',
        basePath: '/api/auth',
        fetchOptions: {
          credentials: 'include',
        },
      });
    }
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    if (!authClientRef.current) return;

    // Use better-auth's session monitoring
    const checkSession = async () => {
      const session = await authClientRef.current!.getSession();

      if (session.data) {
        setUser(session.data.user);
        updateToken(session.data.token || '');
        setUserInfo();
      } else if (authStatus && hasHydrated) {
        logout();
      }
    };

    // Check session on mount and periodically
    checkSession();
    const interval = setInterval(checkSession, 60000); // Check every minute

    return () => {
      clearInterval(interval);
    };
  }, [authStatus, hasHydrated, logout, setUser, setUserInfo, updateToken]);

  useEffect(() => {
    // Trigger rehydration on mount
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    // Rehydrate immediately
    useAuthStore.persist.rehydrate();

    return () => {
      unsubscribe();
    };
  }, [setHasHydrated, setUserInfo]);

  const authMethods: AuthContextValue = {
    client: authClientRef.current,

    signUp: async (
      email: string,
      password: string,
      metadata?: Record<string, any>,
    ) => {
      if (!authClientRef.current)
        throw new Error('Auth client not initialized');

      const response = await authClientRef.current.signUp.email({
        email,
        password,
        name: metadata?.name || '',
      });

      if (response.data) {
        setUser(response.data.user);
        updateToken(response.data.token || '');
        setUserInfo();
      }

      return response;
    },

    signIn: async (email: string, password: string) => {
      if (!authClientRef.current)
        throw new Error('Auth client not initialized');

      const response = await authClientRef.current.signIn.email({
        email,
        password,
      });

      if (response.data) {
        setUser(response.data.user);
        updateToken(response.data.token || '');
        setUserInfo();
      }

      return response;
    },

    signInWithGoogle: async () => {
      if (!authClientRef.current)
        throw new Error('Auth client not initialized');

      await authClientRef.current.signIn.social({
        provider: 'google',
        callbackURL: `${window.location.origin}/auth/callback`,
      });
    },

    signOut: async () => {
      if (!authClientRef.current)
        throw new Error('Auth client not initialized');

      const response = await authClientRef.current.signOut();
      logout();
      return response;
    },

    getSession: async () => {
      if (!authClientRef.current)
        throw new Error('Auth client not initialized');

      return authClientRef.current.getSession();
    },

    getUser: async () => {
      if (!authClientRef.current)
        throw new Error('Auth client not initialized');

      const session = await authClientRef.current.getSession();
      return session.data?.user || null;
    },

    useSession: () => {
      if (!authClientRef.current)
        throw new Error('Auth client not initialized');

      return authClientRef.current.useSession();
    },
  };

  return (
    <AuthContext.Provider value={authMethods}>{children}</AuthContext.Provider>
  );
}
