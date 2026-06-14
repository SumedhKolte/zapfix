import { supabase } from '@/lib/supabase';

export type WithdrawalResult = {
  requestedCount: number;
  requestedAmount: number; // paise
};

// Asks the server to mark all of the current pro's pending earnings as
// 'requested' for payout. The 30/70 split and ownership check are enforced
// server-side (see request_earnings_withdrawal in the migration).
export const requestEarningsWithdrawal = async (): Promise<WithdrawalResult> => {
  // Cast: this RPC is new in the migration; regenerate types with
  // `supabase gen types` to drop the cast.
  const { data, error } = await (supabase.rpc as any)('request_earnings_withdrawal');
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    requestedCount: Number(row?.requested_count ?? 0),
    requestedAmount: Number(row?.requested_amount ?? 0),
  };
};
