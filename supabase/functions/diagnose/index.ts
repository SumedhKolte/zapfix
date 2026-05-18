import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const groqApiKey = Deno.env.get('GROQ_API_KEY') ?? '';

const authClient = (authHeader: string) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

const adminClient = createClient(supabaseUrl, serviceRoleKey);

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM_PROMPT = `You are an expert home appliance and AC repair technician with 20 years of experience in India.
Analyse the provided image and/or customer problem description carefully and diagnose the fault.
Use the customer's description as important context. If the photo and description conflict, mention the uncertainty in fault_description and reduce confidence.

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
    problem_description?: string;
  };

  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const { base64, mime_type, storage_path, job_id, category, problem_description } = body;
  const problemDescription = problem_description?.trim();

  let imageBase64: string | null = null;
  let imageMime: string | null = null;

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
    if (!problemDescription) {
      return jsonError(
        'Provide either { base64, mime_type }, { storage_path }, or problem_description',
        400
      );
    }
  }

  console.log(`Calling Groq | user: ${userId} | mime: ${imageMime ?? 'text-only'} | job: ${job_id ?? 'none'}`);

  const userContent: Array<Record<string, unknown>> = [];
  if (imageBase64 && imageMime) {
    userContent.push({
      type: 'image_url',
      image_url: {
        url: `data:${imageMime};base64,${imageBase64}`
      }
    });
  }

  const contextLines = [
    category ? `Category hint: ${category}.` : '',
    problemDescription ? `Customer problem description: ${problemDescription}` : '',
    SYSTEM_PROMPT
  ].filter(Boolean);

  userContent.push({
    type: 'text',
    text: contextLines.join('\n\n')
  });

  const groqPayload = {
    model: GROQ_MODEL,
    temperature: 0.2,
    max_tokens: 1024,
    messages: [
      {
        role: 'system',
        content: 'You are a strict JSON generator. Return only valid JSON.'
      },
      {
        role: 'user',
        content: userContent
      }
    ]
  };

  let groqRes: Response;
  try {
    groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify(groqPayload),
    });
  } catch (e) {
    console.error('Groq network error:', e);
    return jsonError('Failed to reach Groq API. Verify GROQ_API_KEY secret is set.', 502);
  }

  if (!groqRes.ok) {
    const errText = await groqRes.text();
    console.error(`Groq ${groqRes.status}:`, errText);
    return jsonError(`Groq API returned ${groqRes.status}. Check API key and quota.`, 502);
  }

  const groqData = await groqRes.json();
  const rawText: string = groqData?.choices?.[0]?.message?.content ?? '';

  if (!rawText) {
    console.error('Groq empty response:', JSON.stringify(groqData));
    return jsonError('AI returned empty response. Please try again.', 422);
  }

  let diagnosis: Record<string, unknown>;
  try {
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    diagnosis = JSON.parse(cleaned);
  } catch {
    console.error('Non-JSON from Groq:', rawText);
    return jsonError(
      'AI could not clearly analyse this image. Please take a clearer, well-lit photo and try again.',
      422
    );
  }

  let savedStoragePath: string | null = null;

  if (base64 && imageBase64 && imageMime && job_id) {
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
        ai_result: {
          ...diagnosis,
          customer_description: problemDescription ?? null,
        },
      });
    }
  }

  if (job_id) {
    const { error: updateError } = await adminClient
      .from('jobs')
      .update({
        ai_diagnosis: String(diagnosis.fault_name ?? ''),
        ai_confidence: Number(diagnosis.confidence ?? 0),
        ai_raw_response: {
          ...diagnosis,
          customer_description: problemDescription ?? null,
        },
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
      customer_description: problemDescription ?? null,
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
