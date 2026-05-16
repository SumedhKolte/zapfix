import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const geminiApiKey = Deno.env.get('GEMINI_API_KEY') ?? '';

const authClient = (authHeader: string) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

const adminClient = createClient(supabaseUrl, serviceRoleKey);

const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      }
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return errorResponse('Unauthorized', 401);

  const { data: userData, error: authError } = await authClient(authHeader).auth.getUser();
  if (authError || !userData.user) return errorResponse('Unauthorized', 401);

  let body: { before_path?: string; after_path?: string; diagnosis?: string; job_id?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { before_path, after_path, diagnosis, job_id } = body;

  if (!before_path || !after_path) {
    return errorResponse('Both before_path and after_path are required', 400);
  }

  // ── Download both images from Supabase Storage ───────────────
  const downloadImage = async (storagePath: string): Promise<string | null> => {
    const bucket = storagePath.split('/')[0];
    const filePath = storagePath.split('/').slice(1).join('/');

    const { data, error } = await adminClient.storage.from(bucket).download(filePath);
    if (error || !data) {
      console.error(`Failed to download ${storagePath}:`, error);
      return null;
    }

    const buffer = await data.arrayBuffer();
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  };

  const [beforeBase64, afterBase64] = await Promise.all([
    downloadImage(before_path),
    downloadImage(after_path),
  ]);

  if (!beforeBase64 || !afterBase64) {
    return errorResponse('Could not download one or both images from storage', 500);
  }

  const getExt = (path: string) => path.split('.').pop()?.toLowerCase() ?? 'jpg';
  const getMime = (ext: string) => ext === 'png' ? 'image/png' : 'image/jpeg';

  // ── Call Gemini with both images ─────────────────────────────
  const prompt = `You are verifying a home appliance repair.
The diagnosed fault was: "${diagnosis ?? 'not specified'}"

The FIRST image is the BEFORE photo (before repair).
The SECOND image is the AFTER photo (after repair).

Analyse both images and determine if a repair has been performed.

Respond ONLY with a valid JSON object. No markdown, no explanation.
Format:
{
  "repair_visible": true or false,
  "confidence": number between 0 and 1,
  "notes": "one to two sentence observation comparing the before and after",
  "issues_found": "any concerns about the after photo, or null if none"
}`;

  const geminiPayload = {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: getMime(getExt(before_path)), data: beforeBase64 } },
          { inline_data: { mime_type: getMime(getExt(after_path)), data: afterBase64 } },
          { text: prompt }
        ]
      }
    ],
    generationConfig: { temperature: 0.2, maxOutputTokens: 512 }
  };

  let geminiRes: Response;
  try {
    geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload),
    });
  } catch (e) {
    console.error('Gemini fetch error:', e);
    return errorResponse('Failed to reach Gemini API', 502);
  }

  if (!geminiRes.ok) {
    const errText = await geminiRes.text();
    console.error('Gemini error:', errText);
    return errorResponse('Gemini API error', 502);
  }

  const geminiData = await geminiRes.json();
  const rawText: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  let result: Record<string, unknown>;
  try {
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    result = JSON.parse(cleaned);
  } catch {
    console.error('Gemini non-JSON:', rawText);
    // If AI can't verify, default to unverified but don't block completion
    result = {
      repair_visible: false,
      confidence: 0,
      notes: 'Could not automatically verify. Customer confirmation required.',
      issues_found: null,
    };
  }

  // ── Update media_assets with verification result ──────────────
  if (job_id) {
    await adminClient
      .from('media_assets')
      .update({ ai_verified: result.repair_visible, ai_result: result })
      .eq('entity_id', job_id)
      .eq('entity_type', 'job_after');
  }

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
});

function errorResponse(message: string, status: number) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
  );
}