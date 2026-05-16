import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const geminiApiKey = Deno.env.get('GEMINI_API_KEY') ?? '';

const authClient = (authHeader: string) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

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

  let body: { skills?: string[] };
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { skills } = body;

  if (!skills || skills.length === 0) {
    return errorResponse('Missing skills array', 400);
  }

  const skillsList = skills.join(', ');

  const prompt = `You are conducting a technical skill assessment for a home service professional in India who has declared the following skills: ${skillsList}.

Generate exactly 3 technical interview questions to assess their real-world competency.
Questions should be practical, scenario-based, and progressively harder.
Mix diagnostic reasoning, safety awareness, and customer communication.

Respond ONLY with a valid JSON object. No markdown, no explanation.
Format:
{
  "questions": [
    "question 1 text",
    "question 2 text", 
    "question 3 text"
  ]
}`;

  const geminiPayload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.5, maxOutputTokens: 512 }
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

  let result: { questions: string[] };
  try {
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    result = JSON.parse(cleaned);
  } catch {
    console.error('Gemini non-JSON response:', rawText);
    // Fallback questions if Gemini returns malformed JSON
    result = {
      questions: [
        `A customer says their ${skills[0]} is not working. Walk me through your first 3 diagnosis steps.`,
        'What safety precautions do you take before starting any electrical or gas-related repair?',
        'A customer is unhappy with the repair cost you quoted. How do you handle this situation?'
      ]
    };
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