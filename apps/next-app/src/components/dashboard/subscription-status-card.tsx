import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Loader2, Crown, Sparkles } from 'lucide-react';
import { trpc } from '~/utils/trpc';
import { useRouter } from 'next/router';

export function SubscriptionStatusCard() {
  const router = useRouter();
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);

  // Fetch current subscription
  const { data: currentSubscription, isLoading: isLoadingSubscription } =
    trpc.billing.getCurrentSubscription.useQuery();

  // Get current subscription tier
  const { data: subscription } = trpc.subscription.getMySubscription.useQuery();

  const createCheckoutSession = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: () => {
      // Navigation handled in useEffect
    },
    onError: (error) => {
      console.error('Failed to create checkout session:', error);
      setIsLoadingCheckout(false);
    },
  });

  // Handle navigation with useEffect
  useEffect(() => {
    if (createCheckoutSession.data?.checkoutUrl) {
      window.location.href = createCheckoutSession.data.checkoutUrl;
    }
  }, [createCheckoutSession.data?.checkoutUrl]);

  const handleUpgrade = () => {
    setIsLoadingCheckout(true);
    const priceId =
      process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || 'price_1234567890';

    createCheckoutSession.mutate({
      priceId,
      successUrl: `${window.location.origin}/dashboard?upgraded=true`,
      cancelUrl: `${window.location.origin}/dashboard`,
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  return (
    <Card
      className={`relative overflow-hidden h-full ${subscription?.tier === 'premium' ? 'ring-2 ring-yellow-500/50 shadow-lg' : ''}`}
    >
      {subscription?.tier === 'premium' && (
        <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-yellow-400/10 to-orange-400/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16" />
      )}
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          Current Plan
          {subscription?.tier === 'premium' && (
            <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
          )}
        </CardTitle>
        <CardDescription className="text-sm">
          Your active subscription
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingSubscription ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-base sm:text-lg font-medium">Plan</span>
              <Badge
                variant={
                  subscription?.tier === 'premium' ? 'default' : 'secondary'
                }
                className={
                  subscription?.tier === 'premium'
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0'
                    : ''
                }
              >
                {subscription?.tier === 'premium' ? 'Premium' : 'Free'}
              </Badge>
            </div>

            {currentSubscription && (
              <>
                {currentSubscription.cancelAtPeriodEnd && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Notice
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
                    >
                      Your subscription is canceled
                    </Badge>
                  </div>
                )}

                {currentSubscription.currentPeriodEnd && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 rounded-lg bg-secondary/50 gap-1">
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {currentSubscription.cancelAtPeriodEnd
                        ? 'Premium access expires'
                        : 'Next billing date'}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400">
                      {format(
                        new Date(currentSubscription.currentPeriodEnd * 1000),
                        'MMM dd, yyyy',
                      )}
                    </span>
                  </div>
                )}

                {currentSubscription.items[0] && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 gap-1">
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      Price
                    </span>
                    <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {formatCurrency(
                        currentSubscription.items[0].unitAmount || 0,
                        currentSubscription.items[0].currency || 'usd',
                      )}
                      <span className="text-sm">
                        /{currentSubscription.items[0].interval}
                      </span>
                    </span>
                  </div>
                )}
              </>
            )}

            <div className="pt-2 sm:pt-4 space-y-2">
              {subscription?.tier === 'free' ? (
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm sm:text-base"
                  onClick={handleUpgrade}
                  disabled={isLoadingCheckout}
                >
                  {isLoadingCheckout ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Upgrade to Premium
                </Button>
              ) : (
                <Button
                  className="w-full text-sm sm:text-base"
                  variant="outline"
                  onClick={() => router.push('/dashboard/billing')}
                >
                  Manage Subscription
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
