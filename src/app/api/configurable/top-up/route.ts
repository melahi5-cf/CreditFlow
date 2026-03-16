import {NextRequest, NextResponse} from 'next/server';
import axios from 'axios';

const DEFAULT_ENV =
  (process.env.NEXT_PUBLIC_COINFLOW_ENV as
    | 'sandbox'
    | 'staging'
    | 'prod'
    | undefined) ?? 'sandbox';

const DEFAULT_MERCHANT_ID = process.env.NEXT_PUBLIC_COINFLOW_MERCHANT_ID ?? '';
const DEFAULT_API_KEY = process.env.COINFLOW_API_KEY ?? '';

function getClientIp(req: NextRequest): string | undefined {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim();
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('cf-connecting-ip') ??
    undefined
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    paymentId,
    amountCents,
    wallet,
    blockchain,
    merchantId: overrideMerchantId,
    apiKey: overrideApiKey,
    env: overrideEnv,
    authentication3DS,
    chargebackProtectionData,
  } = body as {
    paymentId?: string;
    amountCents?: number;
    wallet?: string;
    blockchain?: 'base';
    merchantId?: string;
    apiKey?: string;
    env?: 'sandbox' | 'staging' | 'prod';
    authentication3DS?: Record<string, unknown>;
    chargebackProtectionData?: Record<string, unknown>[];
  };

  const merchantId = overrideMerchantId || DEFAULT_MERCHANT_ID;
  const apiKey = overrideApiKey || DEFAULT_API_KEY;
  const env = overrideEnv || DEFAULT_ENV;

  if (!merchantId || !apiKey) {
    return NextResponse.json(
      {error: 'merchantId and apiKey are required'},
      {status: 400}
    );
  }

  if (!paymentId || !amountCents || !wallet || !blockchain) {
    return NextResponse.json(
      {error: 'Missing required fields for top-up'},
      {status: 400}
    );
  }

  const coinflowBaseUrl =
    env === 'prod' ? 'https://api.coinflow.cash' : 'https://api-sandbox.coinflow.cash';
  const coinflowUrl = `${coinflowBaseUrl}/api/checkout/card-on-file`;

  const deviceId = req.headers.get('x-device-id') ?? undefined;
  const userAgent = req.headers.get('user-agent') ?? undefined;
  const clientIp = getClientIp(req);

  try {
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
        authOnly: false,
        ...(authentication3DS ? {authentication3DS} : {}),
        ...(chargebackProtectionData ? {chargebackProtectionData} : {}),
      },
      {
        headers: {
          Authorization: apiKey,
          'x-coinflow-auth-wallet': wallet,
          'x-coinflow-auth-blockchain': blockchain,
          ...(deviceId ? {'x-device-id': deviceId} : {}),
          ...(clientIp ? {'x-coinflow-client-ip': clientIp} : {}),
          ...(userAgent ? {'user-agent': userAgent} : {}),
          'Content-Type': 'application/json',
        },
      }
    );

    return NextResponse.json(response.data, {status: response.status});
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status ?? 500;
      // Forward the full Coinflow response body so the client can inspect 412 challenge data
      const data = err.response?.data ?? err.message;
      return NextResponse.json(data, {status});
    }

    return NextResponse.json(
      {error: 'Internal server error'},
      {status: 500}
    );
  }
}
