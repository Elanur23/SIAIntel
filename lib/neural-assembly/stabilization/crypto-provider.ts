/**
 * CRYPTO_PROVIDER.TS
 * Secure Key Management & Asymmetric Cryptography Provider
 * 
 * Provides Ed25519 signing and verification with secure key handling.
 * Designed for clean upgrade path to KMS/JWKS-backed key retrieval.
 * 
 * SECURITY RULES:
 * - No hardcoded private keys in source
 * - Public keys resolved from secure configuration
 * - Private keys never logged
 * - Fail-closed on missing/invalid keys
 */

import crypto from 'crypto';
import { PECL_DEPLOYMENT_MODE } from './config';
import { logOperation } from '../observability';

export interface Ed25519KeyPair {
  publicKey: Buffer;
  privateKey: Buffer;
}

export interface PublicKeyMetadata {
  keyId: string;
  algorithm: 'Ed25519';
  publicKey: string; // base64
  createdAt: string;
  expiresAt?: string;
}

/**
 * Normalizes key identifiers across operator input, token claims, and env suffixes.
 * Example: "PROD-2026-04" and "prod_2026_04" both normalize to "prod_2026_04".
 */
export function normalizePECLKeyId(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
}

/**
 * Secure Key Provider Interface
 * 
 * Production implementations should:
 * - Fetch public keys from KMS/JWKS endpoint
 * - Cache keys with TTL
 * - Rotate keys automatically
 * - Never expose private keys
 */
export interface KeyProvider {
  getPublicKey(keyId: string): Promise<PublicKeyMetadata | null>;
  listPublicKeys(): Promise<PublicKeyMetadata[]>;
}

/**
 * Environment-Backed Key Provider
 * 
 * Reads public keys from environment variables.
 * Upgrade path: Replace with KMS/JWKS provider.
 */
export class EnvironmentKeyProvider implements KeyProvider {
  private keyCache: Map<string, PublicKeyMetadata> = new Map();

  constructor() {
    this.loadKeysFromEnvironment();
  }

  private loadKeysFromEnvironment(): void {
    this.keyCache.clear();

    // Load public keys from environment
    // Format: PECL_PUBLIC_KEY_<keyId>=<base64-encoded-public-key>
    // Example: PECL_PUBLIC_KEY_prod_2024_01=base64string
    
    const envKeys = Object.keys(process.env).filter(k => k.startsWith('PECL_PUBLIC_KEY_'));
    
    for (const envKey of envKeys) {
      const envSuffix = envKey.replace('PECL_PUBLIC_KEY_', '');
      const keyId = normalizePECLKeyId(envSuffix);
      const publicKeyBase64 = (process.env[envKey] || '').trim();
      
      if (!publicKeyBase64) continue;
      
      try {
        // Validate base64 and key length
        const publicKeyBuffer = Buffer.from(publicKeyBase64, 'base64');
        if (publicKeyBuffer.length !== 32) {
          console.error(`[CRYPTO_PROVIDER] Invalid Ed25519 public key length for ${keyId}: ${publicKeyBuffer.length} bytes (expected 32)`);
          continue;
        }
        
        this.keyCache.set(keyId, {
          keyId,
          algorithm: 'Ed25519',
          publicKey: publicKeyBase64,
          createdAt: new Date().toISOString(),
        });

        console.log(`[CRYPTO_PROVIDER] Loaded public key: ${keyId}`);
      } catch (error) {
        console.error(`[CRYPTO_PROVIDER] Failed to load public key ${keyId}:`, error);
      }
    }

    logOperation('CRYPTO_PROVIDER', 'key_loading.source', 'INFO', 'Loaded public key material from environment', {
      metadata: {
        pecl_mode: PECL_DEPLOYMENT_MODE,
        env_key_count: envKeys.length,
        loaded_key_count: this.keyCache.size,
        loaded_key_ids: Array.from(this.keyCache.keys())
      }
    });

    logOperation('CRYPTO_PROVIDER', 'key_loading.loaded_key_ids', this.keyCache.size > 0 ? 'INFO' : 'WARN', 'PECL public key ids currently loaded in runtime', {
      metadata: {
        loaded_key_count: this.keyCache.size,
        loaded_key_ids: Array.from(this.keyCache.keys())
      }
    });

    const allowDevEphemeral = process.env.PECL_ALLOW_DEV_EPHEMERAL === 'true' || process.env.NODE_ENV === 'test';
    const fallbackAllowed = this.keyCache.size === 0 && process.env.NODE_ENV !== 'production' && allowDevEphemeral;

    // If no keys loaded, create a development key ONLY when explicitly allowed.
    if (fallbackAllowed) {
      console.warn('[CRYPTO_PROVIDER] No public keys found in environment. Generating development key pair.');
      console.warn('[CRYPTO_PROVIDER] DO NOT USE IN PRODUCTION. Set PECL_PUBLIC_KEY_* environment variables.');
      
      const devKeyPair = this.generateKeyPair();
      const devKeyId = 'dev_ephemeral';
      
      this.keyCache.set(devKeyId, {
        keyId: devKeyId,
        algorithm: 'Ed25519',
        publicKey: devKeyPair.publicKey.toString('base64'),
        createdAt: new Date().toISOString(),
      });
      
      // Store private key in memory for development signing
      // NEVER do this in production
      (global as any).__DEV_PRIVATE_KEY__ = devKeyPair.privateKey.toString('base64');
      logOperation('CRYPTO_PROVIDER', 'key_loading.fallback_blocked_or_allowed', 'WARN', 'Development ephemeral fallback allowed', {
        metadata: {
          pecl_mode: PECL_DEPLOYMENT_MODE,
          selected_key_id: devKeyId,
          allow_dev_ephemeral: allowDevEphemeral,
          node_env: process.env.NODE_ENV || null
        }
      });

      console.warn(`[CRYPTO_PROVIDER] Development key pair generated. KeyId: ${devKeyId}`);
    } else if (this.keyCache.size === 0) {
      delete (global as any).__DEV_PRIVATE_KEY__;
      logOperation('CRYPTO_PROVIDER', 'key_loading.fallback_blocked_or_allowed', 'ERROR', 'Development ephemeral fallback blocked: explicit key material required', {
        metadata: {
          pecl_mode: PECL_DEPLOYMENT_MODE,
          allow_dev_ephemeral: allowDevEphemeral,
          node_env: process.env.NODE_ENV || null,
          loaded_key_count: this.keyCache.size
        }
      });
    }
  }

