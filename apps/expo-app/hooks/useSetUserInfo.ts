import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../stores/auth-store';

export function useSetUserInfo() {
  const setUserInfo = useCallback(async () => {
    // Load userInfo from AsyncStorage if available
    try {
      const gotrueRaw = await AsyncStorage.getItem('gotrue-auth-token');
      if (gotrueRaw) {
        const gotrueAuth = JSON.parse(gotrueRaw);
        if (gotrueAuth && typeof gotrueAuth === 'object') {
          useAuthStore.setState({ userInfo: gotrueAuth });
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  return setUserInfo;
}