import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const authClient = (authHeader: string) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

const adminClient = createClient(supabaseUrl, serviceRoleKey);

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
  const { job_id } = body as { job_id?: string };

  if (!job_id) {
    return new Response('Missing job_id', { status: 400 });
  }

  // TODO: Run find_matching_pros RPC and select the top pro.
  const { data: matches } = await adminClient.rpc('find_matching_pros', { job_id });

  const selected = Array.isArray(matches) ? matches[0] : null;

  if (!selected) {
    return new Response(JSON.stringify({ status: 'no_match' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // TODO: Create matching_log, send push notification, update jobs.status = 'searching'.

  return new Response(JSON.stringify({ status: 'searching', pro_id: selected.pro_id }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
