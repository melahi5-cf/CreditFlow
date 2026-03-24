'use client';

import {ReactNode} from 'react';
import {WagmiProvider} from 'wagmi';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {RainbowKitProvider, getDefaultConfig, darkTheme} from '@rainbow-me/rainbowkit';
import {baseSepolia} from 'wagmi/chains';
import {defineChain} from 'viem';
import '@rainbow-me/rainbowkit/styles.css';

export const tempoTestnet = defineChain({
  id: 42431,
  name: 'Tempo Testnet',
  nativeCurrency: {name: 'pathUSD', symbol: 'pUSD', decimals: 18},
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_TEMPO_RPC_URL ?? 'https://rpc.moderato.tempo.xyz',
      ],
    },
  },
  blockExplorers: {
    default: {name: 'Tempo Explorer', url: 'https://explore.moderato.tempo.xyz'},
  },
  testnet: true,
});

const config = getDefaultConfig({
  appName: 'CreditFlow Demo',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '2383b9beda863a0b895ff5603b28bd04',
  chains: [baseSepolia, tempoTestnet],
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
