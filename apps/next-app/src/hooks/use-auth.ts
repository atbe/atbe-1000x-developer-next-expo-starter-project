import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuthStore } from '~/stores/auth-store';

export const useAuth = () => {
  const router = useRouter();
  const authStore = useAuthStore();

  // Check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() > exp;
    } catch {
      return true;
    }
  };

  // Get auth headers for API requests
  const getAuthHeaders = (): Record<string, string> => {
    const { token } = authStore;
    if (!token) return {};

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  // Handle logout and redirect
  const handleLogout = (redirectTo = '/') => {
    authStore.logout();
    router.push(redirectTo);
  };

  // Check auth status on mount and token changes
  useEffect(() => {
    const { token, logout } = authStore;

    if (token && isTokenExpired(token)) {
      logout();
      router.push('/login');
    }
  }, [authStore, authStore.token, router]);

  return {
    ...authStore,
    isTokenExpired,
    getAuthHeaders,
    handleLogout,
  };
};
