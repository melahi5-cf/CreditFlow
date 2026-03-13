import {NextRequest, NextResponse} from 'next/server';
import axios from 'axios';

const COINFLOW_BASE_URL =
  process.env.NEXT_PUBLIC_COINFLOW_ENV === 'prod'
    ? 'https://api.coinflow.cash'
    : 'https://api-sandbox.coinflow.cash';

interface TopUpRequest {
  paymentId: string;
  amountCents: number;
  wallet: string;
  blockchain: 'polygon' | 'base';
}

export async function POST(req: NextRequest) {
  const merchantId = process.env.NEXT_PUBLIC_COINFLOW_MERCHANT_ID;
  const apiKey = process.env.COINFLOW_API_KEY;

  if (!merchantId || !apiKey) {
    return NextResponse.json(
      {error: 'COINFLOW_API_KEY and NEXT_PUBLIC_COINFLOW_MERCHANT_ID must be set'},
      {status: 500}
    );
  }

  let body: TopUpRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({error: 'Invalid request body'}, {status: 400});
  }

  const {paymentId, amountCents, wallet, blockchain} = body;

  if (!paymentId || !amountCents || !wallet || !blockchain) {
    return NextResponse.json(
      {error: 'Missing required fields: paymentId, amountCents, wallet, blockchain'},
      {status: 400}
    );
  }

  try {
    const coinflowUrl = `${COINFLOW_BASE_URL}/api/checkout/card-on-file`;

    if (process.env.NODE_ENV !== 'production') {
      // Basic debug logging for Coinflow top-up calls
      // eslint-disable-next-line no-console
      console.log('[Coinflow][TopUp][Request]', {
        url: coinflowUrl,
        merchantId,
        paymentId,
        amountCents,
        wallet,
        blockchain,
      });
    }

    const response = await axios.post(
      coinflowUrl,
      {
        merchantId,
        originalPaymentId: paymentId,
        subtotal: {
          cents: amountCents,
          currency: 'USD',
        },
        settlementType: 'Credits',
      },
      {
        headers: {
          Authorization: apiKey,
          'x-coinflow-auth-user-id': wallet,
          'x-coinflow-auth-wallet': wallet,
          'x-coinflow-auth-blockchain': blockchain,
          'Content-Type': 'application/json',
        },
      }
    );

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[Coinflow][TopUp][Response]', {
        status: response.status,
        data: response.data,
      });
    }

    return NextResponse.json({
      success: true,
      data: response.data,
    });
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status ?? 500;
      const message = err.response?.data?.message ?? err.message;

      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error('[Coinflow][TopUp][Error]', {
          status,
          message,
          data: err.response?.data,
        });
      }

      return NextResponse.json({error: message}, {status});
    }
    return NextResponse.json({error: 'Unexpected error'}, {status: 500});
  }
}
