import { useRouter } from 'next/router';
import { useState } from 'react';
import { useAuth } from '~/providers/auth-provider';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  error?: string;
}

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const auth = useAuth();

  const login = async (credentials: LoginCredentials): Promise<LoginResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // Sign in with better-auth
      const response = await auth.signIn(
        credentials.email,
        credentials.password,
      );

      if (response.error) {
        setError(response.error.message || 'Failed to sign in');
        return { success: false, error: response.error.message };
      }

      if (!response.data?.user) {
        setError('Invalid response from authentication service');
        return {
          success: false,
          error: 'Invalid response from authentication service',
        };
      }

      // The auth provider will handle setting the user and token
      // Just redirect to intended page
      const redirectUrl = router.query.redirect as string;
      const destination = redirectUrl || '/dashboard';
      await router.push(destination);

      return { success: true };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<LoginResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: signInError } = await auth.signInWithGoogle();

      if (signInError) {
        setError(signInError.message || 'Failed to sign in with Google');
        return { success: false, error: signInError.message };
      }

      // OAuth flow will redirect, so we don't need to handle success here
      return { success: true };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    loginWithGoogle,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
