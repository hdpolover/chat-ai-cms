import './globals.css';
import { Metadata } from 'next';
import ClientProviders from '@/components/providers/ClientProviders';

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
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}