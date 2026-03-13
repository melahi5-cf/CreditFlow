'use client';

import {useState} from 'react';
import {CoinflowPurchase, SettlementType, Currency} from '@coinflowlabs/react';
import {useEvmWallet} from '@/hooks/useEvmWallet';
import {ApiCall} from '@/types';
import axios from 'axios';

type Chain = 'polygon' | 'base';

interface TopUpStepConfigurableProps {
  chain: Chain;
  walletAddress: string;
  cardPaymentId: string | null;
  merchantId: string;
  apiKey: string;
  env: 'sandbox' | 'staging' | 'prod';
  onSuccess: (creditAmount: number, label: string) => void;
  onApiCall?: (call: Omit<ApiCall, 'id'>) => void;
  isEnabled: boolean;
}

type TopUpMode = 'idle' | 'quick' | 'checkout';

const QUICK_TOP_UP_OPTIONS = [
  {label: '$5', dollars: 5, credits: 500},
  {label: '$10', dollars: 10, credits: 1000},
  {label: '$25', dollars: 25, credits: 2500},
  {label: '$50', dollars: 50, credits: 5000},
];

export function TopUpStepConfigurable({
  chain,
  walletAddress,
  cardPaymentId,
  merchantId,
  apiKey,
  env,
  onSuccess,
  onApiCall,
  isEnabled,
}: TopUpStepConfigurableProps) {
  const [mode, setMode] = useState<TopUpMode>('idle');
  const [selectedOption, setSelectedOption] = useState(QUICK_TOP_UP_OPTIONS[1]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wallet = useEvmWallet();

  function getDeviceId(): string {
    if (typeof window === 'undefined') return 'server';
    const key = 'coinflow_demo_device_id';
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const id =
      (typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`) as string;
    window.localStorage.setItem(key, id);
    return id;
  }

  async function handleQuickTopUp() {
    if (!cardPaymentId || !walletAddress) return;
    setMode('quick');
    setIsLoading(true);
    setError(null);

    const payload = {
      paymentId: `${cardPaymentId.slice(0, 8)}…`,
      amountCents: selectedOption.dollars * 100,
      wallet: `${walletAddress.slice(0, 8)}…`,
      blockchain: chain,
      merchantId,
      env,
    };

    try {
      const deviceId = getDeviceId();
      const response = await axios.post(
        '/api/configurable/top-up',
        {
          paymentId: cardPaymentId,
          amountCents: selectedOption.dollars * 100,
          wallet: walletAddress,
          blockchain: chain,
          merchantId,
          apiKey,
          env,
        },
        {
          headers: {
            'x-device-id': deviceId,
          },
        }
      );
      onApiCall?.({
        timestamp: new Date(),
        method: 'POST',
        endpoint:
          'POST /api/configurable/top-up → Coinflow /api/checkout/card-on-file',
        payload,
        status: response.status,
        response: JSON.stringify(response.data, null, 2),
      });
      onSuccess(
        selectedOption.credits,
        `Quick top-up ${selectedOption.label} via card on file`
      );
      setMode('idle');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status ?? 'error';
        const errorData = err.response?.data;
        onApiCall?.({
          timestamp: new Date(),
          method: 'POST',
          endpoint:
            'POST /api/configurable/top-up → Coinflow /api/checkout/card-on-file',
          payload,
          status,
          response: JSON.stringify(errorData ?? err.message, null, 2),
        });
        const details =
          typeof errorData === 'object' && errorData
            ? (errorData as any).details ?? (errorData as any).message
            : undefined;

        const isThreeDsRequired =
          status === 400 &&
          typeof details === 'string' &&
          details.toLowerCase().includes('3ds');

        if (status === 401 || status === 403 || isThreeDsRequired) {
          setError(null);
          setMode('checkout');
        } else {
          const rawError =
            (typeof errorData === 'object' && (errorData as any).error) ||
            (typeof errorData === 'object' && (errorData as any).message) ||
            err.message;

          const message =
            typeof rawError === 'string'
              ? rawError
              : JSON.stringify(rawError, null, 2);

          setError(message);
          setMode('idle');
        }
      } else {
        setError('Top-up failed. Please try again.');
        setMode('idle');
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleCheckoutSuccess() {
    onApiCall?.({
      timestamp: new Date(),
      method: 'POST',
      endpoint: 'Coinflow checkout iframe → purchase complete',
      payload: {
        amountCents: selectedOption.dollars * 100,
        settlementType: 'Credits',
      },
      status: 200,
      response: `"Checkout success — ${selectedOption.credits} credits minted on-chain"`,
    });
    onSuccess(
      selectedOption.credits,
      `Top-up ${selectedOption.label} via checkout`
    );
    setMode('idle');
  }

  const stepComplete = false;

  return (
    <div
      className={`bg-zinc-900 border rounded-xl p-5 flex flex-col transition-opacity ${
        isEnabled ? 'border-zinc-800 opacity-100' : 'border-zinc-800/50 opacity-50'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <StepBadge step={2} isEnabled={isEnabled} isComplete={stepComplete} />
        <div>
          <h3 className="text-white text-sm font-medium">Top Up Credits</h3>
          <p className="text-zinc-500 text-xs mt-0.5">
            {isEnabled
              ? 'Pay via card on file or new checkout'
              : 'Complete Step 1 to unlock'}
          </p>
        </div>
      </div>

      {isEnabled && (
        <>
          {/* Amount picker */}
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {QUICK_TOP_UP_OPTIONS.map(opt => (
              <button
                key={opt.dollars}
                onClick={() => setSelectedOption(opt)}
                disabled={!isEnabled || mode !== 'idle'}
                className={`rounded-lg py-2 text-xs font-medium transition-colors ${
                  selectedOption.dollars === opt.dollars
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <p className="text-zinc-600 text-xs mb-3 text-center">
            = {selectedOption.credits.toLocaleString()} credits
          </p>

          {mode === 'idle' && (
            <div className="space-y-2">
              {/* Card-on-file quick top-up */}
              <button
                onClick={handleQuickTopUp}
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                </svg>
                Quick Top-Up (Card on File)
              </button>

              {/* Coinflow checkout fallback */}
              <button
                onClick={() => setMode('checkout')}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
              >
                Pay with New Card
              </button>
            </div>
          )}

          {mode === 'quick' && isLoading && (
            <div className="flex items-center justify-center gap-2 py-4 text-zinc-400 text-sm animate-fade-in">
              <Spinner />
              Processing card on file…
            </div>
          )}

          {mode === 'checkout' && wallet.address && (
            <div className="mt-3 animate-fade-in">
              <div className="coinflow-iframe-container">
                <CoinflowPurchase
                  wallet={wallet}
                  merchantId={merchantId}
                  env={env}
                  blockchain={chain}
                  settlementType={SettlementType.Credits}
                  subtotal={{
                    cents: selectedOption.dollars * 100,
                    currency: Currency.USD,
                  }}
                  onSuccess={handleCheckoutSuccess}
                  loaderBackground="#18181b"
                  origins={
                    typeof window !== 'undefined' ? [window.location.origin] : []
                  }
                />
              </div>
              <button
                onClick={() => setMode('idle')}
                className="mt-2 w-full text-xs text-zinc-500 hover:text-zinc-400 transition-colors py-1.5"
              >
                Cancel
              </button>
            </div>
          )}

          {error && (
            <div className="mt-3 bg-red-950 border border-red-800 rounded-lg px-3 py-2 text-red-300 text-xs animate-fade-in">
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin w-4 h-4"
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
  );
}

function StepBadge({
  step,
  isEnabled,
  isComplete,
}: {
  step: number;
  isEnabled: boolean;
  isComplete: boolean;
}) {
  if (isComplete) {
    return (
      <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
        <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
        isEnabled
          ? 'bg-indigo-600 border border-indigo-500'
          : 'bg-zinc-700 border border-zinc-600'
      }`}
    >
      <span className="text-white text-xs font-bold">{step}</span>
    </div>
  );
}

