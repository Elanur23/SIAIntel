/**
 * SIA GOOGLE CLOUD PROVIDER - V1.0 (UNIFIED AUTHENTICATION)
 * Centralizes Google Service Account management for Indexing, TTS, and Search Console.
 */

import { JWT } from 'google-auth-library';

export interface GoogleAuthConfig {
  clientEmail: string;
  privateKey: string;
  projectId?: string;
}

/**
 * Retrieves Google Cloud configuration from environment variables
 */
export function getGoogleCloudConfig(): GoogleAuthConfig | null {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    return null;
  }

  return {
    clientEmail,
    privateKey,
    projectId: process.env.GOOGLE_PROJECT_ID
  };
}

/**
 * Creates a JWT client for a specific Google API scope
 *
 * @param scopes - Array of Google API scopes (e.g. ['https://www.googleapis.com/auth/indexing'])
 */
export function getGoogleAuthClient(scopes: string[]): JWT {
  const config = getGoogleCloudConfig();

  if (!config) {
    throw new Error('[SIA_GOOGLE] Credentials not found in environment (GOOGLE_SERVICE_ACCOUNT_EMAIL/PRIVATE_KEY)');
  }

  return new JWT({
    email: config.clientEmail,
    key: config.privateKey,
    scopes: scopes
  });
}

/**
 * Validates if the required Google credentials are present
 */
export function isGoogleCloudReady(): boolean {
  return !!(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY);
}

/**
 * Helper to mask sensitive keys in logs
 */
export function maskKey(key: string): string {
  if (!key) return 'N/A';
  return key.length > 10 ? `${key.substring(0, 6)}...${key.substring(key.length - 4)}` : '***';
}
