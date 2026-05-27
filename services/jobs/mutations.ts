import { supabase } from '@/lib/supabase';
import type { Json, TablesInsert, TablesUpdate } from '@/types/database';

export const createJob = async (payload: TablesInsert<'jobs'>) => {
  const { data, error } = await supabase.from('jobs').insert(payload).select('*').single();
  if (error) {
    throw error;
  }
  return data;
};

export const updateJobStatus = async (
  jobId: string,
  payload: TablesUpdate<'jobs'>
) => {
  const { data, error } = await supabase
    .from('jobs')
    .update(payload)
    .eq('id', jobId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }
  return data;
};

export const submitDiagnosisFeedback = async (jobId: string, feedback: boolean) => {
  const { data, error } = await supabase
    .from('jobs')
    .update({ diagnosis_feedback: feedback })
    .eq('id', jobId)
    .select('*')
    .single();
  if (error) {
    throw error;
  }
  return data;
};

const mergeRawResponse = (existing: Json | null | undefined, patch: Record<string, unknown>): Json => {
  const base = (existing && typeof existing === 'object' && !Array.isArray(existing)) ? existing : {};
  return { ...(base as Record<string, Json | undefined>), ...patch } as Json;
};

const fetchJob = async (jobId: string) => {
  const { data, error } = await supabase.from('jobs').select('*').eq('id', jobId).single();
  if (error) throw error;
  return data;
};

// Customer schedules a slot for the booking. Persists in ai_raw_response.scheduling.
export const scheduleJob = async (jobId: string, scheduledAt: string, note?: string) => {
  const current = await fetchJob(jobId);
  const next = mergeRawResponse(current.ai_raw_response, {
    scheduling: { scheduled_at: scheduledAt, note: note ?? null, booked_at: new Date().toISOString() },
  });
  return updateJobStatus(jobId, { status: 'searching', ai_raw_response: next });
};

// Pro accepts a job request directly (no time change).
export const proAcceptJob = async (jobId: string, proId: string) => {
  const current = await fetchJob(jobId);
  const next = mergeRawResponse(current.ai_raw_response, {
    counter_offer: null,
  });
  return updateJobStatus(jobId, {
    pro_id: proId,
    status: 'matched',
    matched_at: new Date().toISOString(),
    ai_raw_response: next,
  });
};

// Pro declines a job before accepting. Add them to the declines list so the
// dashboard filters this request out for them — other pros still see it.
export const proDeclineJob = async (jobId: string, proId: string) => {
  const current = await fetchJob(jobId);
  const declines = ((current.ai_raw_response as any)?.declines ?? []) as string[];
  const next = mergeRawResponse(current.ai_raw_response, {
    declines: Array.from(new Set([...declines, proId])),
  });
  return updateJobStatus(jobId, { ai_raw_response: next });
};

// Pro who has already accepted needs to bail (emergency, can't reach the
// site, etc.). Frees the job for re-matching, records the cancellation, and
// blocks this pro from seeing the same request again.
export const proCancelAcceptedJob = async (
  jobId: string,
  proId: string,
  reason?: string
) => {
  const current = await fetchJob(jobId);
  const declines = ((current.ai_raw_response as any)?.declines ?? []) as string[];
  const previousPros = ((current.ai_raw_response as any)?.previous_pros ?? []) as string[];
  const cancellations = ((current.ai_raw_response as any)?.pro_cancellations ?? []) as any[];
  const next = mergeRawResponse(current.ai_raw_response, {
    declines: Array.from(new Set([...declines, proId])),
    previous_pros: Array.from(new Set([...previousPros, proId])),
    pro_cancellations: [
      ...cancellations,
      { pro_id: proId, reason: reason ?? null, cancelled_at: new Date().toISOString() },
    ],
    // Drop any stale counter-offer / matching artifacts so the next pro
    // sees a clean request.
    counter_offer: null,
  });
  return updateJobStatus(jobId, {
    pro_id: null,
    status: 'searching',
    matched_at: null,
    ai_raw_response: next,
  });
};

// Pro proposes an alternative time. Customer must accept.
export const proProposeAltTime = async (jobId: string, proId: string, proposedAt: string, message?: string) => {
  const current = await fetchJob(jobId);
  const next = mergeRawResponse(current.ai_raw_response, {
    counter_offer: {
      pro_id: proId,
      proposed_at: proposedAt,
      message: message ?? null,
      created_at: new Date().toISOString(),
    },
  });
  return updateJobStatus(jobId, { pro_id: proId, ai_raw_response: next });
};

// Customer accepts the pro's counter-offer.
export const acceptCounterOffer = async (jobId: string) => {
  const current = await fetchJob(jobId);
  const counter = (current.ai_raw_response as any)?.counter_offer;
  if (!counter) {
    throw new Error('No counter-offer to accept.');
  }
  const next = mergeRawResponse(current.ai_raw_response, {
    scheduling: { ...(current.ai_raw_response as any)?.scheduling, scheduled_at: counter.proposed_at, rescheduled: true },
    counter_offer: { ...counter, accepted_at: new Date().toISOString() },
  });
  return updateJobStatus(jobId, {
    status: 'matched',
    matched_at: new Date().toISOString(),
    ai_raw_response: next,
  });
};

// Customer declines the pro's counter-offer. We also add the proposing pro
// to the declines list so they don't see the same request bounce back into
// their dashboard after the customer rejected their proposed time.
export const declineCounterOffer = async (jobId: string) => {
  const current = await fetchJob(jobId);
  const counter = (current.ai_raw_response as any)?.counter_offer;
  const proposingProId: string | undefined = counter?.pro_id;
  const declines = ((current.ai_raw_response as any)?.declines ?? []) as string[];
  const nextDeclines = proposingProId
    ? Array.from(new Set([...declines, proposingProId]))
    : declines;
  const next = mergeRawResponse(current.ai_raw_response, {
    counter_offer: null,
    declines: nextDeclines,
  });
  // Free up the job for re-matching.
  return updateJobStatus(jobId, {
    pro_id: null,
    ai_raw_response: next,
  });
};

// Pro marks themselves on the way.
export const proStartTransit = async (jobId: string) => {
  return updateJobStatus(jobId, { status: 'in_transit' });
};

export const proMarkArrived = async (jobId: string) => {
  return updateJobStatus(jobId, { status: 'arrived', arrived_at: new Date().toISOString() });
};

// Customer cancels a job.
export const cancelJob = async (jobId: string) => {
  return updateJobStatus(jobId, { status: 'cancelled', cancelled_at: new Date().toISOString() });
};
