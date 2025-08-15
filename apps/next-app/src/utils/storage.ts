// Safe localStorage access for SSR
export const storage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting localStorage:', error);
    }
  },

  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },

  clear: (): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};

// Helper to get the auth token directly from localStorage
export const getStoredToken = (): string | null => {
  const authData = storage.getItem('auth-storage');
  if (!authData) return null;

  try {
    const parsed = JSON.parse(authData);
    return parsed?.state?.token || null;
  } catch {
    return null;
  }
};

// Helper to get the stored user directly from localStorage
export const getStoredUser = () => {
  const authData = storage.getItem('auth-storage');
  if (!authData) return null;

  try {
    const parsed = JSON.parse(authData);
    return parsed?.state?.user || null;
  } catch {
    return null;
  }
};
