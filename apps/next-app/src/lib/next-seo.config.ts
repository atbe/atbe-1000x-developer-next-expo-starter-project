import type { DefaultSeoProps } from 'next-seo';

const config: DefaultSeoProps = {
  defaultTitle: 'Starter Project - Voice-Based Note Taking',
  titleTemplate: '%s | Starter Project',
  description: 'Starter Project',
  canonical: 'https://starterp.app',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://starterp.app',
    siteName: 'Starter Project',
    title: 'Starter Project',
    description: 'Starter Project',
    images: [
      {
        url: 'https://starterp.app/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Starter Project - Voice Diction That Actually Works',
      },
    ],
  },
  twitter: {
    handle: '@starterpapp',
    site: '@starterpapp',
    cardType: 'summary_large_image',
  },
  additionalLinkTags: [
    {
      rel: 'icon',
      href: '/favicon.ico',
    },
    {
      rel: 'apple-touch-icon',
      href: '/apple-touch-icon.png',
      sizes: '180x180',
    },
  ],
  additionalMetaTags: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    },
    {
      name: 'mobile-web-app-capable',
      content: 'yes',
    },
    {
      name: 'apple-mobile-web-app-status-bar-style',
      content: 'default',
    },
  ],
};

export default config;
