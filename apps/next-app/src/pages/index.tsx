import { NextSeo } from 'next-seo';
import { HomePageContent } from '~/components/pages/home-page-content';

export default function Home() {
  return (
    <div>
      <NextSeo
        title="Starter Project"
        description="Starter Project"
        canonical="https://starterp.app"
        openGraph={{
          type: 'website',
          url: 'https://starterp.app',
          title: 'Starter Project',
          description: 'Starter Project',
          images: [
            {
              url: 'https://starterp.app/og-home.jpg',
              width: 1200,
              height: 630,
              alt: 'Starter Project - Voice to Text Note Taking',
              type: 'image/jpeg',
            },
            {
              url: 'https://starterp.app/og-home-square.jpg',
              width: 800,
              height: 800,
              alt: 'Starter Project App Logo',
              type: 'image/jpeg',
            },
          ],
          siteName: 'Starter Project',
        }}
        additionalMetaTags={[
          {
            property: 'keywords',
            content: 'starter project, starter project app, starter project ai',
          },
          {
            name: 'author',
            content: 'Starter Project Team',
          },
        ]}
      />
      <HomePageContent />
    </div>
  );
}
