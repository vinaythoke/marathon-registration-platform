import '@/styles/globals.css';
// Using dynamic import instead of next/font to be compatible with Babel
// import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

import { ThemeProvider } from '@/components/providers/theme-provider';
import { OfflineProvider } from '@/context/OfflineContext';
import { OfflineBanner } from '@/components/ui/offline-banner';
import { SiteHeader } from '@/components/navigation/site-header';
import { NProgressProvider } from '@/components/providers/nprogress-provider';
import { DatabaseResetButton } from '@/components/debug/DatabaseResetButton';

// Font handled via CSS instead of next/font
// const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Marathon Registration',
  description: 'Registration platform for marathon events',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create Supabase client with explicit await to ensure it's fully resolved
  const supabase = await createClient();
  
  // Get session data if available
  const sessionResponse = await supabase.auth.getSession();
  const session = sessionResponse.data.session;

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/manifest.json" />
        {/* Add Inter font from Google CDN directly */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-inter">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <NProgressProvider>
            <OfflineProvider>
              <SiteHeader />
              <main className="min-h-screen">
                {children}
              </main>
              <OfflineBanner />
              <DatabaseResetButton />
            </OfflineProvider>
          </NProgressProvider>
        </ThemeProvider>
      </body>
    </html>
  );
} 