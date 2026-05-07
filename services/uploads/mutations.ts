import * as ImageManipulator from 'expo-image-manipulator';

import { supabase } from '@/lib/supabase';

const compressImage = async (uri: string) => {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1600 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
};

const uploadBlob = async (bucket: string, path: string, uri: string, contentType: string) => {
  const response = await fetch(uri);
  const blob = await response.blob();

  const { data, error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType,
    upsert: true
  });

  if (error) {
    throw error;
  }

  return data.path;
};

const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

export const uploadJobMedia = async (jobId: string, uri: string, fileName: string) => {
  const optimizedUri = await compressImage(uri);
  const path = `jobs/${jobId}/${fileName}`;
  const storedPath = await uploadBlob('job-media', path, optimizedUri, 'image/jpeg');
  return getPublicUrl('job-media', storedPath);
};

export const uploadKycDocument = async (proId: string, uri: string, fileName: string) => {
  const optimizedUri = await compressImage(uri);
  const path = `${proId}/${fileName}`;
  return uploadBlob('kyc-docs', path, optimizedUri, 'image/jpeg');
};

export const uploadAvatar = async (userId: string, uri: string) => {
  const optimizedUri = await compressImage(uri);
  const path = `${userId}/avatar.jpg`;
  const storedPath = await uploadBlob('avatars', path, optimizedUri, 'image/jpeg');
  return getPublicUrl('avatars', storedPath);
};
