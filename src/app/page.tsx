'use client';

import {useState, useEffect} from 'react';
import {useAccount, useSwitchChain} from 'wagmi';
import {ConnectButton} from '@rainbow-me/rainbowkit';
import {Header} from '@/components/Header';
import {BalanceCard} from '@/components/BalanceCard';
import {AddCardStep} from '@/components/AddCardStep';
import {TopUpStep} from '@/components/TopUpStep';
import {UseServiceStep} from '@/components/UseServiceStep';
import {useCreditBalance, LogEntry} from '@/hooks/useCreditBalance';
import {useAppState} from '@/hooks/useAppState';
import {Chain} from '@/hooks/useAppState';
import {ApiCall} from '@/types';
import {CHAIN_IDS} from '@/lib/creditsContract';

const CHAIN_LABELS: Record<Chain, string> = {
  base: 'Base Sepolia',
  tempo: 'Tempo Testnet',
};

export default function Home() {
  const {address, isConnected, chainId: walletChainId} = useAccount();
  const {switchChain} = useSwitchChain();
  const appState = useAppState();
  const creditBalance = useCreditBalance({walletAddress: address, chain: appState.chain});
  const [apiLog, setApiLog] = useState<ApiCall[]>([]);

  // Keep the app's chain selector in sync with MetaMask's actual chain.
  // This prevents mismatches when the user switches networks directly in MetaMask.
  useEffect(() => {
    if (walletChainId === CHAIN_IDS.base) appState.setChain('base');
    else if (walletChainId === CHAIN_IDS.tempo) appState.setChain('tempo');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletChainId]);

  function onApiCall(call: Omit<ApiCall, 'id'>) {
    setApiLog(prev => [{...call, id: `${Date.now()}-${Math.random()}`}, ...prev]);
  }

  function handleChainSelect(chain: Chain) {
    appState.setChain(chain);
    appState.clearCard();
    switchChain({chainId: CHAIN_IDS[chain]});
  }

  if (!isConnected || !address) {
    return <LandingView />;
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Page title */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-1">
              Credits Dashboard
            </h1>
            <p className="text-zinc-400 text-sm">
              Manage your EVM credits · {CHAIN_LABELS[appState.chain]}
            </p>
          </div>
          <a
            href="/configurable"
            className="inline-flex items-center justify-center rounded-lg border border-indigo-600/70 bg-indigo-950/40 px-3 py-1.5 text-xs font-medium text-indigo-200 hover:bg-indigo-900/60 transition-colors"
          >
            Try with your own sandbox merchant →
          </a>
        </div>

        {/* Chain selector */}
        <div className="mb-6 flex items-center gap-2">
          <span className="text-zinc-500 text-xs font-medium mr-1">Network:</span>
          {(['base', 'tempo'] as Chain[]).map(chain => (
            <button
              key={chain}
              onClick={() => handleChainSelect(chain)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                appState.chain === chain
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
            >
              {chain === 'tempo' && <TempoIcon />}
              {CHAIN_LABELS[chain]}
            </button>
          ))}
        </div>

        {/* Balance card */}
        <BalanceCard
          balance={creditBalance.balance}
          isLoadingBalance={creditBalance.isLoadingBalance}
          hasPendingTopUp={creditBalance.hasPendingTopUp}
          pendingCredits={creditBalance.pendingCredits}
          mintStartTime={creditBalance.mintStartTime}
          mintTimedOut={creditBalance.mintTimedOut}
          onRefresh={creditBalance.refetchBalance}
          walletAddress={address}
        />

        {/* Step flow */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <AddCardStep
            chain={appState.chain}
            walletAddress={address}
            onSuccess={appState.onCardAdded}
            cardPaymentId={appState.cardPaymentId}
            onRemove={appState.clearCard}
          />
          <TopUpStep
            chain={appState.chain}
            walletAddress={address}
            cardPaymentId={appState.cardPaymentId}
            onSuccess={(amount, label) => creditBalance.addCredits({amount, label})}
            onApiCall={onApiCall}
            isEnabled={!!appState.cardPaymentId}
          />
          <UseServiceStep
            chain={appState.chain}
            balance={creditBalance.balance}
            onUse={(amount, label) => creditBalance.spendCredits({amount, label})}
            onApiCall={onApiCall}
            isEnabled={creditBalance.balance > 0}
          />
        </div>

        {/* Logs row */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TransactionLog entries={creditBalance.log} />
          <ApiCallLog calls={apiLog} />
        </div>
      </main>
    </div>
  );
}

function TempoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="14" height="14" rx="3" fill="currentColor" fillOpacity="0.2" />
      {/* T crossbar */}
      <rect x="2.5" y="3" width="9" height="1.8" rx="0.9" fill="currentColor" />
      {/* T stem */}
      <rect x="5.8" y="4.5" width="2.4" height="6.5" rx="1.2" fill="currentColor" />
    </svg>
  );
}

function LandingView() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="text-center max-w-xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-950 border border-indigo-800 rounded-full px-4 py-1.5 text-indigo-300 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
            Powered by Coinflow Sandbox
          </div>

          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
            EVM Credits Demo
          </h1>
          <p className="text-zinc-400 text-lg mb-3 leading-relaxed">
            See the full credits lifecycle in action — add a card via zero
            authorization, top up on Base Sepolia or Tempo Testnet, and redeem
            when you use the service.
          </p>

          {/* Flow steps */}
          <div className="flex items-center justify-center gap-3 mb-10 text-sm text-zinc-500">
            <FlowChip label="1. Zero Auth Card" color="indigo" />
            <Arrow />
            <FlowChip label="2. Top Up Credits" color="violet" />
            <Arrow />
            <FlowChip label="3. Redeem & Use" color="purple" />
          </div>

          <div className="flex justify-center">
            <ConnectButton label="Connect Wallet to Start" />
          </div>

          <p className="text-zinc-600 text-xs mt-6">
            Base Sepolia · Tempo Testnet · Sandbox only · No real funds
          </p>
        </div>
      </div>
    </div>
  );
}

