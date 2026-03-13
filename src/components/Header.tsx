'use client';

import {ConnectButton} from '@rainbow-me/rainbowkit';
import {useAccount} from 'wagmi';

export function Header() {
  const {isConnected} = useAccount();

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="8" cy="8" r="3" fill="white" />
              <path
                d="M8 1v2M8 13v2M1 8h2M13 8h2"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-white font-semibold text-sm">CreditFlow</span>
          {isConnected && (
            <span className="text-zinc-600 text-xs hidden sm:inline">Demo</span>
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
