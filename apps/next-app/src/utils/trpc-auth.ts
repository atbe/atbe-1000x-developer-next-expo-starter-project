import { useAuthStore } from '~/stores/auth-store';

// Helper to get auth headers for tRPC
// Better-auth uses cookies for session management, so we don't need to manually add headers
// But we'll keep this for backward compatibility and potential Bearer token usage
export const getTRPCAuthHeaders = () => {
  // Better-auth uses httpOnly cookies by default, which are automatically sent
  // We can optionally include the token from the store if needed for Bearer auth
  const token = localStorage.getItem('bearer_token');

  if (token) {
    return {
      authorization: `Bearer ${token}`,
    };
  }

  // Return empty headers - cookies will be sent automatically
  return {};
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
