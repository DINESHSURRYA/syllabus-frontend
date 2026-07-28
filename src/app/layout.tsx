import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { Suspense } from 'react';
import { Inter, Merriweather, JetBrains_Mono } from 'next/font/google';
import { LoadingProvider } from '@/components/providers/loading-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const merriweather = Merriweather({
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  variable: '--font-merriweather',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Frontend Studio - Syllabus AI',
  description: 'AI-powered curriculum planning platform and syllabus processing studio',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`dark ${inter.variable} ${merriweather.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased selection:bg-indigo-600 selection:text-white">
        <Suspense fallback={null}>
          <ThemeProvider>
            <LoadingProvider>
              {children}
              <Toaster position="top-right" theme="dark" richColors />
            </LoadingProvider>
          </ThemeProvider>
        </Suspense>
      </body>
    </html>
  );
}

