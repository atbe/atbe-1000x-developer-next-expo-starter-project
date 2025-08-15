import { useAuthStore } from '~/stores/auth-store';

// Helper to get auth headers for tRPC
export const getTRPCAuthHeaders = () => {
  // Try to get from store first, then from localStorage
  const goTrueToken = localStorage.getItem('gotrue-auth-token');
  if (goTrueToken) {
    const parsedToken: {
      access_token: string;
    } = JSON.parse(goTrueToken);
    return {
      authorization: `Bearer ${parsedToken.access_token}`,
    };
  } else {
    return {};
  }
};

// Helper to handle auth errors in tRPC
export const handleTRPCAuthError = (error: any) => {
  // Check if it's an authentication error
  if (error?.data?.code === 'UNAUTHORIZED' || error?.data?.httpStatus === 401) {
    // Clear auth state and redirect to login
    const { logout } = useAuthStore.getState();
    logout();

    // Redirect to login (you might want to use Next.js router here)
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  throw error;
};
