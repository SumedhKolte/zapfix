import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

export const getProfile = async (userId: string) => {
  // maybeSingle so a brand-new auth user (no profile row yet) returns null
  // instead of PGRST116 — that case is normal during onboarding.
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Tables<'profiles'> | null;
};

export const getProDetails = async (proId: string) => {
  // Customers (and pros before they finish onboarding) have no pro_details
  // row. Use maybeSingle so the UI can render the "set up your profile"
  // state instead of crashing on PGRST116.
  const { data, error } = await supabase
    .from('pro_details')
    .select('*')
    .eq('pro_id', proId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

export const getCustomerAddresses = async (customerId: string) => {
  const { data, error } = await supabase
    .from('customer_addresses')
    .select('*')
    .eq('customer_id', customerId)
    .order('is_default', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
};

// Aggregates everything a customer needs to see about their assigned pro:
// name, avatar, skill score, completed job count, average rating, current
// location for distance/ETA. Returns null if not allowed (RLS hides rows
// from unrelated users) — caller can fall back to placeholder UI.
export type ProPublicSummary = {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  skillScore: number | null;
  serviceRadiusKm: number | null;
  currentLocation: unknown | null;
  jobsCompleted: number;
  ratingAvg: number | null;
  ratingCount: number;
};

export const getProPublicSummary = async (proId: string): Promise<ProPublicSummary | null> => {
  // Profile (RLS: only visible to job participants — see migration).
  const profilePromise = supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('id', proId)
    .maybeSingle();

  const detailsPromise = supabase
    .from('pro_details')
    .select('ai_skill_score, service_radius_km, current_location')
    .eq('pro_id', proId)
    .maybeSingle();

  const completedPromise = supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('pro_id', proId)
    .eq('status', 'completed');

  const reviewsPromise = supabase
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', proId);

  const [profileRes, detailsRes, completedRes, reviewsRes] = await Promise.all([
    profilePromise,
    detailsPromise,
    completedPromise,
    reviewsPromise,
  ]);

  if (profileRes.error || !profileRes.data) return null;

  const ratings = (reviewsRes.data ?? []).map((r) => r.rating).filter((n): n is number => typeof n === 'number');
  const ratingAvg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

  return {
    id: profileRes.data.id,
    fullName: profileRes.data.full_name ?? null,
    avatarUrl: profileRes.data.avatar_url ?? null,
    skillScore: detailsRes.data?.ai_skill_score ? Number(detailsRes.data.ai_skill_score) : null,
    serviceRadiusKm: detailsRes.data?.service_radius_km ?? null,
    currentLocation: detailsRes.data?.current_location ?? null,
    jobsCompleted: completedRes.count ?? 0,
    ratingAvg,
    ratingCount: ratings.length,
  };
};

export const getAppliances = async (customerId: string) => {
  const { data, error } = await supabase
    .from('appliances')
    .select('*')
    .eq('customer_id', customerId)
    .order('next_service_due', { ascending: true });

  if (error) {
    throw error;
  }

  return data;
};
