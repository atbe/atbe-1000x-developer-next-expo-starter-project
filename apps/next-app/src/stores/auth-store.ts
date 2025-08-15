import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useEffect } from 'react';
import type { FrontendUser, UserInfo } from '@starterp/models';
import { userInfoToFrontendUser } from '~/utils/auth-utils';

interface AuthState {
  user: FrontendUser | null;
  userInfo: UserInfo | null;
  token: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;

  // Actions
  login: (user: FrontendUser, token: string) => void;
  logout: () => void;
  updateToken: (token: string) => void;
  updateUser: (user: Partial<FrontendUser>) => void;
  updateUserInfo: (userInfo: UserInfo) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      userInfo: null,
      token: null,
      isAuthenticated: false,
      hasHydrated: false,

      login: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/';
      },

      updateToken: (token) => {
        set({ token });
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },

      updateUserInfo: (userInfo) => {
        // Also update the user object with consistent role data
        const user = userInfoToFrontendUser(userInfo);
        set({ userInfo, user });
      },

      setHasHydrated: (state) => {
        set({ hasHydrated: state });
      },
    }),
    {
      name: 'auth-storage', // name of the item in storage
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : (undefined as any),
      ), // use localStorage only on client
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        userInfo: state.userInfo,
      }), // only persist these fields (not hasHydrated)
      onRehydrateStorage: () => (state) => {
        // This runs after hydration
        state?.setHasHydrated(true);
      },
    },
  ),
);

// Hook to handle hydration
export const useHydrateAuthStore = () => {
  useEffect(() => {
    useAuthStore.persist.rehydrate();
  }, []);
};
