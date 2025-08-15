import {
  Code2,
  CreditCard,
  Crown,
  HomeIcon,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { useIsAdmin } from '~/hooks/auth/use-roles';
import { cn } from '~/lib/utils';
import { useAuthStore } from '~/stores/auth-store';
import { trpc } from '~/utils/trpc';

export function AppHeader() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const isAdmin = useIsAdmin();

  // Get user subscription tier
  const { data: subscription } = trpc.subscription.getMySubscription.useQuery(
    undefined,
    {
      enabled: !!user,
      retry: false,
    },
  );
  const currentTier = subscription?.tier || 'free';

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Get user initials for avatar fallback
  const getUserInitials = (
    email?: string,
    firstName?: string | null,
    lastName?: string | null,
  ) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  // Check if current route matches
  const isActiveRoute = (path: string) => {
    return router.pathname === path;
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo - visible on all screens */}
          <Link href="/" className="flex items-center space-x-2">
            <Code2 className="h-6 w-6 text-primary" />
            <span className="font-semibold sm:inline-block">
              Starter Project
            </span>
          </Link>

          {/* Navigation - responsive design */}
          <div className="flex items-center space-x-2">
            {/* Mobile Navigation - Icon only */}
            <nav className="flex items-center space-x-1 sm:hidden">
              <Link href="/dashboard">
                <Button
                  variant={isActiveRoute('/dashboard') ? 'secondary' : 'ghost'}
                  size="icon"
                  className={cn(
                    'h-9 w-9',
                    isActiveRoute('/dashboard') &&
                      'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary',
                  )}
                >
                  <HomeIcon className="h-5 w-5" />
                  <span className="sr-only">Dashboard</span>
                </Button>
              </Link>
            </nav>

            {/* Desktop Navigation - Full buttons */}
            <nav className="hidden sm:flex items-center space-x-1">
              <Link href="/dashboard">
                <Button
                  variant={isActiveRoute('/dashboard') ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    isActiveRoute('/dashboard') &&
                      'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary',
                  )}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            </nav>

            {/* Current Tier Badge - show for logged in users */}
            {user && (
              <Badge
                variant={currentTier === 'premium' ? 'default' : 'secondary'}
                className="hidden sm:flex items-center space-x-1"
              >
                {currentTier === 'premium' && <Crown className="h-3 w-3" />}
                <span className="text-xs capitalize">{currentTier}</span>
              </Badge>
            )}

            {/* User Avatar with Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full p-0 hover:bg-accent"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={undefined} alt={user?.email} />
                    <AvatarFallback className="bg-primary/10 text-sm">
                      {getUserInitials(
                        user?.email,
                        user?.firstName,
                        user?.lastName,
                      )}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">
                      {user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user?.firstName ||
                          user?.lastName ||
                          user?.email?.split('@')[0]}
                    </p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>
                {/* Show tier in dropdown for mobile */}
                <div className="sm:hidden px-2 pb-2">
                  <Badge
                    variant={
                      currentTier === 'premium' ? 'default' : 'secondary'
                    }
                    className="w-full justify-center"
                  >
                    {currentTier === 'premium' && (
                      <Crown className="h-3 w-3 mr-1" />
                    )}
                    <span className="text-xs capitalize">
                      {currentTier} Plan
                    </span>
                  </Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => router.push('/dashboard/settings')}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => router.push('/dashboard/billing')}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing & Subscription
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => router.push('/admin')}
                    >
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Admin Panel
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
