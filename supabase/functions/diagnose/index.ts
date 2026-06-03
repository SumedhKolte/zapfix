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

// Google Gemini 2.5 Flash handles both vision (image) and text-only diagnosis.
// The key is a SERVER-SIDE secret only — never shipped in the app bundle.
// (gemini-2.0-flash was retired; 2.5-flash is the current stable Flash model.)
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Allowed trades — kept in one place so the prompt, the response schema, and the
// server-side validation can never drift apart.
const ALLOWED_SKILLS = [
  'AC Repair',
  'Electrical',
  'Plumbing',
  'Washing Machine Repair',
  'Refrigerator Repair',
  'General Appliance',
] as const;

// Gemini structured-output schema. Forcing this guarantees the model returns a
// single well-formed JSON object with exactly these detection fields — no
// markdown, no code fences, no missing keys. Price is computed server-side and
// is deliberately NOT part of the model output.
const DIAGNOSIS_SCHEMA = {
  type: 'OBJECT',
  properties: {
    fault_detected: { type: 'BOOLEAN' },
    fault_name: { type: 'STRING' },
    fault_description: { type: 'STRING' },
    confidence: { type: 'INTEGER' },
    required_parts: { type: 'ARRAY', items: { type: 'STRING' } },
    required_skill: { type: 'STRING', enum: [...ALLOWED_SKILLS] },
    urgency: { type: 'STRING', enum: ['low', 'medium', 'high'] },
  },
  required: [
    'fault_detected',
    'fault_name',
    'fault_description',
    'confidence',
    'required_parts',
    'required_skill',
    'urgency',
  ],
} as const;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Detection-only prompt. The model identifies the fault; pricing is computed
// server-side from a fixed per-category table, and the output shape is enforced
// by the Gemini responseSchema — so there are no pricing or JSON-format rules
// here on purpose.
const SYSTEM_PROMPT = `You are an expert home appliance and AC repair technician with 20 years of field experience in India.

You receive an image and/or a customer's description. Identify the single most likely fault.

RELIABILITY OVER GUESSING:
- If the image clearly shows a damaged or faulty appliance, OR the description names a specific symptom, diagnose it precisely.
- If the image is unclear, unrelated, blurry, dark, OR the symptom is too vague, set fault_detected=false and confidence below 35. Do NOT fabricate a fault.
- If the photo is a normal-looking appliance with no visible defect AND there is no description, set fault_detected=false.

FIELD GUIDANCE:
- fault_name: 2–5 words in Title Case. Example: "Capacitor Failure", "Dirty Air Filter", "PCB Fault".
- fault_description: 2–3 plain English sentences naming the symptom and the likely cause. Do not mention price.
- required_parts: short lowercase generic part names. Example: ["capacitor", "fan motor"].
- required_skill: pick the single best-matching trade from the allowed list.
- confidence: integer 0–100.
- urgency: low, medium, or high.

When fault_detected is false: set fault_name to "Needs Closer Inspection", confidence below 35, urgency "low", and use fault_description to tell the customer what to send (a clearer photo, the model label, or an error code).`;

const CATEGORY_MAP: Record<string, string> = {
  'ac repair': 'AC',
  'ac': 'AC',
  'electrical': 'Electrical',
  'plumbing': 'Plumbing',
  'washing': 'Washing Machine',
  'washing machine': 'Washing Machine',
  'washing machine repair': 'Washing Machine',
  'refrigerator': 'Refrigerator',
  'refrigerator repair': 'Refrigerator',
  'fridge': 'Refrigerator',
};

const normalizeCategory = (raw?: string | null): string | null => {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  return CATEGORY_MAP[key] ?? null;
};

// Strip code fences and slice from the first { to the matching }. Tolerates
// chatty wrappers like "Sure, here you go: { ... }".
const extractJson = (raw: string): string | null => {
  if (!raw) return null;
  let text = raw.trim().replace(/```json|```/gi, '').trim();

  const firstBrace = text.indexOf('{');
  if (firstBrace < 0) return null;
  text = text.slice(firstBrace);

  let depth = 0;
  let inString = false;
  let escape = false;
  let end = -1;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end < 0) return null;
  return text.slice(0, end + 1);
};

