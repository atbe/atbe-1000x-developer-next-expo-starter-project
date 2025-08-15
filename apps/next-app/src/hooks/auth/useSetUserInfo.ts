import { useCallback } from 'react';
import { useAuthStore } from '~/stores/auth-store';

export function useSetUserInfo() {
  const setUserInfo = useCallback(() => {
    // Load userInfo from the separate localStorage key if available
    if (typeof window !== 'undefined') {
      try {
        const gotrueRaw = localStorage.getItem('gotrue-auth-token');
        if (gotrueRaw) {
          const gotrue = JSON.parse(gotrueRaw);
          if (gotrue && typeof gotrue === 'object') {
            useAuthStore.setState({ userInfo: gotrue });
          }
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  return setUserInfo;
}
