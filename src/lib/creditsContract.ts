// Credits contract addresses per chain (sandbox / testnet)
export const CREDITS_CONTRACT_ADDRESSES: Record<string, `0x${string}`> = {
  base: '0xbF720eF3c2BC8AA59a282782da26b56918eB3D7a',
  tempo: '0x02af2603e2A7d891684854CBC4aaeBa310bf7C1c',
} as const;

export function getCreditsContractAddress(chain: string): `0x${string}` {
  return CREDITS_CONTRACT_ADDRESSES[chain] ?? CREDITS_CONTRACT_ADDRESSES['base'];
}

// Keep backward-compatible export (Base Sepolia)
export const CREDITS_CONTRACT_ADDRESS = CREDITS_CONTRACT_ADDRESSES['base'];

export const CREDITS_ABI = [
  {
    inputs: [
      {name: 'customerWallet_', type: 'address'},
      {name: 'creditSeed_', type: 'string'},
    ],
    name: 'getCreditsBalance',
    outputs: [{type: 'uint256'}],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Credit seed must match what your Coinflow merchant "Credit settings" uses.
// If your dashboard shows "credit seed = cfusd", set NEXT_PUBLIC_COINFLOW_CREDIT_SEED=cfusd.
export const CREDIT_SEED =
  process.env.NEXT_PUBLIC_COINFLOW_CREDIT_SEED ??
  process.env.NEXT_PUBLIC_COINFLOW_MERCHANT_ID ??
  'cfusd';

// On-chain balance is USDC (6 decimals). Display credits = USDC * 100.
// Convert: Number(rawBalance) / 10_000 = displayCredits
// e.g. $5 → 5_000_000 raw → 500 display credits
export const RAW_TO_CREDITS = 10_000;

// Chain IDs for each supported chain
export const CHAIN_IDS: Record<string, number> = {
  base: 84532, // Base Sepolia
  tempo: 42431, // Tempo Testnet (Moderato)
};
