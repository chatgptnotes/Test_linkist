import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import GDPRConsentBanner from '@/components/gdpr-consent-banner';
import { ToastProvider } from '@/components/ToastProvider';
import AdminInitializer from '@/components/AdminInitializer';
import ConditionalLayout from '@/components/ConditionalLayout';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Linkist NFC - Smart Business Cards",
  description: "Create premium NFC business cards with instant contact sharing. Tap to connect.",
  keywords: "NFC, business cards, smart cards, digital business card, contactless",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    android: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
    ]
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: "Linkist NFC - Smart Business Cards",
    description: "Create premium NFC business cards with instant contact sharing",
    url: "https://linkist.ai/nfc",
    siteName: "Linkist",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="m-0 p-0">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        {/* Capture PWA install prompt globally before React hydrates */}
        <script dangerouslySetInnerHTML={{
          __html: `
            window.deferredPrompt = null;
            window.addEventListener('beforeinstallprompt', function(e) {
              e.preventDefault();
              window.deferredPrompt = e;
              console.log('✅ PWA install prompt captured globally');
            });
          `
        }} />
      </head>
      <body className={`${inter.className} antialiased bg-black min-h-screen flex flex-col m-0 p-0`}>
        <AdminInitializer />
        <Toaster position="top-center" richColors />
        <ToastProvider>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
          <GDPRConsentBanner />
        </ToastProvider>
      </body>
    </html>
  );
}
