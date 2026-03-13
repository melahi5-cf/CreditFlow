// Base Sepolia credits contract (sandbox / testnet)
export const CREDITS_CONTRACT_ADDRESS =
  '0xbF720eF3c2BC8AA59a282782da26b56918eB3D7a' as const;

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
