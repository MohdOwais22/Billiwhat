import type { Metadata, Viewport } from 'next';
import { APP_NAME } from '@/config/brand';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0F172A',
};

export const metadata: Metadata = {
  title: `${APP_NAME} — AI Business Assistant for Indian Distributors`,
  description: 'Bill. Collect. Reconcile. Automated WhatsApp billing, smart payment collection reminders, and e-invoicing for Indian wholesalers and distributors.',
  keywords: [
    APP_NAME,
    'WhatsApp Billing India',
    'GST Invoicing Software',
    'Distributor Billing App',
    'WhatsApp Payment Reminders',
    'E-invoicing India',
    'Tally WhatsApp Integration',
  ],
  authors: [{ name: `${APP_NAME} Technologies` }],
  openGraph: {
    title: `${APP_NAME} — AI Business Assistant for Indian Distributors`,
    description: 'Bill. Collect. Reconcile on WhatsApp.',
    url: 'https://whatsbill.in',
    siteName: APP_NAME,
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} — WhatsApp Invoicing & Receivables for Indian Wholesalers`,
    description: 'Collect outstanding payments 3x faster with automated WhatsApp payment reminders and UPI payment links.',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en_IN">
      <body className="min-h-screen bg-slate-50 antialiased font-sans text-slate-900">
        {children}
      </body>
    </html>
  );
}
