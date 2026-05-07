import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const authClient = (authHeader: string) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { data, error } = await authClient(authHeader).auth.getUser();
  if (error || !data.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await req.json();
  const { transcript } = body as { transcript?: { question: string; answer: string }[] };

  // TODO: Call Gemini with grading prompt.
  const result = {
    score: 7.5,
    feedback: 'Solid technical fundamentals. Consider adding more safety checks.',
    strengths: ['Clear troubleshooting steps'],
    improvements: ['Mention safety precautions explicitly']
  };

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
});
