'use client';

import Image from 'next/image';
import {ConnectButton} from '@rainbow-me/rainbowkit';
import {useAccount} from 'wagmi';
import coinflowLogo from '@/public/coinflow-logo.png';

export function Header() {
  const {isConnected} = useAccount();

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="h-7 flex items-center">
            <Image src={coinflowLogo} alt="Coinflow" priority className="h-6 w-auto" />
          </div>
          {isConnected && (
            <span className="text-zinc-600 text-xs hidden sm:inline ml-1">
              Demo
            </span>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {!isConnected && (
            <span className="text-zinc-500 text-xs hidden md:inline">
              Sandbox · No real funds
            </span>
          )}
          <ConnectButton
            showBalance={false}
            chainStatus="icon"
            accountStatus="address"
          />
        </div>
      </div>
    </header>
  );
}

