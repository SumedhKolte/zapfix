import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.2';

// Verifies a Cashfree order's payment status server-side using the secret
// key. The client cannot be trusted to self-report payment success — the SDK
// success callback only tells us the user finished the flow, not that the
// payment actually settled.

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const cfAppId = Deno.env.get('CASHFREE_APP_ID') ?? '';
const cfSecret = Deno.env.get('CASHFREE_SECRET_KEY') ?? '';
const cfEnv = (Deno.env.get('CASHFREE_ENV') ?? 'sandbox').toLowerCase();

const CF_BASE = cfEnv === 'production'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

const CF_API_VERSION = '2023-08-01';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return jsonError('Method not allowed', 405);

  if (!cfAppId || !cfSecret) {
    return jsonError('Cashfree secrets not configured on the server.', 500);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return jsonError('Unauthorized', 401);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) return jsonError('Unauthorized', 401);

  let body: { order_id?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }
  if (!body.order_id) return jsonError('order_id required', 400);

  let cfRes: Response;
  try {
    cfRes = await fetch(`${CF_BASE}/orders/${encodeURIComponent(body.order_id)}/payments`, {
      method: 'GET',
      headers: {
        'x-api-version': CF_API_VERSION,
        'x-client-id': cfAppId,
        'x-client-secret': cfSecret,
      },
    });
  } catch (e) {
    console.error('Cashfree verify-order network error:', e);
    return jsonError('Failed to reach Cashfree.', 502);
  }

  if (!cfRes.ok) {
    const errText = await cfRes.text();
    console.error(`Cashfree verify-order ${cfRes.status}:`, errText);
    return jsonError(`Cashfree returned ${cfRes.status}: ${errText}`, 502);
  }

  const payments = await cfRes.json() as Array<{
    cf_payment_id?: string | number;
    payment_status?: string;
    payment_amount?: number;
    payment_currency?: string;
    payment_completion_time?: string;
  }>;

  // Cashfree returns an array of payment attempts. Find the first SUCCESS.
  const success = Array.isArray(payments)
    ? payments.find((p) => p.payment_status === 'SUCCESS')
    : null;

  if (!success) {
    return new Response(
      JSON.stringify({
        verified: false,
        status: payments?.[0]?.payment_status ?? 'NOT_ATTEMPTED',
      }),
      { headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }

  return new Response(
    JSON.stringify({
      verified: true,
      cf_payment_id: String(success.cf_payment_id ?? ''),
      payment_amount: success.payment_amount,
      payment_currency: success.payment_currency,
      payment_completion_time: success.payment_completion_time,
    }),
    { headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
  );
});

function jsonError(message: string, status: number): Response {
  console.error(`[${status}] ${message}`);
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
  );
}
