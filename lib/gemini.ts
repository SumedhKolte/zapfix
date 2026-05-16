import { supabase } from './supabase';

export type DiagnosePayload = {
  storage_path: string;
  category?: string;
  problem_text?: string;
};

export const diagnoseMedia = async (payload: DiagnosePayload) => {
  return supabase.functions.invoke('diagnose', {
    body: payload
  });
};

export const generateInterviewQuestions = async (skills: string[]) => {
  return supabase.functions.invoke('generate-interview-questions', {
    body: { skills }
  });
};

export const gradeInterview = async (transcript: { question: string; answer: string }[]) => {
  return supabase.functions.invoke('grade-interview', {
    body: { transcript }
  });
};

export const verifyToolkit = async (payload: { storage_url: string; expected_tools: string[] }) => {
  return supabase.functions.invoke('verify-toolkit', {
    body: payload
  });
};

export const verifyCompletion = async (payload: {
  before_url: string;
  after_url: string;
  diagnosis: string;
}) => {
  return supabase.functions.invoke('verify-completion', {
    body: payload
  });
};
