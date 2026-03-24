'use client';

import {useState} from 'react';
import {useAccount, useSignTypedData, useSwitchChain} from 'wagmi';
import {ApiCall} from '@/types';
import {CHAIN_IDS} from '@/lib/creditsContract';
import axios from 'axios';

interface UseServiceStepProps {
  chain: string;
  balance: number;
  onUse: (credits: number, label: string) => void;
  onApiCall?: (call: Omit<ApiCall, 'id'>) => void;
  isEnabled: boolean;
}

interface ServiceAction {
  id: string;
  label: string;
  description: string;
  creditCost: number;
  icon: React.ReactNode;
}

const SERVICE_ACTIONS: ServiceAction[] = [
  {
    id: 'analyze',
    label: 'Analyze Data',
    description: 'Run a quick data analysis',
    creditCost: 50,
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
        <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
      </svg>
    ),
  },
  {
    id: 'generate',
    label: 'Generate Report',
    description: 'Generate a detailed report',
    creditCost: 150,
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    id: 'process',
    label: 'Process Batch',
    description: 'Batch process 1000 records',
    creditCost: 500,
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
        <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
        <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
      </svg>
    ),
  },
];

export function UseServiceStep({
  chain,
  balance,
  onUse,
  onApiCall,
  isEnabled,
}: UseServiceStepProps) {
  const {address, chainId: walletChainId} = useAccount();
  const {signTypedDataAsync} = useSignTypedData();
  const {switchChainAsync} = useSwitchChain();
  const [runningId, setRunningId] = useState<string | null>(null);
  const [justCompleted, setJustCompleted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRun(action: ServiceAction) {
    if (!isEnabled || balance < action.creditCost || runningId || !address) return;

    setRunningId(action.id);
    setError(null);

    const redeemPayload = {
      amountCents: action.creditCost,
      wallet: address,
      blockchain: chain,
    };

    try {
      // Step 1: Ensure wallet is on the correct chain before doing anything
      // This must happen first so MetaMask has fully settled before the sign request fires
      const requiredChainId = CHAIN_IDS[chain];
      if (requiredChainId && walletChainId !== requiredChainId) {
        await switchChainAsync({chainId: requiredChainId});
      }

      // Step 2: Get EIP-712 auth message from Coinflow
      onApiCall?.({
        timestamp: new Date(),
        method: 'POST',
        endpoint: 'POST /api/redeem → Coinflow /redeem/evm/creditsAuthMsg',
        payload: {...redeemPayload, action: 'auth'},
        status: 0,
        response: 'pending…',
      });

      const authResponse = await axios.post('/api/redeem', {
        action: 'auth',
        ...redeemPayload,
      });

      const {message: msgStr, validBefore, nonce, creditsRawAmount} =
        authResponse.data;

      onApiCall?.({
        timestamp: new Date(),
        method: 'POST',
        endpoint: 'POST /api/redeem → Coinflow /redeem/evm/creditsAuthMsg',
        payload: {...redeemPayload, action: 'auth'},
        status: 200,
        response: JSON.stringify({validBefore, nonce, creditsRawAmount}, null, 2),
      });

      // Step 3: User signs the EIP-712 permit message with their wallet
      const parsed = JSON.parse(msgStr);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {EIP712Domain: _ignored, ...typesWithoutDomain} = parsed.types ?? {};
      const signedMessage = await signTypedDataAsync({
        domain: parsed.domain,
        types: typesWithoutDomain,
        primaryType: parsed.primaryType,
        message: parsed.message,
      });

      // Step 4: Execute the gasless redeem transaction
      onApiCall?.({
        timestamp: new Date(),
        method: 'POST',
        endpoint: 'POST /api/redeem → Coinflow /redeem/evm/sendGaslessTx',
        payload: {
          ...redeemPayload,
          action: 'execute',
          signedMessage: `${signedMessage.slice(0, 12)}…`,
          nonce,
          creditsRawAmount,
        },
        status: 0,
        response: 'pending…',
      });

      const executeResponse = await axios.post('/api/redeem', {
        action: 'execute',
        ...redeemPayload,
        signedMessage,
        validBefore,
        nonce,
        creditsRawAmount,
      });

      onApiCall?.({
        timestamp: new Date(),
        method: 'POST',
        endpoint: 'POST /api/redeem → Coinflow /redeem/evm/sendGaslessTx',
        payload: {
          ...redeemPayload,
          action: 'execute',
          signedMessage: `${signedMessage.slice(0, 12)}…`,
          nonce,
          creditsRawAmount,
        },
        status: 200,
        response: JSON.stringify(executeResponse.data, null, 2),
      });

      // Credits burned on-chain — trigger balance refetch via onUse
      onUse(action.creditCost, `Used: ${action.label}`);
      setJustCompleted(action.id);
      setTimeout(() => setJustCompleted(null), 2000);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status ?? 'error';
        onApiCall?.({
          timestamp: new Date(),
          method: 'POST',
          endpoint: runningId?.includes('execute')
            ? 'POST /api/redeem → Coinflow /redeem/evm/sendGaslessTx'
            : 'POST /api/redeem → Coinflow /redeem/evm/creditsAuthMsg',
          payload: {...redeemPayload},
          status,
          response: JSON.stringify(err.response?.data ?? err.message, null, 2),
        });
        setError(
          typeof err.response?.data === 'object'
            ? JSON.stringify(err.response.data)
            : err.message
        );
      } else if ((err as Error).message?.includes('User rejected')) {
        setError('Signature rejected.');
      } else {
        setError('Redeem failed. Please try again.');
      }
    } finally {
      setRunningId(null);
    }
  }

  return (
    <div
      className={`bg-zinc-900 border rounded-xl p-5 flex flex-col transition-opacity ${
        isEnabled ? 'border-zinc-800 opacity-100' : 'border-zinc-800/50 opacity-50'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <StepBadge step={3} isEnabled={isEnabled} />
        <div>
          <h3 className="text-white text-sm font-medium">Use the Service</h3>
          <p className="text-zinc-500 text-xs mt-0.5">
            {isEnabled
              ? 'Redeem credits on-chain via Coinflow'
              : 'Top up credits to unlock'}
          </p>
        </div>
      </div>

      {isEnabled && (
        <div className="space-y-2">
          {SERVICE_ACTIONS.map(action => {
            const canAfford = balance >= action.creditCost;
            const isRunning = runningId === action.id;
            const isDone = justCompleted === action.id;

            return (
              <button
                key={action.id}
                onClick={() => handleRun(action)}
                disabled={!canAfford || !!runningId}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 transition-all text-left ${
                  isDone
                    ? 'bg-emerald-950 border border-emerald-800'
                    : isRunning
                    ? 'bg-indigo-950 border border-indigo-800'
                    : canAfford && !runningId
                    ? 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600'
                    : 'bg-zinc-800/50 border border-zinc-800 opacity-40 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`${
                      isDone
                        ? 'text-emerald-400'
                        : isRunning
                        ? 'text-indigo-400'
                        : 'text-zinc-400'
                    }`}
                  >
                    {isDone ? (
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      action.icon
                    )}
                  </span>
                  <div>
                    <p
                      className={`text-xs font-medium ${
                        isDone
                          ? 'text-emerald-300'
                          : isRunning
                          ? 'text-indigo-300'
                          : 'text-zinc-200'
                      }`}
                    >
                      {isDone ? 'Completed!' : isRunning ? 'Signing…' : action.label}
                    </p>
                    <p className="text-zinc-600 text-xs">{action.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isRunning ? (
                    <Spinner />
                  ) : (
                    <span
                      className={`text-xs font-medium ${
                        canAfford ? 'text-zinc-300' : 'text-red-400'
                      }`}
                    >
                      {action.creditCost.toLocaleString()} cr
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {balance > 0 && (
            <p className="text-zinc-600 text-xs text-center pt-1">
              {balance.toLocaleString()} credits remaining
            </p>
          )}

          {error && (
            <div className="mt-1 bg-red-950 border border-red-800 rounded-lg px-3 py-2 text-red-300 text-xs">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin w-3.5 h-3.5 text-indigo-400"
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

function StepBadge({step, isEnabled}: {step: number; isEnabled: boolean}) {
  return (
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
        isEnabled
          ? 'bg-violet-600 border border-violet-500'
          : 'bg-zinc-700 border border-zinc-600'
      }`}
    >
      <span className="text-white text-xs font-bold">{step}</span>
    </div>
  );
}