  async getPublicKey(keyId: string): Promise<PublicKeyMetadata | null> {
    const normalizedKeyId = normalizePECLKeyId(keyId)

    let key = this.keyCache.get(normalizedKeyId) || this.keyCache.get(keyId.toLowerCase()) || null;

    // If env keys exist but cache misses, reload once to handle late env injection.
    if (!key) {
      const hasEnvKeyMaterial = Object.keys(process.env).some((envKey) => envKey.startsWith('PECL_PUBLIC_KEY_'))
      if (hasEnvKeyMaterial) {
        this.loadKeysFromEnvironment()
        key = this.keyCache.get(normalizedKeyId) || this.keyCache.get(keyId.toLowerCase()) || null;
      }
    }

    return key;
  }

  async listPublicKeys(): Promise<PublicKeyMetadata[]> {
    if (this.keyCache.size === 0) {
      const hasEnvKeyMaterial = Object.keys(process.env).some((envKey) => envKey.startsWith('PECL_PUBLIC_KEY_'))
      if (hasEnvKeyMaterial) {
        this.loadKeysFromEnvironment()
      }
    }

    return Array.from(this.keyCache.values());
  }

  /**
   * Generate Ed25519 key pair (for development/testing only)
   */
  generateKeyPair(): Ed25519KeyPair {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
    
    return {
      publicKey: publicKey.export({ type: 'spki', format: 'der' }).slice(-32),
      privateKey: privateKey.export({ type: 'pkcs8', format: 'der' }).slice(-32),
    };
  }
}

/**
 * Deterministic JSON Canonicalization
 * 
 * Implements stable key ordering for consistent signing.
 * Based on RFC 8785 principles (JSON Canonicalization Scheme).
 * 
 * Guarantees:
 * - Deterministic key ordering (alphabetical)
 * - No whitespace
 * - Consistent output for same input
 * 
 * Limitations:
 * - Does not handle all RFC 8785 edge cases (Unicode normalization, number formatting)
 * - Sufficient for PECL authorization envelopes with controlled input
 */
export function canonicalizeJSON(obj: any): string {
  if (obj === null) return 'null';
  if (obj === undefined) return 'null';
  if (typeof obj === 'boolean') return obj ? 'true' : 'false';
  if (typeof obj === 'number') return JSON.stringify(obj);

  // Apply Unicode NFC normalization to strings for deterministic hashing
  if (typeof obj === 'string') return JSON.stringify(obj.normalize('NFC'));
  
  if (Array.isArray(obj)) {
    const items = obj.map(item => canonicalizeJSON(item));
    return `[${items.join(',')}]`;
  }
  
  if (typeof obj === 'object') {
    const keys = Object.keys(obj).sort();
    const pairs = keys.map(key => {
      const value = canonicalizeJSON(obj[key]);
      return `${JSON.stringify(key)}:${value}`;
    });
    return `{${pairs.join(',')}}`;
  }
  
  return 'null';
}

