'use client';

import {ReactNode} from 'react';
import {WagmiProvider} from 'wagmi';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {RainbowKitProvider, getDefaultConfig, darkTheme} from '@rainbow-me/rainbowkit';
import {baseSepolia} from 'wagmi/chains';
import '@rainbow-me/rainbowkit/styles.css';

const config = getDefaultConfig({
  appName: 'CreditFlow Demo',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '2383b9beda863a0b895ff5603b28bd04',
  chains: [baseSepolia],
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({children}: {children: ReactNode}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#6366f1',
            accentColorForeground: 'white',
            borderRadius: 'medium',
            fontStack: 'system',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
