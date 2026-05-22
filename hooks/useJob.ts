import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QueryKeys } from '@/constants/queryKeys';
import {
  acceptCounterOffer,
  cancelJob,
  createJob,
  declineCounterOffer,
  getJobById,
  getJobsForCustomer,
  getJobsForPro,
  getOpenJobRequests,
  proAcceptJob,
  proDeclineJob,
  proMarkArrived,
  proProposeAltTime,
  proStartTransit,
  scheduleJob,
  submitDiagnosisFeedback,
  updateJobStatus,
} from '@/services/jobs';

export const useJob = (options: { jobId?: string; customerId?: string; proId?: string; openRequests?: boolean } = {}) => {
  const queryClient = useQueryClient();
  const jobQuery = useQuery({
    queryKey: options.jobId ? QueryKeys.job(options.jobId) : ['job'],
    queryFn: () => getJobById(options.jobId ?? ''),
    enabled: Boolean(options.jobId)
  });

  const jobsQuery = useQuery({
    queryKey: QueryKeys.jobs,
    queryFn: () => {
      if (options.customerId) {
        return getJobsForCustomer(options.customerId);
      }
      if (options.proId) {
        return getJobsForPro(options.proId);
      }
      return Promise.resolve([]);
    },
    enabled: Boolean(options.customerId || options.proId),
    staleTime: 30 * 1000
  });

  const openRequestsQuery = useQuery({
    queryKey: ['jobs', 'open-requests'],
    queryFn: getOpenJobRequests,
    enabled: Boolean(options.openRequests),
    refetchInterval: 15 * 1000,
    staleTime: 10 * 1000,
  });

  const invalidate = (jobId?: string | null) => {
    queryClient.invalidateQueries({ queryKey: QueryKeys.jobs });
    queryClient.invalidateQueries({ queryKey: ['jobs', 'open-requests'] });
    if (jobId) {
      queryClient.invalidateQueries({ queryKey: QueryKeys.job(jobId) });
    }
  };

  const createJobMutation = useMutation({
    mutationFn: createJob,
    onSuccess: (data) => invalidate(data?.id),
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: Parameters<typeof updateJobStatus>[1] }) =>
      updateJobStatus(jobId, data),
    onSuccess: (data) => invalidate(data?.id),
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ jobId, feedback }: { jobId: string; feedback: boolean }) =>
      submitDiagnosisFeedback(jobId, feedback),
    onSuccess: (data) => invalidate(data?.id),
  });

  const scheduleMutation = useMutation({
    mutationFn: ({ jobId, scheduledAt, note }: { jobId: string; scheduledAt: string; note?: string }) =>
      scheduleJob(jobId, scheduledAt, note),
    onSuccess: (data) => invalidate(data?.id),
  });

  const proAcceptMutation = useMutation({
    mutationFn: ({ jobId, proId }: { jobId: string; proId: string }) => proAcceptJob(jobId, proId),
    onSuccess: (data) => invalidate(data?.id),
  });

  const proDeclineMutation = useMutation({
    mutationFn: ({ jobId, proId }: { jobId: string; proId: string }) => proDeclineJob(jobId, proId),
    onSuccess: (data) => invalidate(data?.id),
  });

  const proProposeMutation = useMutation({
    mutationFn: ({ jobId, proId, proposedAt, message }: { jobId: string; proId: string; proposedAt: string; message?: string }) =>
      proProposeAltTime(jobId, proId, proposedAt, message),
    onSuccess: (data) => invalidate(data?.id),
  });

  const acceptCounterMutation = useMutation({
    mutationFn: ({ jobId }: { jobId: string }) => acceptCounterOffer(jobId),
    onSuccess: (data) => invalidate(data?.id),
  });

  const declineCounterMutation = useMutation({
    mutationFn: ({ jobId }: { jobId: string }) => declineCounterOffer(jobId),
    onSuccess: (data) => invalidate(data?.id),
  });

  const transitMutation = useMutation({
    mutationFn: ({ jobId }: { jobId: string }) => proStartTransit(jobId),
    onSuccess: (data) => invalidate(data?.id),
  });

  const arrivedMutation = useMutation({
    mutationFn: ({ jobId }: { jobId: string }) => proMarkArrived(jobId),
    onSuccess: (data) => invalidate(data?.id),
  });

  const cancelJobMutation = useMutation({
    mutationFn: ({ jobId }: { jobId: string }) => cancelJob(jobId),
    onSuccess: (data) => invalidate(data?.id),
  });

  return {
    jobQuery,
    jobsQuery,
    openRequestsQuery,
    createJob: createJobMutation.mutateAsync,
    updateJobStatus: updateJobMutation.mutateAsync,
    submitFeedback: feedbackMutation.mutateAsync,
    scheduleJob: scheduleMutation.mutateAsync,
    proAcceptJob: proAcceptMutation.mutateAsync,
    proDeclineJob: proDeclineMutation.mutateAsync,
    proProposeAltTime: proProposeMutation.mutateAsync,
    acceptCounterOffer: acceptCounterMutation.mutateAsync,
    declineCounterOffer: declineCounterMutation.mutateAsync,
    proStartTransit: transitMutation.mutateAsync,
    proMarkArrived: arrivedMutation.mutateAsync,
    cancelJob: cancelJobMutation.mutateAsync,
  };
};
