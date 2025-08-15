import type { NextApiRequest, NextApiResponse } from 'next';

// Stripe requires the raw body to verify webhook signatures
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to read raw body
async function getRawBody(req: NextApiRequest): Promise<string> {
  const chunks: Buffer[] = [];
  
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  const rawBody = await getRawBody(req);
  const signature = req.headers['stripe-signature'];

  if (!signature || typeof signature !== 'string') {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  try {
    // Forward to our tRPC backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_TRPC_SERVER_URL}/stripe-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature,
      },
      body: JSON.stringify({
        body: rawBody,
        signature,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Webhook processing failed:', error);
      res.status(response.status).json({ error: 'Webhook processing failed' });
      return;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}