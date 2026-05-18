import * as FileSystem from 'expo-file-system';

import { Config } from '@/constants/config';
import { supabase } from '@/lib/supabase';

export const transcribeAudio = async (audioUri: string): Promise<string> => {
  const base64 = await FileSystem.readAsStringAsync(audioUri, {
    encoding: FileSystem.EncodingType.Base64
  });

  const ext = audioUri.split('.').pop()?.toLowerCase() ?? 'm4a';
  const mimeMap: Record<string, string> = {
    m4a: 'audio/mp4',
    mp4: 'audio/mp4',
    aac: 'audio/aac',
    wav: 'audio/wav',
    webm: 'audio/webm',
    caf: 'audio/x-caf'
  };
  const mimeType = mimeMap[ext] ?? 'audio/mp4';

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    throw new Error('Not authenticated. Please log in again.');
  }

  const response = await fetch(`${Config.supabaseUrl}/functions/v1/transcribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      base64,
      mime_type: mimeType
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error ?? `Transcription failed with status ${response.status}`);
  }

  return String(data?.text ?? '').trim();
};
