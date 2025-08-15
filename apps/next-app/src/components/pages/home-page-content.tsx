import { ArrowRight, Check, Code2, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';
import { AppHeader } from '~/components/app-header';
import { AuthLink } from '~/components/auth/auth-link';
import { Footer } from '~/components/footer';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { useAuthStore } from '~/stores/auth-store';

export function HomePageContent() {
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const showAuthUI = hasHydrated;

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-gradient-to-br from-background via-background to-muted/10">
      {/* Navigation */}
      {showAuthUI && isAuthenticated ? (
        <AppHeader />
      ) : (
        <nav className="sticky top-0 z-50 nav-apple">
          <div className="container mx-auto px-6">
            <div className="flex h-16 items-center justify-between">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 group-hover:border-primary/30 transition-colors duration-300">
                  <Code2 className="h-5 w-5 text-primary" />
                </div>
                <span className="font-semibold text-lg">Starter</span>
              </Link>
              <div className="flex items-center space-x-4">
                {showAuthUI && (
                  <div className="flex items-center space-x-3">
                    <Link href="/login">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-foreground/70 hover:text-foreground"
                      >
                        Sign In
                      </Button>
                    </Link>
                    <AuthLink href="/dashboard" loginPath="/signup">
                      <Button size="sm" className="btn-apple">
                        Get Started
                      </Button>
                    </AuthLink>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex items-center justify-center py-16">
          <div className="container mx-auto px-6 relative z-10">
            <div className="mx-auto max-w-4xl text-center space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                <span>Production-ready development</span>
              </div>

              {/* Main Heading */}
              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                  <span className="text-gradient">Build</span>
                  <br />
                  <span className="text-foreground">something amazing</span>
                </h1>
                <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  A modern full-stack starter with everything you need to ship
                  faster. Type-safe, scalable, and ready for production.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                {showAuthUI && isAuthenticated ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="btn-apple text-lg px-8 py-4">
                      Go to Dashboard
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </Link>
                ) : showAuthUI ? (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <AuthLink href="/dashboard" loginPath="/signup">
                      <Button size="lg" className="btn-apple text-lg px-8 py-4">
                        Start Building
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                    </AuthLink>
                    <Link href="/login">
                      <Button
                        size="lg"
                        variant="outline"
                        className="text-lg px-8 py-4"
                      >
                        Sign In
                      </Button>
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Everything you need to
                  <span className="text-gradient"> ship faster</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Modern tools and best practices, all in one place
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Feature 1 */}
                <Card className="card-apple animate-fade-in">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 mb-4">
                      <Zap className="h-6 w-6 text-blue-500" />
                    </div>
                    <CardTitle className="text-xl">Lightning Fast</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      Built with Bun for incredible performance. TypeScript
                      support out of the box.
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Feature 2 */}
                <Card
                  className="card-apple animate-fade-in"
                  style={{ animationDelay: '0.1s' }}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 mb-4">
                      <Check className="h-6 w-6 text-green-500" />
                    </div>
                    <CardTitle className="text-xl">Type Safe</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      End-to-end type safety with tRPC and Drizzle ORM. Catch
                      errors before they happen.
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Feature 3 */}
                <Card
                  className="card-apple animate-fade-in"
                  style={{ animationDelay: '0.2s' }}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 mb-4">
                      <Code2 className="h-6 w-6 text-purple-500" />
                    </div>
                    <CardTitle className="text-xl">Full Stack</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      Next.js, Expo, PostgreSQL, and Cloudflare Workers.
                      Everything you need.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="py-16 bg-muted/20">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Built with modern
                <span className="text-gradient"> technologies</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-10">
                Proven tools that scale with your needs
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 mx-auto">
                    <span className="text-xl font-bold text-orange-500">
                      Bun
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Runtime</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 mx-auto">
                    <span className="text-lg font-bold text-blue-500">
                      Next.js
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Frontend</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 mx-auto">
                    <span className="text-xl font-bold text-green-500">
                      tRPC
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">API</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 mx-auto">
                    <span className="text-xl font-bold text-purple-500">
                      Drizzle
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">ORM</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold">
                Ready to start
                <span className="text-gradient"> building?</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Join thousands of developers building amazing things
              </p>

              {showAuthUI && !isAuthenticated && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <AuthLink href="/dashboard" loginPath="/signup">
                    <Button size="lg" className="btn-apple text-lg px-8 py-4">
                      Get Started Free
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </AuthLink>
                  <Link href="/login">
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-lg px-8 py-4"
                    >
                      Sign In
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
