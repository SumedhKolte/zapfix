import {
  subscribeToJob,
  subscribeToProLocation,
  subscribeToNewJobRequest
} from '@/services/jobs';

export const useRealtime = () => {
  return {
    subscribeToJob,
    subscribeToProLocation,
    subscribeToNewJobRequest
  };
};
