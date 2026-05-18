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

  let body: { transcript?: { question: string; answer: string }[]; pro_id?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { transcript, pro_id } = body;

  if (!transcript || transcript.length === 0) {
    return errorResponse('Missing transcript', 400);
  }

  // Format transcript for the model
  const transcriptText = transcript
    .map((t, i) => `Q${i + 1}: ${t.question}\nA${i + 1}: ${t.answer}`)
    .join('\n\n');

  const prompt = `You are evaluating a technical skill interview for a home service professional in India.

Here is their interview transcript:
${transcriptText}

Grade their performance on:
1. Technical accuracy (do their answers show genuine knowledge?)
2. Safety awareness (do they mention precautions?)
3. Customer communication (are they professional and clear?)
4. Practical experience (do answers feel hands-on, not theoretical?)

Respond ONLY with a valid JSON object. No markdown, no explanation.
Format:
{
  "score": number from 1.0 to 10.0 (one decimal place),
  "feedback": "2-3 sentence overall assessment in simple English",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "score_breakdown": {
    "technical_accuracy": number 1-10,
    "safety_awareness": number 1-10,
    "communication": number 1-10,
    "practical_experience": number 1-10
  }
}`;

  const groqPayload = {
    model: GROQ_MODEL,
    temperature: 0.3,
    max_tokens: 1024,
    messages: [
      { role: 'system', content: 'You are a strict JSON generator. Return only valid JSON.' },
      { role: 'user', content: prompt }
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
    console.error('Groq fetch error:', e);
    return errorResponse('Failed to reach Groq API', 502);
  }

  if (!groqRes.ok) {
    const errText = await groqRes.text();
    console.error('Groq error:', errText);
    return errorResponse('Groq API error', 502);
  }

  const groqData = await groqRes.json();
  const rawText: string = groqData?.choices?.[0]?.message?.content ?? '';

  let grading: Record<string, unknown>;
  try {
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    grading = JSON.parse(cleaned);
  } catch {
    console.error('Groq non-JSON response:', rawText);
    return errorResponse('Failed to parse AI grading response', 500);
  }

  // ── Save result to pro_details ──────────────────────────────
  const targetProId = pro_id ?? userData.user.id;

  const { error: updateError } = await adminClient
    .from('pro_details')
    .update({
      ai_skill_score: grading.score,
      interview_transcript: { transcript, grading },
      interview_locked_until: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48hr cooldown
    })
    .eq('pro_id', targetProId);

  if (updateError) {
    console.error('Failed to save interview result:', updateError);
  }

  return new Response(JSON.stringify(grading), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
});

function errorResponse(message: string, status: number) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
  );
}