/**
 * Ed25519 Signature Provider
 * 
 * Provides signing and verification using Ed25519.
 */
export class Ed25519Provider {
  private keyProvider: KeyProvider;

  constructor(keyProvider: KeyProvider) {
    this.keyProvider = keyProvider;
  }

  /**
   * Sign data with Ed25519 private key
   * 
   * @param data - Data to sign (will be canonicalized if object)
   * @param privateKeyBase64 - Base64-encoded private key
   * @returns Base64-encoded signature
   */
  sign(data: any, privateKeyBase64: string): string {
    try {
      // FORENSIC TELEMETRY: Log safe input diagnostics without disclosing key material
      console.log(`[FORENSIC:CRYPTO_PROVIDER:sign:ENTRY] privateKeyBase64.length=${privateKeyBase64.length}`);
      
      const canonical = typeof data === 'string' ? data : canonicalizeJSON(data);
      
      // SURGICAL FIX: Trim whitespace from base64 string (environment variables may have trailing newlines)
      const trimmedPrivateKeyBase64 = privateKeyBase64.trim();
      
      // FORENSIC TELEMETRY: Log after trim
      console.log(`[FORENSIC:CRYPTO_PROVIDER:sign:AFTER_TRIM] trimmedLength=${trimmedPrivateKeyBase64.length}`);
      
      const privateKeyBuffer = Buffer.from(trimmedPrivateKeyBase64, 'base64');
      
      // FORENSIC TELEMETRY: Log decoded buffer length
      console.log(`[FORENSIC:CRYPTO_PROVIDER:sign:DECODED] privateKeyBuffer.length=${privateKeyBuffer.length}`);
      
      if (privateKeyBuffer.length !== 32) {
        throw new Error(`Invalid Ed25519 private key length: ${privateKeyBuffer.length} bytes (expected 32)`);
      }
      
      const privateKey = crypto.createPrivateKey({
        key: Buffer.concat([
          Buffer.from([0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20]),
          privateKeyBuffer
        ]),
        format: 'der',
        type: 'pkcs8',
      });
      
      const signature = crypto.sign(null, Buffer.from(canonical, 'utf8'), privateKey);
      
      // FORENSIC TELEMETRY: Log success
      console.log(`[FORENSIC:CRYPTO_PROVIDER:sign:SUCCESS] signature.length=${signature.length}`);
      
      return signature.toString('base64');
    } catch (error) {
      console.error('[CRYPTO_PROVIDER] Signing failed:', error);
      throw new Error('Signing failed');
    }
  }

  /**
   * Verify Ed25519 signature
   * 
   * @param data - Data that was signed (will be canonicalized if object)
   * @param signatureBase64 - Base64-encoded signature
   * @param keyId - Key ID to use for verification
   * @returns true if signature is valid, false otherwise
   */
  async verify(data: any, signatureBase64: string, keyId: string): Promise<boolean> {
    try {
      const keyMetadata = await this.keyProvider.getPublicKey(keyId);
      if (!keyMetadata) {
        console.error(`[CRYPTO_PROVIDER] Public key not found: ${keyId}`);
        return false;
      }
      
      const canonical = typeof data === 'string' ? data : canonicalizeJSON(data);
      const signatureBuffer = Buffer.from(signatureBase64, 'base64');
      const publicKeyBuffer = Buffer.from(keyMetadata.publicKey, 'base64');
      
      if (publicKeyBuffer.length !== 32) {
        console.error(`[CRYPTO_PROVIDER] Invalid Ed25519 public key length: ${publicKeyBuffer.length} bytes (expected 32)`);
        return false;
      }
      
      const publicKey = crypto.createPublicKey({
        key: Buffer.concat([
          Buffer.from([0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00]),
          publicKeyBuffer
        ]),
        format: 'der',
        type: 'spki',
      });
      
      return crypto.verify(null, Buffer.from(canonical, 'utf8'), publicKey, signatureBuffer);
    } catch (error) {
      console.error('[CRYPTO_PROVIDER] Verification failed:', error);
      return false;
    }
  }
}

// Singleton instances
let globalKeyProvider: KeyProvider | null = null;
let globalCryptoProvider: Ed25519Provider | null = null;

export function getGlobalKeyProvider(): KeyProvider {
  if (!globalKeyProvider) {
    globalKeyProvider = new EnvironmentKeyProvider();
  }
  return globalKeyProvider;
}

export function getGlobalCryptoProvider(): Ed25519Provider {
  if (!globalCryptoProvider) {
    globalCryptoProvider = new Ed25519Provider(getGlobalKeyProvider());
  }
  return globalCryptoProvider;
}

export function resetGlobalCryptoProvider(): void {
  globalKeyProvider = null;
  globalCryptoProvider = null;
}
