import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuthStore } from '~/stores/auth-store';
import { useAuth as useAuthContext } from '~/providers/auth-provider';

export const useAuth = () => {
  const router = useRouter();
  const authStore = useAuthStore();
  const authContext = useAuthContext();

  // Get auth headers for API requests
  const getAuthHeaders = (): Record<string, string> => {
    const { token } = authStore;
    if (!token) return {};

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  // Handle logout and redirect
  const handleLogout = async (redirectTo = '/') => {
    await authContext.signOut();
    router.push(redirectTo);
  };

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const session = await authContext.getSession();
      if (!session?.data && authStore.isAuthenticated) {
        authStore.logout();
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [authContext, authStore, router]);

  return {
    ...authStore,
    ...authContext,
    getAuthHeaders,
    handleLogout,
  };
};
