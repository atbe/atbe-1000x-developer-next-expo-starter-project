import { useCallback, useRef } from 'react';
import { useSetUserInfo } from '~/hooks/auth/useSetUserInfo';
import { useAuth } from '~/providers/auth-provider';

export function useTokenRefresh() {
  const { isAuthenticated, hasHydrated, refresh } = useAuth();
  const hasRefreshedRef = useRef(false);
  const setUserInfo = useSetUserInfo();

  const refreshToken = useCallback(async () => {
    // Reset the flag when user logs out
    if (!isAuthenticated) {
      hasRefreshedRef.current = false;
      return;
    }

    // Only refresh if authenticated, hydrated, and haven't refreshed yet
    if (hasHydrated && isAuthenticated && !hasRefreshedRef.current) {
      hasRefreshedRef.current = true;

      try {
        await refresh();
        setUserInfo();
        window.location.reload();
      } catch {
        // Silent fail - user will need to re-login
        hasRefreshedRef.current = false;
      }
    }
  }, [hasHydrated, isAuthenticated, setUserInfo, refresh]);

  return {
    refreshToken,
  };
}
