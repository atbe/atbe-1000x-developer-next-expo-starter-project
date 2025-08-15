import {
  type AuthChangeEvent,
  GoTrueClient,
  type Session,
} from "@supabase/gotrue-js";
import React, { createContext, useContext, useEffect, useRef } from "react";
import { useSetUserInfo } from "../hooks/useSetUserInfo";
import { useAuthStore } from "../stores/auth-store";
import { useConfigStore } from "../stores/config-store";
import getExpoHostUri from "../utils/debug/expoHostUri";

interface AuthContextValue {
  client: GoTrueClient | null;
  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, any>
  ) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signInWithIdToken: (idToken: string) => Promise<any>;
  signOut: () => Promise<any>;
  getSession: () => Promise<any>;
  getUser: () => Promise<any>;
  refreshSession: () => Promise<any>;
}

const AuthContext = createContext<AuthContextValue>({
  client: null,
  signUp: async () => ({}),
  signIn: async () => ({}),
  signInWithIdToken: async () => ({}),
  signOut: async () => ({}),
  getSession: async () => ({}),
  getUser: async () => ({}),
  refreshSession: async () => ({}),
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
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
  const config = useConfigStore((state) => state.config);

  const goTrueClientRef = useRef<GoTrueClient | null>(null);

  // Initialize GoTrue client when config is available
  useEffect(() => {
    if (!goTrueClientRef.current && config) {
      const gotrueUrl = config.gotrueUrl || `http://${getExpoHostUri()}:9999`;
      console.log("gotrueUrl", gotrueUrl);

      goTrueClientRef.current = new GoTrueClient({
        url: gotrueUrl,
        headers: {
          apikey: process.env.EXPO_PUBLIC_GOTRUE_ANON_KEY || "",
        },
        storageKey: "gotrue-auth-token",
        detectSessionInUrl: false,
        flowType: "pkce",
        autoRefreshToken: true,
      });
    }
  }, [config]);

  useEffect(() => {
    if (!goTrueClientRef.current) return;

    const { data: subscription } = goTrueClientRef.current.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (!session) {
          return;
        }

        switch (event) {
          case "SIGNED_IN": {
            setUser(session?.user);
            updateToken(session?.access_token || "");
            setUserInfo();
            return;
          }
          case "TOKEN_REFRESHED": {
            updateToken(session?.access_token || "");
            setUserInfo();
            return;
          }
          case "SIGNED_OUT": {
            logout();
            return;
          }
          default: {
            break;
          }
        }

        if (!session && authStatus && hasHydrated) {
          logout();
          return;
        }
      }
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [
    authStatus,
    hasHydrated,
    logout,
    setUser,
    setUserInfo,
    updateToken,
    config,
  ]);

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
    client: goTrueClientRef.current,

    signUp: async (
      email: string,
      password: string,
      metadata?: Record<string, any>
    ) => {
      if (!goTrueClientRef.current)
        throw new Error("Auth client not initialized");
      return goTrueClientRef.current.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
    },

    signIn: async (email: string, password: string) => {
      if (!goTrueClientRef.current)
        throw new Error("Auth client not initialized");
      console.log("signing in with gotrue", email, password);
      const response = await goTrueClientRef.current.signInWithPassword({
        email,
        password,
      });
      console.log("response", response);
      return response;
    },

    signInWithIdToken: async (idToken: string) => {
      if (!goTrueClientRef.current)
        throw new Error("Auth client not initialized");
      return goTrueClientRef.current.signInWithIdToken({
        provider: "google",
        token: idToken,
      });
    },

    signOut: async () => {
      if (!goTrueClientRef.current)
        throw new Error("Auth client not initialized");
      return goTrueClientRef.current.signOut();
    },

    getSession: async () => {
      if (!goTrueClientRef.current)
        throw new Error("Auth client not initialized");
      return goTrueClientRef.current.getSession();
    },

    getUser: async () => {
      if (!goTrueClientRef.current)
        throw new Error("Auth client not initialized");
      return goTrueClientRef.current.getUser();
    },

    refreshSession: async () => {
      if (!goTrueClientRef.current)
        throw new Error("Auth client not initialized");
      return goTrueClientRef.current.refreshSession();
    },
  };

  return (
    <AuthContext.Provider value={authMethods}>{children}</AuthContext.Provider>
  );
}
