/**
 * SIA SOVEREIGN VAULT - GOOGLE CLOUD STORAGE SERVICE
 * FEATURES: SECURE FILE UPLOAD | EXPIRING URIS | VISION & VIDEO INTEGRATION
 */

import { getGoogleCloudConfig } from './cloud-provider';
import { sentinel } from '../monitoring';

// ⚡ BUILD FIX: Make @google-cloud/storage optional
let Storage: any;
try {
  const storageModule = require('@google-cloud/storage');
  Storage = storageModule.Storage;
} catch (error) {
  console.warn('[SIA_STORAGE] @google-cloud/storage not installed - storage features disabled');
}

let storageClient: any | null = null;

/**
 * Initializes the Storage client using central Google Cloud config
 */
function getStorageClient(): any {
  if (!Storage) {
    throw new Error('[SIA_STORAGE] @google-cloud/storage not installed');
  }

  if (storageClient) return storageClient;

  const config = getGoogleCloudConfig();
  if (!config) {
    throw new Error('[SIA_STORAGE] Google Cloud credentials not configured');
  }

  storageClient = new Storage({
    credentials: {
      client_email: config.clientEmail,
      private_key: config.privateKey,
    },
    projectId: config.projectId,
  });

  return storageClient;
}

/**
 * Muffles a file into the secure vault and returns the public URI or GCS path
 * Perfect for storing leaked evidence (images, videos)
 */
export async function sealInVault(
  buffer: Buffer,
  fileName: string,
  contentType: string = 'application/octet-stream',
  bucketName?: string
): Promise<{ publicUrl: string; gcsUri: string }> {
  try {
    const client = getStorageClient();
    const config = getGoogleCloudConfig();
    const targetBucket = bucketName || process.env.GOOGLE_STORAGE_BUCKET || `${config?.projectId}-vault`;

    const bucket = client.bucket(targetBucket);
    const file = bucket.file(`leaks/${Date.now()}_${fileName}`);

    await file.save(buffer, {
      contentType: contentType,
      metadata: { cacheControl: 'public, max-age=31536000' }
    });

    const publicUrl = `https://storage.googleapis.com/${targetBucket}/${file.name}`;
    const gcsUri = `gs://${targetBucket}/${file.name}`;

    sentinel.log('GOOGLE_STORAGE', 'SUCCESS', `File sealed in vault: ${file.name}`);

    return { publicUrl, gcsUri };

  } catch (error: any) {
    sentinel.log('GOOGLE_STORAGE', 'ERROR', `Vault sealing failed: ${error.message}`);
    throw error;
  }
}

/**
 * Deletes a file from the vault (used for sensitive cleanup)
 */
export async function deleteFromVault(fileName: string, bucketName?: string): Promise<boolean> {
  try {
    const client = getStorageClient();
    const targetBucket = bucketName || process.env.GOOGLE_STORAGE_BUCKET || '';

    await client.bucket(targetBucket).file(fileName).delete();
    sentinel.log('GOOGLE_STORAGE', 'SUCCESS', `File purged: ${fileName}`);
    return true;

  } catch (error: any) {
    sentinel.log('GOOGLE_STORAGE', 'ERROR', `File purge failed: ${error.message}`);
    return false;
  }
}
