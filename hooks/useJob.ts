import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QueryKeys } from '@/constants/queryKeys';
import {
  createJob,
  getJobById,
  getJobsForCustomer,
  getJobsForPro,
  submitDiagnosisFeedback,
  updateJobStatus
} from '@/services/jobs';

export const useJob = (options: { jobId?: string; customerId?: string; proId?: string }) => {
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

  const createJobMutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.jobs });
    }
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: Parameters<typeof updateJobStatus>[1] }) =>
      updateJobStatus(jobId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.jobs });
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: QueryKeys.job(data.id) });
      }
    }
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ jobId, feedback }: { jobId: string; feedback: boolean }) =>
      submitDiagnosisFeedback(jobId, feedback),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.jobs });
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: QueryKeys.job(data.id) });
      }
    }
  });

  return {
    jobQuery,
    jobsQuery,
    createJob: createJobMutation.mutateAsync,
    updateJobStatus: updateJobMutation.mutateAsync,
    submitFeedback: feedbackMutation.mutateAsync
  };
};
