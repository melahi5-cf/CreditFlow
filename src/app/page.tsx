'use client';

import {useState} from 'react';
import {useAccount} from 'wagmi';
import {ConnectButton} from '@rainbow-me/rainbowkit';
import {Header} from '@/components/Header';
import {BalanceCard} from '@/components/BalanceCard';
import {AddCardStep} from '@/components/AddCardStep';
import {TopUpStep} from '@/components/TopUpStep';
import {UseServiceStep} from '@/components/UseServiceStep';
import {useCreditBalance, LogEntry} from '@/hooks/useCreditBalance';
import {useAppState} from '@/hooks/useAppState';
import {ApiCall} from '@/types';

export default function Home() {
  const {address, isConnected} = useAccount();
  const creditBalance = useCreditBalance({walletAddress: address});
  const appState = useAppState();
  const [apiLog, setApiLog] = useState<ApiCall[]>([]);

  function onApiCall(call: Omit<ApiCall, 'id'>) {
    setApiLog(prev => [{...call, id: `${Date.now()}-${Math.random()}`}, ...prev]);
  }

  if (!isConnected || !address) {
    return <LandingView />;
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white mb-1">
            Credits Dashboard
          </h1>
          <p className="text-zinc-400 text-sm">
            Manage your EVM credits on Base Sepolia
          </p>
        </div>

        {/* Balance card — locked to Base Sepolia */}
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
            authorization, top up on Base Sepolia, and redeem when you use
            the service.
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
            Base Sepolia testnet · Sandbox only · No real funds
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
