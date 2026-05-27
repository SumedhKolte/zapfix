import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

import { supabase } from '@/lib/supabase';

const base64ToArrayBuffer = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

const compressImage = async (uri: string) => {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1600 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
};

const uploadBlob = async (bucket: string, path: string, uri: string, contentType: string) => {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64
  });
  const fileData = base64ToArrayBuffer(base64);

  const { data, error } = await supabase.storage.from(bucket).upload(path, fileData, {
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

export const getSignedUrl = async (bucket: string, path: string, expiresInSeconds = 600) => {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error) {
    throw error;
  }
  return data.signedUrl;
};

const deleteStoredFiles = async (bucket: string, paths: Array<string | null | undefined>) => {
  const cleanedPaths = paths.filter((path): path is string => Boolean(path));

  if (cleanedPaths.length === 0) {
    return;
  }

  const { error } = await supabase.storage.from(bucket).remove(cleanedPaths);
  if (error) {
    throw error;
  }
};

export const uploadJobMedia = async (jobId: string, uri: string, fileName: string) => {
  const optimizedUri = await compressImage(uri);
  const path = `jobs/${jobId}/${fileName}`;
  const storedPath = await uploadBlob('job-media', path, optimizedUri, 'image/jpeg');
  const storageUrl = `job-media/${storedPath}`;

  await supabase.from('media_assets').insert({
    entity_id: jobId,
    entity_type: 'job_before',
    storage_url: storageUrl,
  });

  return storageUrl;
};

export const uploadKycDocument = async (proId: string, uri: string, fileName: string) => {
  const optimizedUri = await compressImage(uri);
  const path = `${proId}/${fileName}`;
  const storedPath = await uploadBlob('kyc-docs', path, optimizedUri, 'image/jpeg');
  const storageUrl = `kyc-docs/${storedPath}`;
  const entityType = kycFileToEntityType(fileName);

  // Remove stale record for this doc type before inserting fresh one
  await supabase
    .from('media_assets')
    .delete()
    .eq('entity_id', proId)
    .eq('entity_type', entityType);

  const { error } = await supabase.from('media_assets').insert({
    entity_id: proId,
    entity_type: entityType,
    storage_url: storageUrl,
  });

  if (error) {
    console.error('KYC upload failed', error);
    throw error;
  }

  return storageUrl;
};

export const uploadAvatar = async (userId: string, uri: string) => {
  const optimizedUri = await compressImage(uri);
  const path = `${userId}/avatar.jpg`;
  const storedPath = await uploadBlob('avatars', path, optimizedUri, 'image/jpeg');
  return getPublicUrl('avatars', storedPath);
};

export const deleteKycDocuments = async (paths: Array<string | null | undefined>) => {
  return deleteStoredFiles('kyc-docs', paths);
};
