import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RetailDB | Oracle DBA Lab',
  description: 'Live, read-only dashboard for the Oracle DBA operations lab (fictional data).',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
