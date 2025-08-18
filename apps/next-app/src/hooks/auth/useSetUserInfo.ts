import { useCallback } from 'react';

export function useSetUserInfo() {
  const setUserInfo = useCallback(async () => {
    // Better-auth handles session management internally
    // This hook is kept for compatibility but can be simplified
    // UserInfo will be set through the auth-provider when session changes
  }, []);

  return setUserInfo;
}