function FlowChip({label, color}: {label: string; color: string}) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-950 border-indigo-800 text-indigo-300',
    violet: 'bg-violet-950 border-violet-800 text-violet-300',
    purple: 'bg-purple-950 border-purple-800 text-purple-300',
  };

  return (
    <span
      className={`border rounded-md px-3 py-1 text-xs font-medium ${colorMap[color]}`}
    >
      {label}
    </span>
  );
}

function Arrow() {
  return <span className="text-zinc-700 text-xs">→</span>;
}

function TransactionLog({entries}: {entries: LogEntry[]}) {
  if (entries.length === 0) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-medium text-zinc-300 mb-4">Activity Log</h3>
      <div className="space-y-2">
        {[...entries].reverse().map(entry => (
          <div
            key={entry.id}
            className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0"
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  entry.type === 'topup'
                    ? 'bg-emerald-950 text-emerald-400'
                    : 'bg-violet-950 text-violet-400'
                }`}
              >
                {entry.type === 'topup' ? '+' : '−'}
              </span>
              <span className="text-zinc-300 text-sm">{entry.label}</span>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`text-sm font-medium ${
                  entry.type === 'topup' ? 'text-emerald-400' : 'text-zinc-400'
                }`}
              >
                {entry.type === 'topup' ? '+' : '−'}
                {entry.amount.toLocaleString()} credits
              </span>
              <span className="text-zinc-600 text-xs">
                {entry.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApiCallLog({calls}: {calls: ApiCall[]}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-medium text-zinc-300 mb-1">API Call Log</h3>
      <p className="text-zinc-600 text-xs mb-4">
        Coinflow API calls made during this session
      </p>

      {calls.length === 0 ? (
        <p className="text-zinc-600 text-xs py-4 text-center">
          No API calls yet — try a top-up
        </p>
      ) : (
        <div className="space-y-2">
          {calls.map(call => {
            const isOk = typeof call.status === 'number' && call.status < 400;
            const isOpen = expanded === call.id;

            return (
              <div
                key={call.id}
                className="border border-zinc-800 rounded-lg overflow-hidden"
              >
                {/* Row */}
                <button
                  onClick={() => setExpanded(isOpen ? null : call.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-zinc-800/50 transition-colors"
                >
                  <span className="text-xs font-mono font-bold text-indigo-400 shrink-0">
                    {call.method}
                  </span>
                  <span className="text-zinc-300 text-xs font-mono flex-1 truncate">
                    {call.endpoint}
                  </span>
                  <span
                    className={`text-xs font-medium shrink-0 ${
                      isOk ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {call.status}
                  </span>
                  <span className="text-zinc-600 text-xs shrink-0">
                    {call.timestamp.toLocaleTimeString()}
                  </span>
                  <span className="text-zinc-600 text-xs shrink-0">
                    {isOpen ? '▲' : '▼'}
                  </span>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-zinc-800 px-3 py-3 space-y-3 bg-zinc-950">
                    <div>
                      <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">
                        Request
                      </p>
                      <pre className="text-zinc-300 text-xs font-mono whitespace-pre-wrap break-all bg-zinc-900 rounded p-2">
                        {JSON.stringify(call.payload, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">
                        Response
                      </p>
                      <pre
                        className={`text-xs font-mono whitespace-pre-wrap break-all rounded p-2 ${
                          isOk
                            ? 'bg-emerald-950 text-emerald-300'
                            : 'bg-red-950 text-red-300'
                        }`}
                      >
                        {call.response}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
