import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';
import { useAuth } from '~/providers/auth-provider';
import { useAuthStore } from '~/stores/auth-store';
import { trpc } from '~/utils/trpc';
import { parseRolesFromToken, parseRolesFromUser } from '~/utils/auth-helpers';

export default function AuthCallback() {
  const router = useRouter();
  const { login } = useAuthStore();
  const upsertUserMutation = trpc.user.upsertOAuthUser.useMutation();
  const hasRun = useRef(false);
  const auth = useAuth();

  useEffect(() => {
    // Ensure this only runs once
    if (hasRun.current) return;
    hasRun.current = true;

    const handleCallback = async () => {
      try {
        // Get the session from GoTrue
        const {
          data: { session },
          error,
        } = await auth.getSession();

        if (error) {
          router.push('/login?error=auth_failed');
          return;
        }

        if (!session) {
          router.push('/login?error=no_session');
          return;
        }

        // Get user details
        const {
          data: { user },
        } = await auth.getUser();

        if (!user) {
          router.push('/login?error=no_user');
          return;
        }

        // Parse roles from token or user metadata
        const roles = parseRolesFromToken(session.access_token) || parseRolesFromUser(user);

        // Upsert user in our database
        const dbUser = await upsertUserMutation.mutateAsync({});

        // Store the user and token in the auth store
        // Map database user to our frontend user model
        const frontendUser = {
          id: dbUser.id,
          email: dbUser.email,
          createdAt: new Date(dbUser.createdAt),
          roles,
        };

        login(frontendUser, session.access_token);

        // Redirect to dashboard or intended destination
        const redirectUrl = (router.query.redirect as string) || '/dashboard';
        router.push(redirectUrl);
      } catch {
        router.push('/login?error=callback_failed');
      }
    };

    handleCallback();
  }, [auth, login, router, upsertUserMutation]); // Dependencies needed for the callback

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
