import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.2';

// Creates a Cashfree order using the secret key (server-only) and returns
// the payment_session_id the mobile SDK needs to launch checkout.
//
// Required Supabase function secrets:
//   CASHFREE_APP_ID        — Cashfree merchant app id
//   CASHFREE_SECRET_KEY    — Cashfree merchant secret
//   CASHFREE_ENV           — 'sandbox' | 'production'  (default: 'sandbox')

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

type Body = {
  amount_paise: number;
  customer_phone: string;
  customer_name?: string;
  customer_email?: string;
  // Free-form: 'fixed_issue' | 'ai_diagnose' etc. — surfaced to Cashfree dashboard.
  note?: string;
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
  const user = userData.user;

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const amountPaise = Number(body.amount_paise);
  if (!Number.isFinite(amountPaise) || amountPaise < 100) {
    return jsonError('amount_paise must be >= 100', 400);
  }
  if (!body.customer_phone) return jsonError('customer_phone required', 400);

  // Cashfree wants amount in rupees (decimal).
  const orderAmount = (amountPaise / 100).toFixed(2);
  // order_id must be unique and <= 50 chars. Format: zfx_<uid8>_<ts>.
  const orderId = `zfx_${user.id.slice(0, 8)}_${Date.now()}`;

  const cfBody = {
    order_id: orderId,
    order_amount: Number(orderAmount),
    order_currency: 'INR',
    customer_details: {
      customer_id: user.id,
      customer_phone: body.customer_phone,
      customer_name: body.customer_name ?? 'Zapfix customer',
      customer_email: body.customer_email ?? `${user.id}@zapfix.app`,
    },
    order_meta: {
      // Return URL is only used by hosted checkout; native SDK uses its own callbacks.
      notify_url: '',
    },
    order_note: body.note ?? 'Zapfix booking',
  };

  let cfRes: Response;
  try {
    cfRes = await fetch(`${CF_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': CF_API_VERSION,
        'x-client-id': cfAppId,
        'x-client-secret': cfSecret,
      },
      body: JSON.stringify(cfBody),
    });
  } catch (e) {
    console.error('Cashfree create-order network error:', e);
    return jsonError('Failed to reach Cashfree.', 502);
  }

  if (!cfRes.ok) {
    const errText = await cfRes.text();
    console.error(`Cashfree create-order ${cfRes.status}:`, errText);
    return jsonError(`Cashfree returned ${cfRes.status}: ${errText}`, 502);
  }

  const cfData = await cfRes.json();
  return new Response(
    JSON.stringify({
      order_id: cfData.order_id ?? orderId,
      payment_session_id: cfData.payment_session_id,
      order_amount: cfData.order_amount,
      order_status: cfData.order_status,
      env: cfEnv,
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
