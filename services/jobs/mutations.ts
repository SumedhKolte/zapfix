import { supabase } from '@/lib/supabase';
import type { TablesInsert, TablesUpdate } from '@/types/database';

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
