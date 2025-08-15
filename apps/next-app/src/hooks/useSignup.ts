import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '~/providers/auth-provider';
import { useAuthStore } from '~/stores/auth-store';
import { trpc } from '~/utils/trpc';

export interface SignupCredentials {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface SignupResult {
  success: boolean;
  error?: string;
}

export function useSignup() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const authStore = useAuthStore();
  const auth = useAuth();

  // Create user in our database
  const createUserMutation = trpc.user.createUser.useMutation();

  const signup = async (credentials: SignupCredentials): Promise<SignupResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // First, create user in our database (which will also create in GoTrue)
      const user = await createUserMutation.mutateAsync({
        email: credentials.email,
        password: credentials.password,
        firstName: credentials.firstName,
        lastName: credentials.lastName,
      });

      if (!user) {
        throw new Error('Failed to create user account');
      }

      // Now sign in with GoTrue to get a session
      const { data, error: signInError } = await auth.signIn(
        credentials.email,
        credentials.password
      );

      if (signInError) {
        setError(signInError.message || 'Failed to sign in after account creation');
        return { success: false, error: signInError.message };
      }

      if (!data.user || !data.session) {
        setError('Invalid response from authentication service');
        return { success: false, error: 'Invalid response from authentication service' };
      }

      // Extract user info and token
      const userInfo = {
        id: data.user.id,
        email: data.user.email!,
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        name: credentials.firstName && credentials.lastName 
          ? `${credentials.firstName} ${credentials.lastName}`.trim()
          : credentials.firstName || credentials.lastName,
        roles: data.user.app_metadata?.roles || [],
      };

      // Store in auth store
      authStore.login(userInfo, data.session.access_token);

      // Redirect to intended page
      const redirectUrl = router.query.redirect as string;
      const destination = redirectUrl || '/dashboard';
      await router.push(destination);

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const signupWithGoogle = async (): Promise<SignupResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: signInError } = await auth.signInWithGoogle();

      if (signInError) {
        setError(signInError.message || 'Failed to sign up with Google');
        return { success: false, error: signInError.message };
      }

      // OAuth flow will redirect, so we don't need to handle success here
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signup,
    signupWithGoogle,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}