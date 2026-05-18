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
  const { expected_tools } = body as { expected_tools?: string[] };

  // TODO: Call Groq vision model for toolkit verification.
  const verified_tools = expected_tools?.slice(0, 2) ?? [];
  const missing_tools = expected_tools?.slice(2) ?? [];

  return new Response(
    JSON.stringify({
      verified_tools,
      missing_tools,
      overall_verdict: missing_tools.length === 0
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
