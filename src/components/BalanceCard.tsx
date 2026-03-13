'use client';

import {useEffect, useState} from 'react';

interface BalanceCardProps {
  balance: number;
  isLoadingBalance: boolean;
  hasPendingTopUp?: boolean;
  pendingCredits?: number;
  mintStartTime?: Date | null;
  mintTimedOut?: boolean;
  onRefresh?: () => void;
  walletAddress: string;
}

export function BalanceCard({
  balance,
  isLoadingBalance,
  hasPendingTopUp,
  pendingCredits,
  mintStartTime,
  mintTimedOut,
  onRefresh,
  walletAddress,
}: BalanceCardProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Tick elapsed time every second while a top-up is pending
  useEffect(() => {
    if (!mintStartTime) {
      setElapsedSeconds(0);
      return;
    }
    const tick = () =>
      setElapsedSeconds(Math.floor((Date.now() - mintStartTime.getTime()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [mintStartTime]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Balance */}
        <div>
          <p className="text-zinc-500 text-xs font-medium uppercase tracking-wide mb-1">
            Credit Balance · on-chain
          </p>
          <div className="flex items-end gap-2">
            {isLoadingBalance ? (
              <span className="text-4xl font-bold text-zinc-600 tabular-nums animate-pulse">
                —
              </span>
            ) : (
              <span className="text-4xl font-bold text-white tabular-nums">
                {balance.toLocaleString()}
              </span>
            )}
            <span className="text-zinc-500 text-sm mb-1">credits</span>
          </div>

          {/* Minting in progress — amber spinner + elapsed time */}
          {hasPendingTopUp && pendingCredits !== undefined && pendingCredits > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <svg
                className="animate-spin w-3 h-3 text-amber-400 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span className="text-amber-400 text-xs">
                +{pendingCredits.toLocaleString()} credits minting on-chain
                {elapsedSeconds > 0 && (
                  <span className="text-amber-600 ml-1">({elapsedSeconds}s)</span>
                )}
              </span>
            </div>
          )}

          {/* Sandbox can take a few minutes — help text */}
          {hasPendingTopUp && elapsedSeconds > 30 && (
            <p className="text-zinc-600 text-xs mt-1">
              Sandbox worker can take 1–3 min to mint — hang tight or refresh.
            </p>
          )}

          {/* Timed out — minting took longer than 5 min */}
          {mintTimedOut && !hasPendingTopUp && (
            <p className="text-amber-600 text-xs mt-1">
              Credits may still be minting. Hit Refresh to check.
            </p>
          )}

          {!isLoadingBalance && balance === 0 && !hasPendingTopUp && !mintTimedOut && (
            <p className="text-zinc-600 text-xs mt-1">
              Add a card and top up to get started
            </p>
          )}
        </div>

        {/* Right side: chain badge + wallet + refresh */}
        <div className="flex flex-col items-start sm:items-end gap-3">
          {/* Chain badge — locked to Base Sepolia */}
          <div className="inline-flex items-center gap-1.5 bg-blue-950 border border-blue-800 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full text-blue-400 bg-current" />
            <span className="text-blue-400 text-xs font-medium">
              Base Sepolia · Testnet
            </span>
          </div>

          {/* Wallet */}
          <p className="text-zinc-600 text-xs font-mono">
            {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
          </p>

          {/* Refresh button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
            >
              <svg
                className="w-3 h-3"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
              Refresh Balance
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
