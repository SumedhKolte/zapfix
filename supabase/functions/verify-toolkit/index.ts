import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const groqApiKey = Deno.env.get('GROQ_API_KEY') ?? '';

const authClient = (authHeader: string) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

const adminClient = createClient(supabaseUrl, serviceRoleKey);

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type ToolkitRequest = {
  storage_path?: string;
  expected_tools?: string[];
  trades?: string[];
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return jsonError('Method not allowed', 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return jsonError('Unauthorized', 401);

  const { data, error } = await authClient(authHeader).auth.getUser();
  if (error || !data.user) return jsonError('Unauthorized', 401);

  let body: ToolkitRequest;
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const expectedTools = [...new Set(body.expected_tools ?? [])].slice(0, 12);
  if (!body.storage_path) {
    return jsonError('storage_path is required', 400);
  }

  if (expectedTools.length === 0) {
    return jsonResponse({
      verified_tools: [],
      missing_tools: [],
      overall_verdict: false,
    });
  }

  if (!groqApiKey) {
    return jsonResponse({
      verified_tools: [],
      missing_tools: expectedTools,
      overall_verdict: false,
    });
  }

  const { data: fileData, error: downloadError } = await adminClient
    .storage
    .from('kyc-docs')
    .download(body.storage_path);

  if (downloadError || !fileData) {
    console.error('Toolkit download failed', downloadError);
    return jsonError('Could not access toolkit photo', 500);
  }

  const bytes = new Uint8Array(await fileData.arrayBuffer());
  const base64 = btoa(String.fromCharCode(...bytes));
  const ext = body.storage_path.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
  const trades = body.trades?.filter(Boolean).join(', ') || 'general home repair';

  const prompt = `You are checking a toolkit photo for a home service worker in India.
Worker trade(s): ${trades}
Expected tools: ${expectedTools.join(', ')}

Look only for tools that are clearly visible. Use simple judgement; many normal workers use local/alternate tool brands.
Return ONLY valid JSON:
{
  "verified_tools": ["tools from expected list that are clearly visible or reasonable equivalent"],
  "missing_tools": ["expected tools not visible"],
  "overall_verdict": true if at least half of expected tools are visible and basic safety/work tools are present, else false
}`;

  const groqPayload = {
    model: GROQ_MODEL,
    temperature: 0.2,
    max_tokens: 512,
    messages: [
      { role: 'system', content: 'You are a strict JSON generator. Return only valid JSON.' },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mime};base64,${base64}`
            }
          },
          { type: 'text', text: prompt }
        ]
      }
    ]
  };

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify(groqPayload),
    });

    if (!groqRes.ok) {
      console.error('Groq toolkit error', await groqRes.text());
      return jsonResponse({
        verified_tools: [],
        missing_tools: expectedTools,
        overall_verdict: false,
      });
    }

    const groqData = await groqRes.json();
    const rawText: string = groqData?.choices?.[0]?.message?.content ?? '';
    const parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());
    const verified = Array.isArray(parsed.verified_tools) ? parsed.verified_tools.map(String) : [];
    const missing = Array.isArray(parsed.missing_tools) ? parsed.missing_tools.map(String) : [];

    return jsonResponse({
      verified_tools: verified,
      missing_tools: missing,
      overall_verdict: Boolean(parsed.overall_verdict),
    });
  } catch (err) {
    console.error('Toolkit AI failed', err);
    return jsonResponse({
      verified_tools: [],
      missing_tools: expectedTools,
      overall_verdict: false,
    });
  }
});

function jsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
