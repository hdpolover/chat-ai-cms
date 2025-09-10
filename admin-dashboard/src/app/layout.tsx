import './globals.css';
import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ClientProviders from '@/components/providers/ClientProviders';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Chat AI CMS Admin Dashboard',
  description: 'Administrative dashboard for managing tenants and system settings',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}