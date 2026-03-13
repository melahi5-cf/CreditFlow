'use client';

import {useCallback} from 'react';
import {
  useAccount,
  useSendTransaction,
  useSignMessage,
  useSignTypedData,
} from 'wagmi';
import {EthWallet} from '@coinflowlabs/react';

export function useEvmWallet(): EthWallet {
  const {address} = useAccount();
  const {sendTransactionAsync} = useSendTransaction();
  const {signTypedDataAsync} = useSignTypedData();
  const {signMessageAsync} = useSignMessage();

  const sendTransaction = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (request: any) => {
      const hash = await sendTransactionAsync(request);
      return {hash};
    },
    [sendTransactionAsync]
  );

  const signMessage = useCallback(
    async (message: string) => {
      try {
        const parsed = JSON.parse(message);
        return await signTypedDataAsync(parsed);
      } catch {
        return await signMessageAsync({message});
      }
    },
    [signMessageAsync, signTypedDataAsync]
  );

  return {address, signMessage, sendTransaction} as EthWallet;
}
