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
const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const GROQ_TEXT_MODEL = 'llama-3.3-70b-versatile';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM_PROMPT = `You are an expert home appliance and AC repair technician with 20 years of field experience in India.

You will receive an image and/or a customer's description. Your job is to identify the most likely fault and produce a reliable repair estimate.

PRIMARY GOAL — RELIABILITY OVER GUESSING:
- If the image clearly shows a damaged or faulty appliance OR the description names a specific symptom, diagnose it precisely.
- If the image is unclear, unrelated, blurry, dark, OR the symptom is too vague to diagnose, set fault_detected=false and confidence below 35. Do NOT fabricate a fault.
- If the photo is just a normal-looking appliance with no visible defect AND no description, fault_detected=false.

TEXT STYLE RULES (very important):
- Write in normal sentence case. NEVER write in ALL CAPS.
- fault_name: 2–5 words, Title Case. Example: "Capacitor Failure", "Dirty Air Filter", "PCB Fault". NOT "CAPACITOR FAILURE".
- fault_description: 2–3 plain English sentences. Sentence case. Mention symptoms and likely cause. Do NOT write the price in this field.
- required_parts: short, lowercase generic part names. Example: ["capacitor", "fan motor"]. NOT ["CAPACITOR"].

PRICING RULES (these matter — be precise, do not guess wildly):
- All money fields are in PAISE (₹ × 100). 80000 paise = ₹800.
- Build the estimate as: visit_fee + parts_total + labor_fee.
- visit_fee in India: 20000 paise (₹200) for routine, 30000 (₹300) for heavy.
- labor_fee: simple swap ~30000 paise (₹300), mid ~60000 (₹600), heavy/PCB/gas ~120000 (₹1200).
- parts_total: use the price anchors below when available. Otherwise use a conservative India market estimate.
- Output a SINGLE point estimate, not a wide range. Set est_cost_min and est_cost_max to the SAME value (or within 10% of each other for genuine uncertainty).
- est_cost_min and est_cost_max are integer paise.
- All numbers must be plain JSON integers. NOT strings, NOT scientific notation, NOT in words.
- The same image and description must always produce the same price — do not vary the estimate on re-analysis.

You MUST respond with ONLY a single valid JSON object. No markdown, no code fences, no commentary.

Schema:
{
  "fault_detected": <true | false>,
  "fault_name": "Short Title Case Name",
  "fault_description": "2-3 plain sentences",
  "confidence": <integer 0-100>,
  "required_parts": ["lowercase", "parts"],
  "required_skill": "AC Repair" | "Electrical" | "Plumbing" | "Washing Machine Repair" | "Refrigerator Repair" | "General Appliance",
  "est_cost_min": <integer in paise>,
  "est_cost_max": <integer in paise>,
  "urgency": "low" | "medium" | "high",
  "pricing_breakdown": {
    "visit_fee": <integer in paise>,
    "parts_total_min": <integer in paise>,
    "parts_total_max": <integer in paise>,
    "labor_min": <integer in paise>,
    "labor_max": <integer in paise>,
    "notes": "one short sentence explaining the price"
  }
}

When fault_detected is false: still return the schema, but set fault_name="Needs Closer Inspection", confidence below 35, urgency="low", and explain in fault_description what the customer should send (clearer photo, model label, error code, etc.). Keep est_cost_min/max as the visit fee only.`;

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

type PartAnchor = { part_name: string; avg_price_inr: number };
type CatalogPartRow = { part_name: string | null; avg_price_inr: number | null; category: string | null };

const fetchPartAnchors = async (category: string | null): Promise<PartAnchor[]> => {
  const query = adminClient
    .from('catalog_parts')
    .select('part_name, avg_price_inr, category')
    .eq('is_active', true)
    .not('avg_price_inr', 'is', null)
    .limit(40);

  const { data, error } = category
    ? await query.eq('category', category)
    : await query;

  if (error || !data) {
    if (error) console.warn('catalog_parts fetch failed (non-fatal):', error.message);
    return [];
  }

  return (data as CatalogPartRow[])
    .filter((row): row is { part_name: string; avg_price_inr: number; category: string | null } =>
      Boolean(row.part_name) && typeof row.avg_price_inr === 'number'
    )
    .map((row) => ({ part_name: row.part_name, avg_price_inr: row.avg_price_inr }));
};

