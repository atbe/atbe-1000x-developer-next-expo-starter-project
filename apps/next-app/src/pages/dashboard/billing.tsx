import { CreditCard, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppHeader } from '~/components/app-header';
import { ProtectedRoute } from '~/components/auth/protected-route';
import { BillingHistoryTable } from '~/components/dashboard/billing-history-table';
import { SubscriptionStatusCard } from '~/components/dashboard/subscription-status-card';
import { Footer } from '~/components/footer';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { useToast } from '~/hooks/use-toast';
import { trpc } from '~/utils/trpc';

export default function BillingPage() {
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Get current subscription tier
  const { data: subscription, refetch: refetchSubscription } =
    trpc.subscription.getMySubscription.useQuery();

  // Get current Stripe subscription
  const { data: stripeSubscription, refetch: refetchStripeSubscription } =
    trpc.billing.getCurrentSubscription.useQuery();

  // Mutations
  const syncSubscription = trpc.billing.syncMySubscription.useMutation({
    onSuccess: (result) => {
      toast({
        title: result.message,
        status: 'success',
      });
      // Refetch subscription data

      refetchSubscription();
      refetchStripeSubscription();

      setIsSyncing(false);
    },
    onError: (error) => {
      console.error('Failed to sync subscription:', error);
      toast({
        title: 'Failed to sync subscription',
        description: error.message,
      });
      setIsSyncing(false);
    },
  });

  const createPortalSession = trpc.billing.createPortalSession.useMutation({
    onSuccess: () => {
      // Navigation handled in useEffect
    },
    onError: (error) => {
      console.error('Failed to create portal session:', error);
      setIsLoadingPortal(false);
    },
  });

  // Handle navigation with useEffect
  useEffect(() => {
    if (createPortalSession.data?.portalUrl) {
      window.location.href = createPortalSession.data.portalUrl;
    }
  }, [createPortalSession.data?.portalUrl]);

  const handleManageSubscription = () => {
    setIsLoadingPortal(true);
    createPortalSession.mutate({
      returnUrl: `${window.location.origin}/dashboard/billing`,
    });
  };

  const handleSyncSubscription = useCallback(async () => {
    setIsSyncing(true);
    await syncSubscription.mutate();
    await refetchSubscription();
    await refetchStripeSubscription();
    setIsSyncing(false);
  }, [refetchStripeSubscription, refetchSubscription, syncSubscription]);

  // Check if there's a mismatch between local and Stripe subscription
  const hasSubscriptionMismatch = useMemo(() => {
    // Don't show if data is still loading
    if (!subscription) return false;

    // User has Stripe subscription but local shows free
    if (stripeSubscription && subscription.tier === 'free') return true;

    // User has no Stripe subscription but local shows premium
    if (!stripeSubscription && subscription.tier === 'premium') return true;

    return false;
  }, [subscription, stripeSubscription]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <AppHeader />

        <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Billing & Subscription
            </h1>
            <p className="text-muted-foreground">
              Manage your subscription and view billing history
            </p>
          </div>

          {/* Sync Alert if mismatch detected */}
          {hasSubscriptionMismatch && (
            <Card className="mb-6 ring-1 ring-yellow-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-yellow-600" />
                  Subscription Status Mismatch Detected
                </CardTitle>
                <CardDescription>
                  Your subscription status appears to be out of sync.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSyncSubscription}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync Subscription Status
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Current Subscription and Billing Info */}
          <div className="grid gap-6 mb-8 md:grid-cols-2">
            <SubscriptionStatusCard />

            <Card className="ring-1 ring-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  Billing Information
                </CardTitle>
                <CardDescription>
                  Payment method and billing details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-sm text-muted-foreground">
                      Manage your payment methods and billing information
                      through our secure payment portal.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleManageSubscription}
                    disabled={isLoadingPortal || subscription?.tier === 'free'}
                  >
                    {isLoadingPortal ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    )}
                    Open Payment Portal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Billing History */}
          <BillingHistoryTable limit={10} />
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
