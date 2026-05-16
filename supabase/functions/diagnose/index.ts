import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const geminiApiKey = Deno.env.get('GEMINI_API_KEY') ?? '';

const authClient = (authHeader: string) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

const adminClient = createClient(supabaseUrl, serviceRoleKey);

const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM_PROMPT = `You are an expert home appliance and AC repair technician with 20 years of experience in India.
Analyse the provided image carefully and diagnose the fault.

You MUST respond with ONLY a valid JSON object. No markdown, no explanation, no code fences. Just raw JSON.

Required fields:
{
  "fault_name": "short name e.g. Capacitor Failure, Dirty Filter, PCB Fault",
  "fault_description": "2-3 sentence plain English explanation of the problem and its likely cause",
  "confidence": <integer 0-100>,
  "required_parts": ["list", "of", "parts", "needed"],
  "required_skill": "one of: AC Repair, Electrical, Plumbing, Washing Machine Repair, Refrigerator Repair, General Appliance",
  "est_cost_min": <integer in PAISE e.g. 80000 for rupees 800>,
  "est_cost_max": <integer in PAISE e.g. 120000 for rupees 1200>,
  "urgency": "low" or "medium" or "high"
}

If image is unclear, not an appliance, or you cannot diagnose confidently: set confidence below 40 and explain in fault_description.`;

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

  const userId = userData.user.id;

  let body: {
    base64?: string;
    mime_type?: string;
    storage_path?: string;
    job_id?: string;
    category?: string;
  };

  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const { base64, mime_type, storage_path, job_id, category } = body;

  let imageBase64: string;
  let imageMime: string;

  if (base64 && mime_type) {
    imageBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
    imageMime = mime_type;
  } else if (storage_path) {
    const bucket = storage_path.split('/')[0];
    const filePath = storage_path.split('/').slice(1).join('/');

    const { data: fileData, error: downloadError } = await adminClient
      .storage
      .from(bucket)
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('Storage download error:', downloadError);
      return jsonError(
        `Could not access image from storage: ${downloadError?.message ?? 'unknown'}`,
        500
      );
    }

    const buffer = await fileData.arrayBuffer();
    imageBase64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

    const ext = filePath.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      mp4: 'video/mp4',
      mov: 'video/quicktime',
    };
    imageMime = mimeMap[ext] ?? 'image/jpeg';
  } else {
    return jsonError(
      'Provide either { base64, mime_type } or { storage_path }',
      400
    );
  }

  console.log(`Calling Gemini | user: ${userId} | mime: ${imageMime} | job: ${job_id ?? 'none'}`);

  const geminiPayload = {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: imageMime, data: imageBase64 } },
          { text: category ? `Category hint: ${category}.\n\n${SYSTEM_PROMPT}` : SYSTEM_PROMPT },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
    },
  };

  let geminiRes: Response;
  try {
    geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload),
    });
  } catch (e) {
    console.error('Gemini network error:', e);
    return jsonError('Failed to reach Gemini API. Verify GEMINI_API_KEY secret is set.', 502);
  }

  if (!geminiRes.ok) {
    const errText = await geminiRes.text();
    console.error(`Gemini ${geminiRes.status}:`, errText);
    return jsonError(`Gemini API returned ${geminiRes.status}. Check API key and quota.`, 502);
  }

  const geminiData = await geminiRes.json();
  const rawText: string =
    geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  if (!rawText) {
    console.error('Gemini empty response:', JSON.stringify(geminiData));
    return jsonError('AI returned empty response. Please try again.', 422);
  }

  let diagnosis: Record<string, unknown>;
  try {
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    diagnosis = JSON.parse(cleaned);
  } catch {
    console.error('Non-JSON from Gemini:', rawText);
    return jsonError(
      'AI could not clearly analyse this image. Please take a clearer, well-lit photo and try again.',
      422
    );
  }

  let savedStoragePath: string | null = null;

  if (base64 && job_id) {
    const ext = imageMime === 'image/png' ? 'png'
      : imageMime === 'image/webp' ? 'webp'
      : 'jpg';
    const fileName = `${job_id}/diagnosis.${ext}`;

    const binaryStr = atob(imageBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i += 1) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const { error: uploadError } = await adminClient
      .storage
      .from('job-media')
      .upload(fileName, bytes, { contentType: imageMime, upsert: true });

    if (uploadError) {
      console.error('Storage upload error (non-fatal):', uploadError);
    } else {
      savedStoragePath = `job-media/${fileName}`;
      await adminClient.from('media_assets').insert({
        entity_id: job_id,
        entity_type: 'job_before',
        storage_url: savedStoragePath,
        ai_verified: false,
        ai_result: diagnosis,
      });
    }
  }

  if (job_id) {
    const { error: updateError } = await adminClient
      .from('jobs')
      .update({
        ai_diagnosis: String(diagnosis.fault_name ?? ''),
        ai_confidence: Number(diagnosis.confidence ?? 0),
        ai_raw_response: diagnosis,
        est_cost_min: Number(diagnosis.est_cost_min ?? 0),
        est_cost_max: Number(diagnosis.est_cost_max ?? 0),
        status: 'triage',
      })
      .eq('id', job_id)
      .eq('customer_id', userId);

    if (updateError) {
      console.error('Failed to update job (non-fatal):', updateError);
    }
  }

  return new Response(
    JSON.stringify({
      ...diagnosis,
      _meta: { saved_path: savedStoragePath, job_id: job_id ?? null }
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