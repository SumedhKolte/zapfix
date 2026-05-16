import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { QueryKeys } from '@/constants/queryKeys';
import {
  getProfile,
  getProDetails,
  getCustomerAddresses,
  getAppliances,
  updateProfile,
  updateProDetails
} from '@/services/profile';

export const useProfile = (userId: string) => {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: QueryKeys.profile(userId),
    queryFn: () => getProfile(userId),
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000
  });

  const proDetailsQuery = useQuery({
    queryKey: ['pro-details', userId],
    queryFn: () => getProDetails(userId),
    enabled: Boolean(userId)
  });

  const addressesQuery = useQuery({
    queryKey: ['addresses', userId],
    queryFn: () => getCustomerAddresses(userId),
    enabled: Boolean(userId)
  });

  const appliancesQuery = useQuery({
    queryKey: ['appliances', userId],
    queryFn: () => getAppliances(userId),
    enabled: Boolean(userId)
  });

  const updateProfileMutation = useMutation({
    mutationFn: (payload: { id: string; data: Parameters<typeof updateProfile>[1] }) =>
      updateProfile(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.profile(userId) });
    }
  });

  const updateProDetailsMutation = useMutation({
    mutationFn: (payload: { id: string; data: Parameters<typeof updateProDetails>[1] }) =>
      updateProDetails(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pro-details', userId] });
    }
  });

  return {
    profileQuery,
    proDetailsQuery,
    addressesQuery,
    appliancesQuery,
    updateProfile: updateProfileMutation.mutateAsync,
    updateProDetails: updateProDetailsMutation.mutateAsync
  };
};