// Convert shouty caps strings to Title Case for headlines. Keeps mixed-case and
// short acronyms (≤3 letters) untouched so "AC", "PCB", "USB" survive.
const titleCase = (value: string): string => {
  if (!value) return value;
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  // Only retitle if the whole string is screaming.
  const isAllCaps = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed);
  if (!isAllCaps) return trimmed;
  return trimmed
    .toLowerCase()
    .split(/(\s+|-|\/)/)
    .map((part) => {
      if (!/[a-z]/.test(part)) return part;
      if (part.length <= 3) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
};

// Convert SCREAMED sentences to sentence case while keeping short acronyms.
const sentenceCase = (value: string): string => {
  if (!value) return value;
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  const isAllCaps = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed);
  if (!isAllCaps) return trimmed;
  const sentences = trimmed.split(/([.!?]\s+)/);
  return sentences
    .map((sentence) => {
      if (!/[A-Z]/.test(sentence)) return sentence;
      const tokens = sentence.toLowerCase().split(/(\s+)/);
      const rebuilt = tokens
        .map((tok) => {
          if (!/[a-z]/.test(tok)) return tok;
          if (tok.length <= 3) return tok.toUpperCase();
          return tok;
        })
        .join('');
      return rebuilt.charAt(0).toUpperCase() + rebuilt.slice(1);
    })
    .join('');
};

const toLowerArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => String(v ?? '').trim().toLowerCase())
    .filter((v) => v.length > 0 && v.length < 60);
};

// djb2 hash → 31-bit unsigned int. Used as a deterministic Groq seed so that
// re-analysing the same image+description returns the same price. We sample
// chunks of the base64 instead of hashing the whole megabyte payload.
const fingerprintSeed = (parts: Array<string | null | undefined>): number => {
  let probe = '';
  for (const part of parts) {
    if (!part) continue;
    if (part.length <= 512) {
      probe += part;
    } else {
      probe += part.slice(0, 256);
      probe += part.slice(Math.floor(part.length / 2), Math.floor(part.length / 2) + 256);
      probe += part.slice(-256);
    }
    probe += '|';
  }
  let h = 5381;
  for (let i = 0; i < probe.length; i++) {
    h = ((h * 33) ^ probe.charCodeAt(i)) >>> 0;
  }
  return h & 0x7fffffff;
};

