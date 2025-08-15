import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '~/stores/auth-store';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, token, hasHydrated } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for hydration before checking auth
    if (hasHydrated) {
      if (!isAuthenticated || !token) {
        // Preserve the current path as a redirect parameter
        const currentPath = router.asPath;
        const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
        router.push(redirectUrl);
      } else {
        setIsChecking(false);
      }
    }
  }, [hasHydrated, isAuthenticated, token, router, redirectTo]);

  // Show loading spinner while hydrating or checking auth
  if (!hasHydrated || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If we get here and not authenticated, return null (redirect will happen)
  if (!isAuthenticated || !token) {
    return null;
  }

  return <>{children}</>;
}
