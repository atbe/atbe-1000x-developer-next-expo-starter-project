import type { NextPage } from 'next';
import type { AppProps, AppType } from 'next/app';
import type { ReactElement, ReactNode } from 'react';

import { SpeedInsights } from '@vercel/speed-insights/next';
import { DefaultSeo } from 'next-seo';
import { DefaultLayout } from '~/components/DefaultLayout';
import { AuthProvider } from '~/providers/auth-provider';
import { ThemeProvider } from '~/providers/theme-provider';
import { Toaster } from '~/components/ui/toaster';
import { Toaster as Sonner } from 'sonner';
import SEO from '~/lib/next-seo.config';
import '~/styles/globals.css';
import { trpc } from '~/utils/trpc';

export type NextPageWithLayout<
  TProps = Record<string, unknown>,
  TInitialProps = TProps,
> = NextPage<TProps, TInitialProps> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const MyApp = (({ Component, pageProps }: AppPropsWithLayout) => {
  const getLayout =
    Component.getLayout ?? ((page) => <DefaultLayout>{page}</DefaultLayout>);

  return (
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <DefaultSeo {...SEO} />
        {getLayout(
          <>
            <Component {...pageProps} />
            <SpeedInsights />
          </>,
        )}
        <Toaster />
        <Sonner />
      </AuthProvider>
    </ThemeProvider>
  );
}) as AppType;

export default trpc.withTRPC(MyApp);
