'use client';

import {useState, useCallback} from 'react';

export type Chain = 'base' | 'tempo';

interface AppState {
  chain: Chain;
  setChain: (chain: Chain) => void;
  cardPaymentId: string | null;
  onCardAdded: (paymentId: string) => void;
  clearCard: () => void;
}

const STORAGE_KEY = 'creditflow_demo_payment_id';

function getStoredPaymentId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function useAppState(): AppState {
  const [chain, setChain] = useState<Chain>('base');
  const [cardPaymentId, setCardPaymentId] = useState<string | null>(
    getStoredPaymentId
  );

  const onCardAdded = useCallback((paymentId: string) => {
    setCardPaymentId(paymentId);
    localStorage.setItem(STORAGE_KEY, paymentId);
  }, []);

  const clearCard = useCallback(() => {
    setCardPaymentId(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return {chain, setChain, cardPaymentId, onCardAdded, clearCard};
}
