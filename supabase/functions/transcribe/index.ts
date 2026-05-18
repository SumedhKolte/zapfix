import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const groqApiKey = Deno.env.get('GROQ_API_KEY') ?? '';

const GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_MODEL = 'whisper-large-v3-turbo';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const authClient = (authHeader: string) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return jsonError('Method not allowed', 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return jsonError('Unauthorized', 401);

  const { data: userData, error: authError } =
    await authClient(authHeader).auth.getUser();
  if (authError || !userData?.user) return jsonError('Unauthorized', 401);

  let body: { base64?: string; mime_type?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const { base64, mime_type } = body;
  if (!base64 || !mime_type) {
    return jsonError('Provide { base64, mime_type }', 400);
  }

  const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
  const binaryStr = atob(cleanBase64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i += 1) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const formData = new FormData();
  formData.append('model', GROQ_MODEL);
  formData.append('temperature', '0');
  formData.append('response_format', 'json');
  formData.append('file', new Blob([bytes], { type: mime_type }), fileNameForMime(mime_type));

  let groqRes: Response;
  try {
    groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: formData,
    });
  } catch (e) {
    console.error('Groq transcription network error:', e);
    return jsonError('Failed to reach transcription API. Verify GROQ_API_KEY secret is set.', 502);
  }

  if (!groqRes.ok) {
    const errText = await groqRes.text();
    console.error(`Groq transcription ${groqRes.status}:`, errText);
    return jsonError(`Transcription API returned ${groqRes.status}. Check API key and quota.`, 502);
  }

  const groqData = await groqRes.json();
  return new Response(
    JSON.stringify({ text: String(groqData?.text ?? '').trim() }),
    { headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
  );
});

function fileNameForMime(mimeType: string): string {
  if (mimeType.includes('wav')) return 'problem.wav';
  if (mimeType.includes('webm')) return 'problem.webm';
  if (mimeType.includes('caf')) return 'problem.caf';
  if (mimeType.includes('aac')) return 'problem.aac';
  return 'problem.m4a';
}

function jsonError(message: string, status: number): Response {
  console.error(`[${status}] ${message}`);
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
  );
}