const formatPartAnchors = (parts: PartAnchor[]): string => {
  if (parts.length === 0) return '';
  const lines = parts
    .slice(0, 25)
    .map((p) => `- ${p.part_name}: ${p.avg_price_inr} paise (₹${(p.avg_price_inr / 100).toFixed(0)})`)
    .join('\n');
  return `\n\nPRICE ANCHORS (real catalog averages — prefer these when picking parts_total):\n${lines}`;
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

const callGroq = async (payload: Record<string, unknown>, attempt: number): Promise<Response> => {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqApiKey}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok && attempt < 2) {
    // Backoff and retry transient errors.
    if (res.status === 429 || res.status >= 500) {
      const delay = 600 * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return callGroq(payload, attempt + 1);
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
  } else if (!problemDescription) {
    return jsonError(
      'Provide either { base64, mime_type }, { storage_path }, or problem_description',
      400
    );
  }

  // The vision model only accepts images. Reject video MIME types early so
  // callers know to send a frame instead.
  if (imageMime && imageMime.startsWith('video/')) {
    return jsonError(
      'Video files can not be analysed directly. Extract a frame on the client and send it as image/jpeg.',
      415
    );
  }

  const canonicalCategory = normalizeCategory(category);
  const partAnchors = await fetchPartAnchors(canonicalCategory);

  console.log(
    `Calling Groq | user: ${userId} | mime: ${imageMime ?? 'text-only'} | job: ${job_id ?? 'none'} | anchors: ${partAnchors.length}`
  );

  const promptText = [
    category ? `Category hint: ${category}.` : '',
    problemDescription ? `Customer problem description: ${problemDescription}` : '',
    SYSTEM_PROMPT + formatPartAnchors(partAnchors),
  ].filter(Boolean).join('\n\n');

  const useVision = Boolean(imageBase64 && imageMime);

  const userContent: Array<Record<string, unknown>> = [];
  if (useVision) {
    userContent.push({
      type: 'image_url',
      image_url: { url: `data:${imageMime};base64,${imageBase64}` },
    });
  }
  userContent.push({ type: 'text', text: promptText });

  // Determinism: temperature=0 + fixed seed derived from the input. Same
  // image+description ⇒ same Groq output ⇒ same price every time.
  const seed = fingerprintSeed([imageBase64, problemDescription ?? '', canonicalCategory ?? '']);

  let diagnosis: Record<string, unknown> | null = null;
  let lastRaw = '';

  for (let attempt = 0; attempt < 2 && !diagnosis; attempt++) {
    const groqPayload = {
      model: useVision ? GROQ_VISION_MODEL : GROQ_TEXT_MODEL,
      temperature: 0,
      top_p: 1,
      seed,
      max_tokens: 1024,
      response_format: { type: 'json_object' as const },
      messages: [
        {
          role: 'system',
          content:
            'You are a strict JSON generator. Return ONLY a single valid JSON object. No prose, no markdown, no code fences. Never write in all caps. Same input must always produce the same output.',
        },
        { role: 'user', content: useVision ? userContent : promptText },
      ],
    };

    let groqRes: Response;
    try {
      groqRes = await callGroq(groqPayload, 0);
    } catch (e) {
      console.error('Groq network error:', e);
      return jsonError('Failed to reach the diagnosis service. Please check your connection and try again.', 502);
    }

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error(`Groq ${groqRes.status}:`, errText);
      if (attempt >= 1) {
        return jsonError('Our diagnosis engine is busy. Please try again in a moment.', 502);
      }
      continue;
    }

    const groqData = await groqRes.json();
    const rawText: string = groqData?.choices?.[0]?.message?.content ?? '';
    lastRaw = rawText;

    if (!rawText) {
      console.error('Groq empty response on attempt', attempt);
      continue;
    }

    const jsonSlice = extractJson(rawText);
    if (!jsonSlice) {
      console.error(`Could not locate JSON on attempt ${attempt}:`, rawText.slice(0, 400));
      continue;
    }

    try {
      diagnosis = JSON.parse(jsonSlice);
    } catch (err) {
      console.error(`JSON.parse failed on attempt ${attempt}:`, err, 'raw:', jsonSlice.slice(0, 400));
    }
  }

  if (!diagnosis) {
    console.error('Final raw Groq response:', lastRaw.slice(0, 600));
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

  const allowedSkills = new Set([
    'AC Repair',
    'Electrical',
    'Plumbing',
    'Washing Machine Repair',
    'Refrigerator Repair',
    'General Appliance',
  ]);
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

  // Pricing: collapse to a SINGLE deterministic point estimate (no wide
  // ranges). Same image + description always yields the same price.
  {
    const VISIT_FEE_DEFAULT = 20000; // ₹200
    const LABOR_MID_DEFAULT = 50000; // ₹500
    const ABSOLUTE_MIN = 15000;      // ₹150
    const ABSOLUTE_MAX = 5000000;    // ₹50,000
    const ROUND_TO = 5000;           // Round to nearest ₹50 — psychologically cleaner.

    const matchedAnchors = partAnchors.filter((anchor) =>
      requiredParts.some(
        (part) =>
          anchor.part_name.toLowerCase().includes(part) ||
          part.includes(anchor.part_name.toLowerCase())
      )
    );

    // Use the midpoint of anchor prices (1.0×) instead of a ±20% band.
    const anchorPartsMid = matchedAnchors.reduce(
      (acc, p) => acc + Math.round(p.avg_price_inr),
      0
    );

    const aiMin = Math.round(Number(diagnosis.est_cost_min ?? 0));
    const aiMax = Math.round(Number(diagnosis.est_cost_max ?? 0));

    // Pick a single point: midpoint of AI range if both are valid, otherwise
    // fall back to a deterministic anchor-based computation.
    let point: number;
    if (Number.isFinite(aiMin) && Number.isFinite(aiMax) && aiMin > 0 && aiMax > 0) {
      point = Math.round((aiMin + aiMax) / 2);
    } else if (Number.isFinite(aiMin) && aiMin > 0) {
      point = aiMin;
    } else {
      point = VISIT_FEE_DEFAULT + anchorPartsMid + LABOR_MID_DEFAULT;
    }

    // Round to nearest ₹50 so the number feels intentional, not random.
    point = Math.round(point / ROUND_TO) * ROUND_TO;
    point = Math.max(ABSOLUTE_MIN, Math.min(point, ABSOLUTE_MAX));

    // If we could not detect a fault, only charge the visit fee.
    if (!faultDetected) {
      point = VISIT_FEE_DEFAULT;
    }

    // Backward-compatible: both fields equal so existing UI shows one number.
    diagnosis.est_cost_min = point;
    diagnosis.est_cost_max = point;
    diagnosis.est_cost = point;
    diagnosis.pricing_anchors_used = matchedAnchors.length;
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
