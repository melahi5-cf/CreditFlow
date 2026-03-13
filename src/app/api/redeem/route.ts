import {NextResponse} from 'next/server';
import axios from 'axios';

const COINFLOW_BASE_URL =
  process.env.NEXT_PUBLIC_COINFLOW_ENV === 'prod'
    ? 'https://api.coinflow.cash'
    : 'https://api-sandbox.coinflow.cash';

const MERCHANT_ID = process.env.NEXT_PUBLIC_COINFLOW_MERCHANT_ID ?? '';
const API_KEY = process.env.COINFLOW_API_KEY ?? '';
const REDEEM_DESTINATION_WALLET =
  process.env.COINFLOW_REDEEM_DESTINATION_WALLET ?? '';

interface AuthBody {
  action: 'auth';
  amountCents: number;
  wallet: string;
  blockchain: string;
}

interface ExecuteBody {
  action: 'execute';
  amountCents: number;
  wallet: string;
  blockchain: string;
  signedMessage: string;
  validBefore: string;
  nonce: string;
  creditsRawAmount: number;
}

type RedeemBody = AuthBody | ExecuteBody;

export async function POST(request: Request) {
  const body: RedeemBody = await request.json();
  const commonHeaders = {
    Authorization: API_KEY,
    'x-coinflow-auth-user-id': body.wallet,
    'x-coinflow-auth-wallet': body.wallet,
    'x-coinflow-auth-blockchain': body.blockchain,
    'Content-Type': 'application/json',
  };

  // How the credits flow works:
  //   Top-up:  user pays → Coinflow holds USDC in escrow → credits minted to user's wallet (merchant earns NOTHING yet)
  //   Redeem:  credits burned on-chain → USDC released from escrow to `destination` below (this is when merchant earns)
  //
  // IMPORTANT: Set COINFLOW_REDEEM_DESTINATION_WALLET in .env.local to your merchant's EVM wallet address.
  // If the env var is not set, redeemed USDC goes back to the user's own wallet instead of the merchant wallet.
  const transactionData = {
    type: 'token',
    destination: REDEEM_DESTINATION_WALLET || body.wallet,
  };

  try {
    if (body.action === 'auth') {
      const url = `${COINFLOW_BASE_URL}/api/redeem/evm/creditsAuthMsg`;

      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('[Coinflow][Redeem][Auth][Request]', {
          url,
          merchantId: MERCHANT_ID,
          amountCents: body.amountCents,
          transactionData,
        });
      }

      const response = await axios.post(
        url,
        {
          merchantId: MERCHANT_ID,
          subtotal: {cents: body.amountCents},
          transactionData,
        },
        {headers: commonHeaders}
      );

      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('[Coinflow][Redeem][Auth][Response]', {
          status: response.status,
          data: response.data,
        });
      }

      return NextResponse.json(response.data);
    }

    if (body.action === 'execute') {
      const url = `${COINFLOW_BASE_URL}/api/redeem/evm/sendGaslessTx`;

      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('[Coinflow][Redeem][Execute][Request]', {
          url,
          merchantId: MERCHANT_ID,
          amountCents: body.amountCents,
          transactionData,
          validBefore: body.validBefore,
          nonce: body.nonce,
          creditsRawAmount: body.creditsRawAmount,
        });
      }

      const response = await axios.post(
        url,
        {
          merchantId: MERCHANT_ID,
          subtotal: {cents: body.amountCents},
          transactionData,
          signedMessages: {permitCredits: body.signedMessage},
          validBefore: body.validBefore,
          nonce: body.nonce,
          creditsRawAmount: body.creditsRawAmount,
        },
        {headers: commonHeaders}
      );

      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('[Coinflow][Redeem][Execute][Response]', {
          status: response.status,
          data: response.data,
        });
      }

      return NextResponse.json(response.data);
    }

    return NextResponse.json({error: 'Invalid action'}, {status: 400});
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status ?? 500;
      const errorData = err.response?.data ?? err.message;

      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error('[Coinflow][Redeem][Error]', {
          status,
          data: errorData,
        });
      }

      return NextResponse.json({error: errorData}, {status});
    }

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[Coinflow][Redeem][Error][Unknown]', err);
    }

    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
