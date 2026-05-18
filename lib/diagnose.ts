import * as FileSystem from 'expo-file-system';

import { Config } from '@/constants/config';
import { supabase } from '@/lib/supabase';

export type DiagnosisResult = {
  fault_name: string;
  fault_description: string;
  confidence: number;
  required_parts: string[];
  required_skill: string;
  est_cost_min: number;
  est_cost_max: number;
  urgency: 'low' | 'medium' | 'high';
  _meta?: { saved_path: string | null; job_id: string | null };
};

export const diagnoseImage = async (
  imageUri: string | null,
  jobId?: string,
  category?: string,
  problemDescription?: string
): Promise<DiagnosisResult> => {
  const trimmedDescription = problemDescription?.trim();
  let base64: string | undefined;
  let mimeType: string | undefined;

  if (imageUri) {
    base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64
    });

    const ext = imageUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      heic: 'image/jpeg',
      heif: 'image/jpeg',
      mp4: 'video/mp4',
      mov: 'video/quicktime'
    };
    mimeType = mimeMap[ext] ?? 'image/jpeg';
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    throw new Error('Not authenticated. Please log in again.');
  }

  const response = await fetch(
    `${Config.supabaseUrl}/functions/v1/diagnose`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        base64,
        mime_type: mimeType,
        job_id: jobId,
        category,
        problem_description: trimmedDescription
      })
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error ?? `Diagnosis failed with status ${response.status}`);
  }

  return data as DiagnosisResult;
};
