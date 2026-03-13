import type {Metadata} from 'next';
import './globals.css';
import {Providers} from './providers';

export const metadata: Metadata = {
  title: 'CreditFlow Demo — EVM Credits on Polygon & Base',
  description:
    'Demo app showing the full EVM credits lifecycle: zero-auth card-on-file setup, credit top-up, and credit redemption on Polygon and Base.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
