import { useQuery } from '@tanstack/react-query';

import { getProPublicSummary } from '@/services/profile';

// Fetches the public-facing summary of an assigned pro (name, avatar, rating,
// jobs completed, location). Used by the customer-side "Pro assigned" card.
// RLS hides rows from unrelated users, so a customer can only read this for
// a pro they're matched with.
export const useProSummary = (proId: string | null | undefined) =>
  useQuery({
    queryKey: ['pro-summary', proId],
    queryFn: () => (proId ? getProPublicSummary(proId) : Promise.resolve(null)),
    enabled: Boolean(proId),
    staleTime: 60 * 1000,
  });
