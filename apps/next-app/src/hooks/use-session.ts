import { useAuth } from '~/providers/auth-provider';

/**
 * Hook to access the real-time session state from better-auth
 * This provides reactive updates when the session changes
 */
export function useSession() {
  const { session } = useAuth();
  
  return {
    user: session.data?.user || null,
    token: (session.data as any)?.token || null,
    isLoading: session.isPending || false,
    isAuthenticated: !!session.data,
    session: session.data || null,
  };
}