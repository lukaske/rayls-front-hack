import { NextResponse } from 'next/server';
import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk';

export async function GET(
  request: Request,
  { params }: { params: { provider: string } }
) {
  const { provider } = params;

  let providerId: string;

  // Map provider names to their providerIds
  if (provider === 'binance') {
    providerId = '2b22db5c-78d9-4d82-84f0-a9e0a4ed0470';
  } else if (provider === 'coinbase') {
    providerId = '285a345c-c6a6-4b9f-9e1e-23432082c0a8';
  } else if (provider === 'x' || provider === 'twitter') {
    providerId = '2523321f-f61d-4db3-b4e6-e665af5efdc1';
  } else if (provider === 'example') {
    providerId = 'example';
  } else {
    return NextResponse.json(
      { success: false, error: 'Invalid provider. Use "binance", "coinbase", "x", or "example".' },
      { status: 400 }
    );
  }

  // Initialize SDK with server-side environment variables (secure)
  const reclaimProofRequest = await ReclaimProofRequest.init(
    process.env.RECLAIM_APP_ID!,
    process.env.RECLAIM_APP_SECRET!,
    providerId,
  );

  // Convert to JSON string (safe for frontend)
  const proofRequestObject = reclaimProofRequest.toJsonString();

  return NextResponse.json({
    success: true,
    proofRequest: proofRequestObject
  });
}

