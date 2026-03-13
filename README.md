# CreditFlow Demo

A demo app showcasing the full EVM credits lifecycle using the Coinflow sandbox:

1. **Zero Authorization** — add a card on file with a $0 auth (no charge)
2. **Top-Up Credits** — pay via card-on-file endpoint to mint credits to an EVM wallet on Polygon or Base
3. **Redeem Credits** — spend credits when running a service

Deployable to **Vercel** or **Render**.

---

## Demo Flow

```
Connect Wallet
     │
     ▼
Step 1: Zero Auth
  └─ CoinflowPurchase with zeroAuthorizationConfig
  └─ Saves paymentId to localStorage
     │
     ▼
Step 2: Top Up Credits
  ├─ Quick Top-Up: POST /api/top-up → /api/checkout/card-on-file (Coinflow)
  └─ New Card:     CoinflowPurchase with settlementType="Credits"
     │
     ▼
Step 3: Use Service
  └─ Buttons that redeem credits (simulated balance deduction)
```

---

## Stack

- **Next.js 14** (App Router) — API routes + React frontend
- **wagmi v2 + RainbowKit v2** — EVM wallet connection
- **@coinflowlabs/react** — Coinflow checkout iframe
- **Tailwind CSS** — styling
- Chains: **Polygon Amoy** + **Base Sepolia** (testnets)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_COINFLOW_MERCHANT_ID` | Your Coinflow merchant ID |
| `COINFLOW_API_KEY` | Your Coinflow API key (server-side, for card-on-file top-up) |
| `NEXT_PUBLIC_COINFLOW_ENV` | `sandbox` (default) or `prod` |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | From [cloud.walletconnect.com](https://cloud.walletconnect.com) |

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy

### Vercel (recommended)

```bash
npm install -g vercel
vercel
```

Set all env vars in the Vercel dashboard under **Settings → Environment Variables**.
`COINFLOW_API_KEY` is server-side only — do not prefix it with `NEXT_PUBLIC_`.

### Render

1. Create a **Web Service** on [render.com](https://render.com)
2. Build command: `npm install && npm run build`
3. Start command: `npm run start`
4. Add all environment variables in the Render dashboard

---

## Test Cards (Coinflow Sandbox)

| Card | Number |
|---|---|
| Visa | `4111 1111 1111 1111` |
| Mastercard | `5431 1111 1111 1111` |
| Amex | `3782 822463 10005` |
| Discover | `6011 1111 1111 1111` |

Use any future expiry date and any CVV.

---

## Architecture

```
credits-demo/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout + Providers
│   │   ├── page.tsx            # Main dashboard page
│   │   ├── providers.tsx       # wagmi + RainbowKit setup
│   │   └── api/
│   │       └── top-up/
│   │           └── route.ts    # Card-on-file top-up API route
│   ├── components/
│   │   ├── Header.tsx          # Nav + wallet connect
│   │   ├── BalanceCard.tsx     # Credit balance + chain selector
│   │   ├── AddCardStep.tsx     # Step 1: Zero auth
│   │   ├── TopUpStep.tsx       # Step 2: Card-on-file top-up
│   │   └── UseServiceStep.tsx  # Step 3: Redeem credits
│   └── hooks/
│       ├── useEvmWallet.ts     # wagmi → EthWallet adapter
│       ├── useCreditBalance.ts # Credit balance state
│       └── useAppState.ts      # Global app state (chain, paymentId)
```
