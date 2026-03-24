'use client';

import {useState, useCallback} from 'react';
import {useReadContract} from 'wagmi';
import {CREDITS_ABI, RAW_TO_CREDITS, CHAIN_IDS} from '@/lib/creditsContract';
import type {LogEntry} from './useCreditBalance';

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

const MINT_POLLING_INTERVAL_MS = 3_000;
const MINT_TIMEOUT_MS = 5 * 60 * 1_000; // 5 minutes

export function useConfigurableCreditBalance({
  walletAddress,
  chain,
  creditSeed,
  creditsContractAddress,
}: {
  walletAddress: string | undefined;
  chain: string;
  creditSeed: string;
  creditsContractAddress: `0x${string}`;
}): CreditBalanceState {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [pendingCredits, setPendingCredits] = useState(0);
  const [mintStartTime, setMintStartTime] = useState<Date | null>(null);
  const [mintTimedOut, setMintTimedOut] = useState(false);

  const {
    data: rawBalance,
    isLoading: isLoadingBalance,
    refetch,
  } = useReadContract({
    address: creditsContractAddress,
    abi: CREDITS_ABI,
    functionName: 'getCreditsBalance',
    args:
      walletAddress && creditSeed
        ? [walletAddress as `0x${string}`, creditSeed]
        : undefined,
    chainId: CHAIN_IDS[chain] ?? CHAIN_IDS['base'],
    query: {
      enabled: Boolean(walletAddress && creditSeed),
      refetchInterval: 10_000,
    },
  });

  const onChainBalance =
    rawBalance !== undefined ? Math.floor(Number(rawBalance) / RAW_TO_CREDITS) : 0;

  const balance = onChainBalance + pendingCredits;

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

      const expectedRaw = (rawBalance ?? BigInt(0)) + BigInt(amount * RAW_TO_CREDITS);

      const interval = setInterval(async () => {
        const result = await refetch();
        const newRaw = result.data ?? BigInt(0);
        if (newRaw >= expectedRaw) {
          setPendingCredits(prev => Math.max(0, prev - amount));
          setMintStartTime(null);
          setMintTimedOut(false);
          clearInterval(interval);
        }
      }, MINT_POLLING_INTERVAL_MS);

      setTimeout(() => {
        clearInterval(interval);
        setPendingCredits(prev => Math.max(0, prev - amount));
        setMintStartTime(null);
        setMintTimedOut(true);
      }, MINT_TIMEOUT_MS);
    },
    [refetch, rawBalance],
  );

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

      const expectedRaw = (rawBalance ?? BigInt(0)) - BigInt(amount * RAW_TO_CREDITS);

      const interval = setInterval(async () => {
        const result = await refetch();
        const newRaw = result.data ?? BigInt(0);
        if (newRaw <= expectedRaw) {
          setPendingCredits(prev => Math.min(0, prev + amount));
          clearInterval(interval);
        }
      }, MINT_POLLING_INTERVAL_MS);

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

