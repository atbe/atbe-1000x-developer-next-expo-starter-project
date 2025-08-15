import { User, Shield, Settings as SettingsIcon } from 'lucide-react';
import { useMemo } from 'react';
import { AppHeader } from '~/components/app-header';
import { ProtectedRoute } from '~/components/auth/protected-route';
import { Footer } from '~/components/footer';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { useToast } from '~/hooks/use-toast';
import { useTokenRefresh } from '~/hooks/use-token-refresh';
import { useAuthStore } from '~/stores/auth-store';
import { useUserRoles } from '~/hooks/auth/use-roles';

export default function Settings() {
  const { toast } = useToast();
  const { user, userInfo } = useAuthStore();
  const { refreshToken } = useTokenRefresh();
  const userRoles = useUserRoles();

  console.log('user', user, userInfo);

  const firstName = useMemo(
    () => userInfo?.user?.app_metadata?.first_name ?? '',
    [userInfo],
  );
  const lastName = useMemo(
    () => userInfo?.user?.app_metadata?.last_name ?? '',
    [userInfo],
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
        <AppHeader />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 mb-4">
                <SettingsIcon className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
                Manage your account settings and preferences with ease
              </p>
            </div>

            {/* Profile Information Card */}
            <Card className="card-apple animate-fade-in">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                    <User className="h-5 w-5 text-blue-500" />
                  </div>
                  Profile Information
                </CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Update your personal information. Changes are saved
                  automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-3">
                    <Label
                      htmlFor="firstName"
                      className="text-sm font-medium text-foreground/80"
                    >
                      First Name
                    </Label>
                    <div className="relative group">
                      <Input
                        id="firstName"
                        type="text"
                        value={firstName}
                        placeholder="Enter your first name"
                        disabled={true}
                        className="input-apple bg-background/30 backdrop-blur-apple border-border/30 focus:border-primary/50 focus:bg-background/50 transition-all duration-300"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="lastName"
                      className="text-sm font-medium text-foreground/80"
                    >
                      Last Name
                    </Label>
                    <div className="relative group">
                      <Input
                        id="lastName"
                        type="text"
                        value={lastName}
                        placeholder="Enter your last name"
                        disabled={true}
                        className="input-apple bg-background/30 backdrop-blur-apple border-border/30 focus:border-primary/50 focus:bg-background/50 transition-all duration-300"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border/30">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground/80">
                      Email Address
                    </Label>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 backdrop-blur-apple border border-border/20">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      </div>
                      <span className="text-sm font-medium">{user?.email}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Information Card */}
            <Card
              className="card-apple animate-fade-in"
              style={{ animationDelay: '0.1s' }}
            >
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                    <Shield className="h-5 w-5 text-purple-500" />
                  </div>
                  Account Information
                </CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  View your account details and subscription status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground/80">
                      Account ID
                    </Label>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 backdrop-blur-apple border border-border/20">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      </div>
                      <span className="text-sm font-mono font-medium">
                        {user?.id}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground/80">
                      Account Type
                    </Label>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 backdrop-blur-apple border border-border/20">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                      </div>
                      <span className="text-sm font-medium capitalize">
                        {userRoles.length > 0 ? userRoles.join(', ') : 'user'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Debug section - remove in production */}
                <div className="pt-6 border-t border-border/30">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      </div>
                      <span className="text-sm font-medium text-foreground/80">
                        Debug Tools
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        await refreshToken();
                        toast({
                          title: 'Token refreshed',
                          description: 'Your token has been refreshed',
                          variant: 'default',
                        });
                      }}
                      disabled={false}
                      className="w-full sm:w-auto"
                    >
                      Refresh Token (Debug)
                    </Button>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Click to manually refresh your authentication token.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
