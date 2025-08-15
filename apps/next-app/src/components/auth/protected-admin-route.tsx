import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '~/stores/auth-store';
import { trpc } from '~/utils/trpc';
import { Loader2 } from 'lucide-react';
import { useIsAdmin } from '~/hooks/auth/use-roles';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const isAdmin = useIsAdmin();
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  // Check if user has admin role
  const {
    data: stats,
    isLoading,
    error,
  } = trpc.admin.getSystemStats.useQuery(undefined, {
    enabled: isAuthenticated && hasHydrated,
    retry: false,
  });

  useEffect(() => {
    // Check role from store first
    if (hasHydrated && isAuthenticated) {
      // If user has admin role in store, we're done checking
      if (isAdmin) {
        setIsCheckingRole(false);
        return;
      }
      
      // If no admin role in store, verify with API call
      if (!isLoading) {
        if (stats) {
          // API confirms admin access
          setIsCheckingRole(false);
        } else if (error?.data?.code === 'FORBIDDEN') {
          // Not an admin
          setIsCheckingRole(false);
        }
      }
    }
  }, [stats, error, isLoading, isAuthenticated, hasHydrated, isAdmin]);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!isCheckingRole && !isAdmin && hasHydrated) {
      router.push('/dashboard');
    }
  }, [isCheckingRole, isAdmin, hasHydrated, router]);

  // Show loading while checking auth status or role
  if (!hasHydrated || isCheckingRole || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated or not admin, will redirect (return null to avoid flash)
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
