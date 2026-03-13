'use client';

import {useEffect, useState} from 'react';
import {CREDIT_SEED, CREDITS_CONTRACT_ADDRESS} from '@/lib/creditsContract';

type Env = 'sandbox' | 'staging' | 'prod';

export interface SandboxConfig {
  merchantId: string;
  apiKey: string;
  env: Env;
  redeemDestinationWallet: string;
  creditSeed: string;
  creditsContractAddress: string;
}

interface UseSandboxConfigResult {
  config: SandboxConfig;
  setConfig: (update: Partial<SandboxConfig>) => void;
}

const STORAGE_KEY = 'coinflow_sandbox_demo_config';

const DEFAULT_ENV = (process.env.NEXT_PUBLIC_COINFLOW_ENV ?? 'sandbox') as Env;
const DEFAULT_MERCHANT_ID = process.env.NEXT_PUBLIC_COINFLOW_MERCHANT_ID ?? '';
const DEFAULT_API_KEY = process.env.COINFLOW_API_KEY ?? '';
const DEFAULT_REDEEM_DESTINATION_WALLET =
  process.env.COINFLOW_REDEEM_DESTINATION_WALLET ?? '';
const DEFAULT_CREDIT_SEED = CREDIT_SEED;
const DEFAULT_CREDITS_CONTRACT_ADDRESS = CREDITS_CONTRACT_ADDRESS;

function getInitialConfig(): SandboxConfig {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SandboxConfig>;
        return {
          merchantId: parsed.merchantId ?? DEFAULT_MERCHANT_ID,
          apiKey: parsed.apiKey ?? DEFAULT_API_KEY,
          env: (parsed.env as Env) ?? DEFAULT_ENV,
          redeemDestinationWallet:
            parsed.redeemDestinationWallet ?? DEFAULT_REDEEM_DESTINATION_WALLET,
          creditSeed: parsed.creditSeed ?? DEFAULT_CREDIT_SEED,
          creditsContractAddress:
            parsed.creditsContractAddress ?? DEFAULT_CREDITS_CONTRACT_ADDRESS,
        };
      }
    } catch {
      // ignore and fall back to defaults
    }
  }

  return {
    merchantId: DEFAULT_MERCHANT_ID,
    apiKey: DEFAULT_API_KEY,
    env: DEFAULT_ENV,
    redeemDestinationWallet: DEFAULT_REDEEM_DESTINATION_WALLET,
    creditSeed: DEFAULT_CREDIT_SEED,
    creditsContractAddress: DEFAULT_CREDITS_CONTRACT_ADDRESS,
  };
}

export function useSandboxConfig(): UseSandboxConfigResult {
  const [config, setConfigState] = useState<SandboxConfig>(getInitialConfig);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  function setConfig(update: Partial<SandboxConfig>) {
    setConfigState(prev => ({...prev, ...update}));
  }

  return {config, setConfig};
}

