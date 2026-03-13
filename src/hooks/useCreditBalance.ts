'use client';

import {useState, useCallback} from 'react';
import {useReadContract} from 'wagmi';
import {baseSepolia} from 'wagmi/chains';
import {
  CREDITS_ABI,
  CREDITS_CONTRACT_ADDRESS,
  CREDIT_SEED,
  RAW_TO_CREDITS,
} from '@/lib/creditsContract';

export interface LogEntry {
  id: string;
  type: 'topup' | 'spend';
  label: string;
  amount: number;
  timestamp: Date;
}

interface CreditBalanceState {
  balance: number;
  isLoadingBalance: boolean;
  hasPendingTopUp: boolean;
  pendingCredits: number;
  mintStartTime: Date | null;
  mintTimedOut: boolean;
  log: LogEntry[];
  addCredits: ({amount, label}: {amount: number; label: string}) => void;
  spendCredits: ({amount, label}: {amount: number; label: string}) => void;
  refetchBalance: () => void;
}

// How long to keep the optimistic pending overlay before giving up and showing real on-chain balance.
// Sandbox worker can take several minutes; 5 minutes is a safe upper bound.
const MINT_POLLING_INTERVAL_MS = 3_000;
const MINT_TIMEOUT_MS = 5 * 60 * 1_000; // 5 minutes

export function useCreditBalance({
  walletAddress,
}: {
  walletAddress: string | undefined;
}): CreditBalanceState {
  const [log, setLog] = useState<LogEntry[]>([]);
  // Optimistic offset: positive after top-up (before on-chain confirms),
  // negative after redeem (before on-chain confirms the burn).
  const [pendingCredits, setPendingCredits] = useState(0);
  // When the most recent optimistic top-up started (for elapsed-time display)
  const [mintStartTime, setMintStartTime] = useState<Date | null>(null);
  // True if we waited the full 5 minutes without an on-chain confirmation
  const [mintTimedOut, setMintTimedOut] = useState(false);

  const {
    data: rawBalance,
    isLoading: isLoadingBalance,
    refetch,
  } = useReadContract({
    address: CREDITS_CONTRACT_ADDRESS,
    abi: CREDITS_ABI,
    functionName: 'getCreditsBalance',
    args: walletAddress ? [walletAddress as `0x${string}`, CREDIT_SEED] : undefined,
    chainId: baseSepolia.id,
    query: {
      enabled: Boolean(walletAddress),
      refetchInterval: 10_000, // keep polling every 10 s
    },
  });

  const onChainBalance =
    rawBalance !== undefined ? Math.floor(Number(rawBalance) / RAW_TO_CREDITS) : 0;

  // Displayed balance = on-chain confirmed + optimistic pending
  const balance = onChainBalance + pendingCredits;

  // addCredits: called after a successful top-up API response.
  // Coinflow mints credits asynchronously (worker pipeline). In sandbox the worker
  // can take several minutes, so we:
  //   1. Immediately show the expected credits (optimistic update)
  //   2. Record when the mint started so the UI can show elapsed time
  //   3. Poll every 3 s for up to 5 minutes; clear pending once on-chain confirms
  //   4. If 5 minutes pass without confirmation, clear pending and show a timeout warning
  const addCredits = useCallback(
    ({amount, label}: {amount: number; label: string}) => {
      setPendingCredits(prev => prev + amount);
      setMintStartTime(new Date());
      setMintTimedOut(false);
      setLog(prev => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          type: 'topup',
          label,
          amount,
          timestamp: new Date(),
        },
      ]);

      // Target raw balance we expect once Coinflow's worker mints on-chain
      const expectedRaw = (rawBalance ?? BigInt(0)) + BigInt(amount * RAW_TO_CREDITS);

      const interval = setInterval(async () => {
        const result = await refetch();
        const newRaw = result.data ?? BigInt(0);
        if (newRaw >= expectedRaw) {
          // On-chain confirmed — remove the optimistic offset and clear the timer
          setPendingCredits(prev => Math.max(0, prev - amount));
          setMintStartTime(null);
          setMintTimedOut(false);
          clearInterval(interval);
        }
      }, MINT_POLLING_INTERVAL_MS);

      // After 5 minutes give up waiting, reset the pending overlay, and let the
      // 10 s base refetch show whatever the real on-chain balance is.
      setTimeout(() => {
        clearInterval(interval);
        setPendingCredits(prev => Math.max(0, prev - amount));
        setMintStartTime(null);
        setMintTimedOut(true);
      }, MINT_TIMEOUT_MS);
    },
    [refetch, rawBalance],
  );

  // spendCredits: called after a successful redeem tx.
  // The gasless tx lands on-chain in seconds, so we optimistically subtract
  // immediately and poll until the on-chain balance confirms the burn.
  const spendCredits = useCallback(
    ({amount, label}: {amount: number; label: string}) => {
      setPendingCredits(prev => prev - amount);
      setLog(prev => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          type: 'spend',
          label,
          amount,
          timestamp: new Date(),
        },
      ]);

      // Target raw balance we expect once the on-chain burn is confirmed
      const expectedRaw = (rawBalance ?? BigInt(0)) - BigInt(amount * RAW_TO_CREDITS);

      const interval = setInterval(async () => {
        const result = await refetch();
        const newRaw = result.data ?? BigInt(0);
        if (newRaw <= expectedRaw) {
          // On-chain confirmed — remove the optimistic negative offset
          setPendingCredits(prev => Math.min(0, prev + amount));
          clearInterval(interval);
        }
      }, MINT_POLLING_INTERVAL_MS);

      // Spend confirmations should be fast; give it 2 minutes
      setTimeout(() => clearInterval(interval), 2 * 60 * 1_000);
    },
    [refetch, rawBalance],
  );

  const refetchBalance = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    balance,
    isLoadingBalance,
    hasPendingTopUp: pendingCredits > 0,
    pendingCredits,
    mintStartTime,
    mintTimedOut,
    log,
    addCredits,
    spendCredits,
    refetchBalance,
  };
}
