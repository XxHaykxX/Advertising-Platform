import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  weight: ['400', '500'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Advertising Platform — Armenia\'s brokered ad marketplace',
  description:
    'Find your next ad slot. We handle the rest. Armenia\'s first brokered marketplace for TV, radio, outdoor, video, and product placement.',
  metadataBase: new URL('https://advertising-platform.am'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-background text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
