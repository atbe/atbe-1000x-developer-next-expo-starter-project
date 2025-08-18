import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '~/providers/auth-provider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for hydration before checking auth
    if (!isAuthenticated) {
      // Preserve the current path as a redirect parameter
      const currentPath = router.asPath;
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
      router.push(redirectUrl);
    } else {
      setIsChecking(false);
    }
  }, [isAuthenticated, router, redirectTo]);

  // Show loading spinner while hydrating or checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If we get here and not authenticated, return null (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
