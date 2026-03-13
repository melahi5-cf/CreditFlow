'use client';

import {SandboxConfig, useSandboxConfig} from '@/hooks/useSandboxConfig';

function TextInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-zinc-300">
      <span className="font-medium">{label}</span>
      <input
        type={type}
        className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

export function ConfigPanel() {
  const {config, setConfig} = useSandboxConfig();

  function update<K extends keyof SandboxConfig>(key: K, value: SandboxConfig[K]) {
    setConfig({[key]: value} as Partial<SandboxConfig>);
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <h2 className="text-sm font-medium text-white">Sandbox Configuration</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Enter your own Coinflow sandbox credentials to test this demo as your
            own merchant. Values are stored locally in your browser only.
          </p>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-900/40 border border-amber-700 text-[10px] font-medium text-amber-300">
          Sandbox only · Not for prod keys
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TextInput
          label="Merchant ID"
          value={config.merchantId}
          onChange={v => update('merchantId', v)}
          placeholder="your-merchant-id"
        />
        <TextInput
          label="API Key"
          value={config.apiKey}
          onChange={v => update('apiKey', v)}
          placeholder="coinflow_sandbox_xxx"
          type="password"
        />
        <TextInput
          label="Redeem Destination Wallet (EVM)"
          value={config.redeemDestinationWallet}
          onChange={v => update('redeemDestinationWallet', v)}
          placeholder="0x..."
        />
        <TextInput
          label="Credit Seed"
          value={config.creditSeed}
          onChange={v => update('creditSeed', v)}
          placeholder="cfusd or your merchant's credit seed"
        />
        <TextInput
          label="Credits Contract Address"
          value={config.creditsContractAddress}
          onChange={v => update('creditsContractAddress', v)}
          placeholder="0x... (Base Sepolia credits contract)"
        />

        <label className="flex flex-col gap-1 text-xs text-zinc-300">
          <span className="font-medium">Environment</span>
          <select
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            value={config.env}
            onChange={e => update('env', e.target.value as SandboxConfig['env'])}
          >
            <option value="sandbox">sandbox</option>
            <option value="staging">staging</option>
            <option value="prod">prod</option>
          </select>
        </label>
      </div>
    </div>
  );
}

