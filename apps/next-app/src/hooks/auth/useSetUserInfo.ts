import { useCallback } from 'react';
import { useAuth } from '~/providers/auth-provider';
import { useAuthStore } from '~/stores/auth-store';

export function useSetUserInfo() {
  const { session } = useAuth();
  const setUser = useAuthStore((state) => state.updateUser);

  const setUserInfo = useCallback(async () => {
    if (session.data) {
      setUser(session.data.user);
    }
  }, [session.data, setUser]);

  return setUserInfo;
}
