import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';
import { AppHeader } from '~/components/app-header';
import { ProtectedRoute } from '~/components/auth/protected-route';
import { SubscriptionStatusCard } from '~/components/dashboard/subscription-status-card';
import { Footer } from '~/components/footer';
import { useToast } from '~/hooks/use-toast';
import { useAuthStore } from '~/stores/auth-store';

export default function Dashboard() {
  const { userInfo } = useAuthStore();
  const userName = useMemo(() => {
    return userInfo?.user.user_metadata.name || userInfo?.user.email;
  }, [userInfo]);
  const { toast } = useToast();
  const router = useRouter();

  // Show success toast if user was just upgraded
  useEffect(() => {
    if (router.query.upgraded === 'true') {
      toast({
        title: 'Welcome to Premium! 🎉',
        description:
          'Your subscription has been activated successfully. Enjoy all the premium features!',
      });

      // Remove the query param to prevent showing the toast again on refresh
      const { upgraded: _upgraded, ...restQuery } = router.query;
      router.replace(
        {
          pathname: router.pathname,
          query: restQuery,
        },
        undefined,
        { shallow: true },
      );
    }
  }, [router, toast]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/20">
        <AppHeader />

        {/* Dashboard Content */}
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Header */}
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Welcome back{userName ? `, ${userName}` : ''}!
              </h1>
            </div>

            {/* Main Grid Layout */}
            <div className="space-y-6">
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {/* Subscription Status */}
                <div className="col-span-1">
                  <SubscriptionStatusCard />
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
