import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles
import { GlobalHeader } from '@/components/GlobalHeader';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Tier List Maker',
  description: 'Create and share custom tier lists with a modern interface.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body suppressHydrationWarning className="font-sans">
        <GlobalHeader />
        {children}
      </body>
    </html>
  );
}
