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
  const { storage_url } = body as { storage_url?: string };

  if (!storage_url) {
    return new Response('Missing storage_url', { status: 400 });
  }

  console.log('Received URL:', storage_url);

  let mediaCheck = await fetch(storage_url, { method: 'HEAD' });
  if (mediaCheck.status === 405) {
    mediaCheck = await fetch(storage_url);
  }
  if (!mediaCheck.ok) {
    console.log('Storage URL not accessible', mediaCheck.status, mediaCheck.statusText);
    return new Response(JSON.stringify({
      error: 'storage_url not accessible',
      status: mediaCheck.status
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // TODO: Call Gemini 1.5 Flash with the image/video and system prompt.
  const diagnosis = {
    fault_name: 'Capacitor Failure',
    fault_description: 'The capacitor appears to be failing based on visible wear and typical symptoms.',
    confidence: 92,
    required_parts: ['45mfd Capacitor'],
    required_skill: 'AC Repair',
    est_cost_min: 80000,
    est_cost_max: 120000,
    urgency: 'medium'
  };

  // TODO: Persist diagnosis to jobs table with a valid job_id.
  void adminClient;

  return new Response(JSON.stringify(diagnosis), {
    headers: { 'Content-Type': 'application/json' }
  });
});
