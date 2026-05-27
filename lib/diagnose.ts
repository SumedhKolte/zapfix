import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

import { Config } from '@/constants/config';
import { supabase } from '@/lib/supabase';

export type DiagnosisResult = {
  fault_detected: boolean;
  fault_name: string;
  fault_description: string;
  confidence: number;
  required_parts: string[];
  required_skill: string;
  est_cost_min: number;
  est_cost_max: number;
  urgency: 'low' | 'medium' | 'high';
  pricing_breakdown?: Record<string, unknown>;
  customer_description?: string | null;
  _meta?: { saved_path: string | null; job_id: string | null };
};

// Resize + recompress before sending. Vision models choke on huge base64
// payloads (timeouts, 413s) and resizing to a sane max width gives us
// reliable upload time on flaky mobile networks.
const prepareImageForUpload = async (uri: string): Promise<{ uri: string; mime: string }> => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1280 } }],
      { compress: 0.78, format: ImageManipulator.SaveFormat.JPEG }
    );
    return { uri: result.uri, mime: 'image/jpeg' };
  } catch (err) {
    console.warn('Image compression failed, sending original', err);
    return { uri, mime: 'image/jpeg' };
  }
};

const callDiagnoseEndpoint = async (
  payload: Record<string, unknown>,
  accessToken: string,
  attempt: number
): Promise<DiagnosisResult> => {
  const response = await fetch(`${Config.supabaseUrl}/functions/v1/diagnose`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (response.ok) {
    return data as DiagnosisResult;
  }

  const errorMessage =
    (data && typeof data === 'object' && 'error' in (data as Record<string, unknown>)
      ? String((data as Record<string, unknown>).error)
      : null) ?? `Diagnosis failed with status ${response.status}`;

  // Retry once on transient server errors. Don't retry 4xx — the input is the
  // problem.
  const isTransient = response.status === 429 || response.status >= 500;
  if (isTransient && attempt < 1) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return callDiagnoseEndpoint(payload, accessToken, attempt + 1);
  }

  throw new Error(errorMessage);
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
    const prepared = await prepareImageForUpload(imageUri);
    try {
      base64 = await FileSystem.readAsStringAsync(prepared.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } catch (err) {
      throw new Error(
        'Could not read the selected photo. Please pick another one or take a fresh photo.'
      );
    }
    mimeType = prepared.mime;
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    throw new Error('Not authenticated. Please log in again.');
  }

  return callDiagnoseEndpoint(
    {
      base64,
      mime_type: mimeType,
      job_id: jobId,
      category,
      problem_description: trimmedDescription,
    },
    session.access_token,
    0
  );
};