const callGemini = async (payload: Record<string, unknown>, attempt: number): Promise<Response> => {
  // The API key goes in the header (x-goog-api-key), never the URL, so it does
  // not leak into request logs.
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': geminiApiKey,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok && attempt < 2) {
    // Backoff and retry transient errors (rate limit / 5xx).
    if (res.status === 429 || res.status >= 500) {
      const delay = 600 * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return callGemini(payload, attempt + 1);
    }
  }
  return res;
};

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
    frames?: string[];
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

  const { base64, mime_type, frames, storage_path, job_id, category, problem_description } = body;
  const problemDescription = problem_description?.trim();

  const stripPrefix = (s: string) => (s.includes(',') ? s.split(',')[1] : s);

  // One or more still images to analyse. A photo is a single entry; a video is
  // sent by the client as several sampled JPEG frames so Gemini can reason
  // across the whole clip (motion, progression) rather than a single moment.
  const imageInputs: Array<{ base64: string; mime: string }> = [];

  if (Array.isArray(frames) && frames.length > 0) {
    for (const frame of frames.slice(0, 5)) {
      if (typeof frame === 'string' && frame.trim().length > 0) {
        imageInputs.push({ base64: stripPrefix(frame), mime: 'image/jpeg' });
      }
    }
  } else if (base64 && mime_type) {
    imageInputs.push({ base64: stripPrefix(base64), mime: mime_type });
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
    const storedBase64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

    const ext = filePath.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      mp4: 'video/mp4',
      mov: 'video/quicktime',
    };
    imageInputs.push({ base64: storedBase64, mime: mimeMap[ext] ?? 'image/jpeg' });
  } else if (!problemDescription) {
    return jsonError(
      'Provide either { base64, mime_type }, { frames }, { storage_path }, or problem_description',
      400
    );
  }

  // Image parts must be still images. Video is handled upstream by sampling
  // frames on the client, so anything still tagged as video is rejected clearly.
  if (imageInputs.some((i) => i.mime.startsWith('video/'))) {
    return jsonError(
      'Send a video as sampled image frames, not as a raw video file.',
      415
    );
  }

  const canonicalCategory = normalizeCategory(category);
  const useVision = imageInputs.length > 0;

  console.log(
    `Calling Gemini ${GEMINI_MODEL} | user: ${userId} | mode: ${useVision ? `${imageInputs.length} frame(s)` : 'text-only'} | job: ${job_id ?? 'none'}`
  );

  if (!geminiApiKey) {
    console.error('GEMINI_API_KEY is not set');
    return jsonError('Diagnosis service is not configured. Please try again later.', 503);
  }

  const videoHint =
    imageInputs.length > 1
      ? 'The images below are sequential frames sampled from one short video of the same appliance. Read them together as a single clip to judge motion, sparks, leaks, or progression.'
      : '';

  const promptText = [
    category ? `Category hint: ${category}.` : '',
    problemDescription ? `Customer problem description: ${problemDescription}` : '',
    videoHint,
    SYSTEM_PROMPT,
  ].filter(Boolean).join('\n\n');

  // Gemini "parts": every image frame first, then the instruction text.
  const userParts: Array<Record<string, unknown>> = [];
  for (const img of imageInputs) {
    userParts.push({ inline_data: { mime_type: img.mime, data: img.base64 } });
  }
  userParts.push({ text: promptText });

  // Determinism: temperature=0 + a fixed seed derived from the exact input.
  // Same media + description ⇒ same detection. (Price is fixed in code anyway.)
  const seed = fingerprintSeed([
    ...imageInputs.map((i) => i.base64),
    problemDescription ?? '',
    canonicalCategory ?? '',
  ]);

  const geminiPayload = {
    systemInstruction: {
      parts: [{
        text: 'You are a careful appliance-diagnosis assistant. Answer strictly using the provided JSON schema. Write in normal sentence case, never in all caps.',
      }],
    },
    contents: [{ role: 'user', parts: userParts }],
    generationConfig: {
      temperature: 0,
      topP: 1,
      seed,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
      responseSchema: DIAGNOSIS_SCHEMA,
      // Disable "thinking": for schema-constrained extraction it only adds
      // latency, cost, and run-to-run variation. Keeps detections reproducible.
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  let diagnosis: Record<string, unknown> | null = null;
  let lastRaw = '';

  for (let attempt = 0; attempt < 2 && !diagnosis; attempt++) {
    let geminiRes: Response;
    try {
      geminiRes = await callGemini(geminiPayload, 0);
    } catch (e) {
      console.error('Gemini network error:', e);
      return jsonError('Failed to reach the diagnosis service. Please check your connection and try again.', 502);
    }

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error(`Gemini ${geminiRes.status}:`, errText.slice(0, 500));
      if (attempt >= 1) {
        return jsonError('Our diagnosis engine is busy. Please try again in a moment.', 502);
      }
      continue;
    }

    const geminiData = await geminiRes.json();

    // A blocked prompt returns no candidates — surface a clear message.
    const blockReason = geminiData?.promptFeedback?.blockReason;
    if (blockReason) {
      console.error('Gemini blocked prompt:', blockReason);
      return jsonError('We could not analyse this image. Please try a clear photo of the appliance.', 422);
    }

    const candidate = geminiData?.candidates?.[0];
    const rawText: string = (candidate?.content?.parts ?? [])
      .map((p: { text?: string }) => p?.text ?? '')
      .join('')
      .trim();
    lastRaw = rawText;

    if (!rawText) {
      console.error(`Gemini empty response on attempt ${attempt} (finishReason: ${candidate?.finishReason ?? 'none'})`);
      continue;
    }

    // responseSchema guarantees valid JSON, but extractJson stays as a belt-and-
    // braces fallback in case a response is ever wrapped.
    const jsonSlice = extractJson(rawText) ?? rawText;
    try {
      diagnosis = JSON.parse(jsonSlice);
    } catch (err) {
      console.error(`JSON.parse failed on attempt ${attempt}:`, err, 'raw:', jsonSlice.slice(0, 400));
    }
  }

  if (!diagnosis) {
    console.error('Final raw Gemini response:', lastRaw.slice(0, 600));
    return jsonError(
      'We could not analyse this clearly. Please take a sharper, well-lit photo or add a short description and try again.',
      422
    );
  }

  // Normalize text fields so the UI never shows ALL CAPS or empty strings.
  const faultDetectedRaw = diagnosis.fault_detected;
  const faultDetected = faultDetectedRaw === false ? false : true;

  let faultName = titleCase(String(diagnosis.fault_name ?? '').trim());
  if (!faultName) faultName = faultDetected ? 'Possible Appliance Fault' : 'Needs Closer Inspection';

  let faultDescription = sentenceCase(String(diagnosis.fault_description ?? '').trim());
  if (!faultDescription) {
    faultDescription = faultDetected
      ? 'We could not extract a detailed description. Please share a clearer photo or short description so we can be more specific.'
      : 'We could not identify a clear fault from what was shared. Please send a sharper, well-lit photo of the appliance and the model label so we can diagnose it accurately.';
  }

  const requiredParts = toLowerArray(diagnosis.required_parts);

  const allowedSkills = new Set<string>(ALLOWED_SKILLS);
  let requiredSkill = String(diagnosis.required_skill ?? '').trim();
  if (!allowedSkills.has(requiredSkill)) {
    requiredSkill = 'General Appliance';
  }

  let confidence = Math.round(Number(diagnosis.confidence ?? 0));
  if (!Number.isFinite(confidence)) confidence = 0;
  confidence = Math.max(0, Math.min(100, confidence));
  if (!faultDetected) confidence = Math.min(confidence, 34);

  const urgencyRaw = String(diagnosis.urgency ?? '').toLowerCase();
  const urgency: 'low' | 'medium' | 'high' =
    urgencyRaw === 'high' || urgencyRaw === 'medium' || urgencyRaw === 'low'
      ? (urgencyRaw as 'low' | 'medium' | 'high')
      : faultDetected ? 'medium' : 'low';

  // Pricing: the AI is NOT trusted to price — vision LLMs are non-deterministic
  // and produce wildly different numbers for the same photo. Instead the price
  // is a FIXED amount per detected service category. Same category ⇒ same price,
  // every single time. The AI only decides WHICH category (required_skill).
  {
    // Fixed upfront booking price per service skill, in paise (₹ × 100).
    const CATEGORY_FIXED_PRICE: Record<string, number> = {
      'AC Repair': 49900,                 // ₹499
      'Electrical': 29900,                // ₹299
      'Plumbing': 34900,                  // ₹349
      'Washing Machine Repair': 39900,    // ₹399
      'Refrigerator Repair': 44900,       // ₹449
      'General Appliance': 29900,         // ₹299
    };
    const VISIT_FEE_ONLY = 19900; // ₹199 — charged when no clear fault is found

    const point = faultDetected
      ? (CATEGORY_FIXED_PRICE[requiredSkill] ?? CATEGORY_FIXED_PRICE['General Appliance'])
      : VISIT_FEE_ONLY;

    // Both fields equal so the existing UI shows a single stable number.
    diagnosis.est_cost_min = point;
    diagnosis.est_cost_max = point;
    diagnosis.est_cost = point;
    diagnosis.pricing_mode = 'fixed_category';
  }

  // Repack the cleaned response.
  diagnosis.fault_detected = faultDetected;
  diagnosis.fault_name = faultName;
  diagnosis.fault_description = faultDescription;
  diagnosis.confidence = confidence;
  diagnosis.required_parts = requiredParts;
  diagnosis.required_skill = requiredSkill;
  diagnosis.urgency = urgency;

  let savedStoragePath: string | null = null;

  // Persist the primary frame/photo for the job record. Only for inline uploads
  // (base64 photo or sampled video frames) — storage_path media is already saved.
  const inlineOrigin = Boolean((Array.isArray(frames) && frames.length > 0) || (base64 && mime_type));
  const primaryImage = imageInputs[0] ?? null;

  if (inlineOrigin && primaryImage && job_id) {
    const ext = primaryImage.mime === 'image/png' ? 'png'
      : primaryImage.mime === 'image/webp' ? 'webp'
      : 'jpg';
    const fileName = `${job_id}/diagnosis.${ext}`;

    const binaryStr = atob(primaryImage.base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i += 1) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const { error: uploadError } = await adminClient
      .storage
      .from('job-media')
      .upload(fileName, bytes, { contentType: primaryImage.mime, upsert: true });

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
