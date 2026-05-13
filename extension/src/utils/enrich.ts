import { generateSignature } from './crypto';

type EnrichResponse = {
  success?: boolean;
  processed?: number;
  remaining?: number;
  completed?: boolean;
  batches?: number;
  timedOut?: boolean;
};

async function callEnrichAPI(webUrl: string, apiSecret: string): Promise<EnrichResponse> {
  const timestamp = Date.now().toString();
  const nonce = crypto.randomUUID();
  const payload = JSON.stringify({});
  const signature = await generateSignature(payload, apiSecret);

  const response = await fetch(`${webUrl}/api/enrich`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-signature': signature,
      'x-timestamp': timestamp,
      'x-nonce': nonce
    },
    body: payload
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as EnrichResponse;
}

export async function runEnrichStep(webUrl: string, apiSecret: string): Promise<EnrichResponse> {
  return callEnrichAPI(webUrl, apiSecret);
}
