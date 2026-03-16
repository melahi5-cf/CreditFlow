'use client';

import {useState} from 'react';
import {CoinflowPurchase, SettlementType} from '@coinflowlabs/react';
import {useEvmWallet} from '@/hooks/useEvmWallet';

type Chain = 'base';

type OnSuccessArgs = {paymentId: string; hash?: string} | string;

interface AddCardStepConfigurableProps {
  chain: Chain;
  walletAddress: string;
  merchantId: string;
  env: 'sandbox' | 'staging' | 'prod';
  onSuccess: (paymentId: string) => void;
  cardPaymentId: string | null;
  onRemove?: () => void;
}

export function AddCardStepConfigurable({
  chain,
  walletAddress,
  merchantId,
  env,
  onSuccess,
  cardPaymentId,
  onRemove,
}: AddCardStepConfigurableProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wallet = useEvmWallet();

  function handleSuccess(args: OnSuccessArgs) {
    const paymentId = typeof args === 'string' ? args : args.paymentId;
    if (paymentId) {
      onSuccess(paymentId);
    }
    setIsOpen(false);
  }

  if (cardPaymentId) {
    return (
      <StepCard
        step={1}
        title="Card on File"
        description="Your card has been verified and saved."
        isComplete
      >
        <div className="flex items-center gap-2 bg-emerald-950 border border-emerald-800 rounded-lg px-3 py-2">
          <svg
            className="w-4 h-4 text-emerald-400 shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-emerald-300 text-xs font-medium">Card verified</p>
            <p className="text-emerald-600 text-xs font-mono">
              ID: {cardPaymentId.slice(0, 8)}…
            </p>
          </div>
        </div>
        <button
          onClick={() => onRemove?.()}
          className="mt-3 w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg px-4 py-2 transition-colors"
        >
          Remove card on file
        </button>
      </StepCard>
    );
  }

  return (
    <StepCard
      step={1}
      title="Add Card on File"
      description="A $0 zero authorization validates your card without any charge."
    >
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          disabled={!wallet.address}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
        >
          {wallet.address ? 'Add Card (Zero Auth)' : 'Connect wallet first'}
        </button>
      ) : (
        <CoinflowIframe
          wallet={wallet}
          chain={chain}
          walletAddress={walletAddress}
          merchantId={merchantId}
          env={env}
          onSuccess={handleSuccess}
          onCancel={() => setIsOpen(false)}
        />
      )}

      <div className="mt-3 flex items-start gap-2 text-zinc-600 text-xs">
        <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        $0 charge · Card stored securely by Coinflow
      </div>
    </StepCard>
  );
}

function CoinflowIframe({
  wallet,
  chain,
  merchantId,
  env,
  onSuccess,
  onCancel,
}: {
  wallet: ReturnType<typeof useEvmWallet>;
  chain: Chain;
  walletAddress: string;
  merchantId: string;
  env: 'sandbox' | 'staging' | 'prod';
  onSuccess: (args: OnSuccessArgs) => void;
  onCancel: () => void;
}) {
  if (!wallet.address) return null;

  return (
    <div className="mt-3 animate-fade-in">
      <div className="coinflow-iframe-container">
        <CoinflowPurchase
          wallet={wallet}
          merchantId={merchantId}
          env={env}
          blockchain={chain}
          settlementType={SettlementType.Credits}
          isZeroAuthorization
          zeroAuthorizationConfig={{disableSavedPaymentMethods: true}}
          onSuccess={onSuccess}
          loaderBackground="#18181b"
          origins={
            typeof window !== 'undefined' ? [window.location.origin] : []
          }
        />
      </div>
      <button
        onClick={onCancel}
        className="mt-2 w-full text-xs text-zinc-500 hover:text-zinc-400 transition-colors py-1.5"
      >
        Cancel
      </button>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
  isComplete,
  children,
}: {
  step: number;
  title: string;
  description: string;
  isComplete?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`bg-zinc-900 border rounded-xl p-5 flex flex-col ${
        isComplete ? 'border-emerald-900' : 'border-zinc-800'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <StepBadge step={step} isComplete={isComplete} />
        <div>
          <h3 className="text-white text-sm font-medium">{title}</h3>
          <p className="text-zinc-500 text-xs mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function StepBadge({step, isComplete}: {step: number; isComplete?: boolean}) {
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
    <div className="w-7 h-7 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center shrink-0">
      <span className="text-zinc-300 text-xs font-bold">{step}</span>
    </div>
  );
}

