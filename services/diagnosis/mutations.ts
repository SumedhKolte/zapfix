import { diagnoseMedia } from '@/lib/gemini';

export const requestDiagnosis = async (payload: {
  storage_url: string;
  category?: string;
  problem_text?: string;
}) => {
  const { data, error } = await diagnoseMedia(payload);
  if (error) {
    throw error;
  }
  return data;
};
