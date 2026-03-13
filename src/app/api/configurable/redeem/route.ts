import {NextResponse} from 'next/server';
import axios from 'axios';

const DEFAULT_ENV =
  (process.env.NEXT_PUBLIC_COINFLOW_ENV as
    | 'sandbox'
    | 'staging'
    | 'prod'
    | undefined) ?? 'sandbox';
const DEFAULT_MERCHANT_ID = process.env.NEXT_PUBLIC_COINFLOW_MERCHANT_ID ?? '';
const DEFAULT_API_KEY = process.env.COINFLOW_API_KEY ?? '';
const DEFAULT_REDEEM_DESTINATION_WALLET =
  process.env.COINFLOW_REDEEM_DESTINATION_WALLET ?? '';

interface AuthBody {
  action: 'auth';
  amountCents: number;
  wallet: string;
  blockchain: string;
  merchantId?: string;
  apiKey?: string;
  env?: 'sandbox' | 'staging' | 'prod';
  redeemDestinationWallet?: string;
}

interface ExecuteBody extends AuthBody {
  action: 'execute';
  signedMessage: string;
  validBefore: string;
  nonce: string;
  creditsRawAmount: number;
}

type RedeemBody = AuthBody | ExecuteBody;

export async function POST(request: Request) {
  const body: RedeemBody = await request.json();

  const merchantId = body.merchantId || DEFAULT_MERCHANT_ID;
  const apiKey = body.apiKey || DEFAULT_API_KEY;
  const env = body.env || DEFAULT_ENV;
  const redeemDestinationWallet =
    body.redeemDestinationWallet || DEFAULT_REDEEM_DESTINATION_WALLET;

  if (!merchantId || !apiKey) {
    return NextResponse.json(
      {error: 'merchantId and apiKey are required'},
      {status: 400}
    );
  }

  const baseUrl =
    env === 'prod' ? 'https://api.coinflow.cash' : 'https://api-sandbox.coinflow.cash';

  const commonHeaders = {
    Authorization: apiKey,
    'x-coinflow-auth-wallet': body.wallet,
    'x-coinflow-auth-blockchain': body.blockchain,
    'Content-Type': 'application/json',
  };

  const transactionData = {
    type: 'token',
    destination: redeemDestinationWallet || body.wallet,
  };

  try {
    if (body.action === 'auth') {
      const url = `${baseUrl}/api/redeem/evm/creditsAuthMsg`;

      const response = await axios.post(
        url,
        {
          merchantId,
          subtotal: {cents: body.amountCents},
          transactionData,
        },
        {headers: commonHeaders}
      );

      return NextResponse.json(response.data, {status: response.status});
    }

    if (body.action === 'execute') {
      const execBody = body as ExecuteBody;
      const url = `${baseUrl}/api/redeem/evm/sendGaslessTx`;

      const response = await axios.post(
        url,
        {
          merchantId,
          subtotal: {cents: execBody.amountCents},
          transactionData,
          signedMessages: {permitCredits: execBody.signedMessage},
          validBefore: execBody.validBefore,
          nonce: execBody.nonce,
          creditsRawAmount: execBody.creditsRawAmount,
        },
        {headers: commonHeaders}
      );

      return NextResponse.json(response.data, {status: response.status});
    }

    return NextResponse.json({error: 'Invalid action'}, {status: 400});
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status ?? 500;
      const errorData = err.response?.data ?? err.message;
      return NextResponse.json({error: errorData}, {status});
    }

    return NextResponse.json(
      {error: 'Internal server error'},
      {status: 500}
    );
  }
}

