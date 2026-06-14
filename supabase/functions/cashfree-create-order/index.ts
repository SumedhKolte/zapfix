import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.2';

// Creates a Cashfree order and returns the payment_session_id the SDK needs.
//
// ── Credential setup (two modes) ───────────────────────────────────────────
//
//  Mode A — Dual-key (recommended for production apps):
//    CASHFREE_APP_ID          production app id
//    CASHFREE_SECRET_KEY      production secret
//    CASHFREE_TEST_APP_ID     sandbox/test app id   (optional)
//    CASHFREE_TEST_SECRET_KEY sandbox/test secret   (optional)
//
//    Client sends app_env='sandbox' → function uses TEST creds + sandbox URL.
//    Client sends app_env='production' → function uses production creds.
//    Lets dev builds test payments without installer_package_not_approved.
//
//  Mode B — Single-key (backward compatible):
//    CASHFREE_APP_ID + CASHFREE_SECRET_KEY + CASHFREE_ENV
//    app_env hint from client is IGNORED; CASHFREE_ENV controls the endpoint.
//    IMPORTANT: credentials and CASHFREE_ENV MUST match (both test or both prod).
//    If you previously set CASHFREE_ENV=sandbox but CASHFREE_APP_ID is a
//    production key, you will get 401 authentication_error from Cashfree.

const supabaseUrl     = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const cfAppId  = Deno.env.get('CASHFREE_APP_ID') ?? '';
const cfSecret = Deno.env.get('CASHFREE_SECRET_KEY') ?? '';

const cfTestAppId  = Deno.env.get('CASHFREE_TEST_APP_ID')  ?? '';
const cfTestSecret = Deno.env.get('CASHFREE_TEST_SECRET_KEY') ?? '';

// Used ONLY in Mode B (single-key fallback). Must match the type of credentials
// stored in CASHFREE_APP_ID/SECRET_KEY. Mismatching causes 401.
const cfEnvFallback = (Deno.env.get('CASHFREE_ENV') ?? 'production').toLowerCase();

const CF_PROD_BASE    = 'https://api.cashfree.com/pg';
const CF_TEST_BASE    = 'https://sandbox.cashfree.com/pg';
const CF_API_VERSION  = '2023-08-01';

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
  note?: string;
  app_env?: string;  // 'production' | 'sandbox'
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return jsonError('Method not allowed', 405);

  if (!cfAppId || !cfSecret) {
    return jsonError(
      'Cashfree credentials not configured. Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY as Supabase function secrets.',
      500
    );
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

  const wantSandbox  = body.app_env !== 'production';
  const hasTestCreds = Boolean(cfTestAppId && cfTestSecret);

  let resolvedAppId : string;
  let resolvedSecret: string;
  let resolvedBase  : string;
  let resolvedEnv   : string;

  if (wantSandbox && hasTestCreds) {
    // Mode A — sandbox request with explicit test credentials
    resolvedAppId  = cfTestAppId;
    resolvedSecret = cfTestSecret;
    resolvedBase   = CF_TEST_BASE;
    resolvedEnv    = 'sandbox';
  } else if (!wantSandbox) {
    // Mode A — explicit production request
    resolvedAppId  = cfAppId;
    resolvedSecret = cfSecret;
    resolvedBase   = CF_PROD_BASE;
    resolvedEnv    = 'production';
  } else {
    // Mode B — no test creds, fall back to single-key setup.
    // The client's app_env hint is IGNORED here; CASHFREE_ENV is the authority.
    // ⚠️  CASHFREE_APP_ID and CASHFREE_ENV MUST match (both test or both prod).
    if (cfEnvFallback === 'sandbox') {
      console.warn(
        '[cashfree-create-order] CASHFREE_ENV=sandbox but CASHFREE_TEST_APP_ID is not set. ' +
        'Ensure CASHFREE_APP_ID is your Cashfree TEST app id (starts with TEST...) and ' +
        'CASHFREE_SECRET_KEY is the matching TEST secret, or set CASHFREE_TEST_APP_ID + ' +
        'CASHFREE_TEST_SECRET_KEY to use the dual-key setup.'
      );
    }
    resolvedAppId  = cfAppId;
    resolvedSecret = cfSecret;
    resolvedBase   = cfEnvFallback === 'production' ? CF_PROD_BASE : CF_TEST_BASE;
    resolvedEnv    = cfEnvFallback;
  }

  const amountPaise = Number(body.amount_paise);
  if (!Number.isFinite(amountPaise) || amountPaise < 100) {
    return jsonError('amount_paise must be >= 100', 400);
  }
  if (!body.customer_phone) return jsonError('customer_phone required', 400);

  const orderAmount = (amountPaise / 100).toFixed(2);
  const orderId     = `zfx_${user.id.slice(0, 8)}_${Date.now()}`;

  const cfBody = {
    order_id:      orderId,
    order_amount:  Number(orderAmount),
    order_currency: 'INR',
    customer_details: {
      customer_id:    user.id,
      customer_phone: body.customer_phone,
      customer_name:  body.customer_name  ?? 'Zapfix customer',
      customer_email: body.customer_email ?? `${user.id}@zapfix.app`,
    },
    order_meta:  { notify_url: '' },
    order_note:  body.note ?? 'Zapfix booking',
  };

  let cfRes: Response;
  try {
    cfRes = await fetch(`${resolvedBase}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-api-version':   CF_API_VERSION,
        'x-client-id':     resolvedAppId,
        'x-client-secret': resolvedSecret,
      },
      body: JSON.stringify(cfBody),
    });
  } catch (e) {
    console.error('[cashfree-create-order] network error:', e);
    return jsonError('Failed to reach Cashfree.', 502);
  }

  if (!cfRes.ok) {
    const errText = await cfRes.text();
    console.error(`[cashfree-create-order] Cashfree [${resolvedEnv}] ${cfRes.status}:`, errText);
    if (cfRes.status === 401) {
      return jsonError(
        `Cashfree authentication failed (${resolvedEnv}). ` +
        'Your CASHFREE_APP_ID and CASHFREE_SECRET_KEY must match the environment in CASHFREE_ENV. ' +
        'For sandbox testing set CASHFREE_TEST_APP_ID + CASHFREE_TEST_SECRET_KEY instead.',
        502
      );
    }
    return jsonError(`Cashfree error (${cfRes.status}): ${errText}`, 502);
  }

  const cfData = await cfRes.json();
  return new Response(
    JSON.stringify({
      order_id:           cfData.order_id ?? orderId,
      payment_session_id: cfData.payment_session_id,
      order_amount:       cfData.order_amount,
      order_status:       cfData.order_status,
      env:                resolvedEnv,
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
