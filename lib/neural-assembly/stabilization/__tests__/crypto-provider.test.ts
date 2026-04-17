/**
 * CRYPTO_PROVIDER.TEST.TS
 * Tests for Ed25519 signing, verification, and canonicalization
 * 
 * Proves L6-BLK-001 remediation with tamper detection tests.
 */

import {
  Ed25519Provider,
  EnvironmentKeyProvider,
  canonicalizeJSON,
  getGlobalCryptoProvider,
  resetGlobalCryptoProvider
} from '../crypto-provider';

describe('canonicalizeJSON', () => {
  it('should produce deterministic output for same object', () => {
    const obj1 = { b: 2, a: 1, c: 3 };
    const obj2 = { a: 1, c: 3, b: 2 };
    
    expect(canonicalizeJSON(obj1)).toBe(canonicalizeJSON(obj2));
  });

  it('should sort keys alphabetically', () => {
    const obj = { z: 1, a: 2, m: 3 };
    const canonical = canonicalizeJSON(obj);
    
    expect(canonical).toBe('{"a":2,"m":3,"z":1}');
  });

  it('should handle nested objects', () => {
    const obj = {
      outer: {
        b: 2,
        a: 1
      },
      inner: {
        y: 9,
        x: 8
      }
    };
    
    const canonical = canonicalizeJSON(obj);
    expect(canonical).toBe('{"inner":{"x":8,"y":9},"outer":{"a":1,"b":2}}');
  });

  it('should handle arrays', () => {
    const obj = { arr: [3, 1, 2], key: 'value' };
    const canonical = canonicalizeJSON(obj);
    
    expect(canonical).toBe('{"arr":[3,1,2],"key":"value"}');
  });

  it('should handle primitives', () => {
    expect(canonicalizeJSON(null)).toBe('null');
    expect(canonicalizeJSON(true)).toBe('true');
    expect(canonicalizeJSON(false)).toBe('false');
    expect(canonicalizeJSON(42)).toBe('42');
    expect(canonicalizeJSON('test')).toBe('"test"');
  });
});

describe('Ed25519Provider', () => {
  let provider: Ed25519Provider;
  let keyProvider: EnvironmentKeyProvider;
  let testPrivateKey: string;
  let testPublicKey: string;
  let testKeyId: string;

  beforeEach(() => {
    // Generate test key pair
    keyProvider = new EnvironmentKeyProvider();
    const keyPair = keyProvider.generateKeyPair();
    
    testPrivateKey = keyPair.privateKey.toString('base64');
    testPublicKey = keyPair.publicKey.toString('base64');
    testKeyId = 'test_key_001';
    
    // Mock key provider
    keyProvider.getPublicKey = jest.fn().mockResolvedValue({
      keyId: testKeyId,
      algorithm: 'Ed25519',
      publicKey: testPublicKey,
      createdAt: new Date().toISOString()
    });
    
    provider = new Ed25519Provider(keyProvider);
  });

  describe('sign and verify', () => {
    it('should sign and verify valid data', async () => {
      const data = { message: 'test', timestamp: 123456 };
      
      const signature = provider.sign(data, testPrivateKey);
      expect(signature).toBeTruthy();
      expect(typeof signature).toBe('string');
      
      const valid = await provider.verify(data, signature, testKeyId);
      expect(valid).toBe(true);
    });

    it('should fail verification with tampered data', async () => {
      const data = { message: 'test', timestamp: 123456 };
      const signature = provider.sign(data, testPrivateKey);
      
      const tamperedData = { message: 'test', timestamp: 999999 };
      const valid = await provider.verify(tamperedData, signature, testKeyId);
      
      expect(valid).toBe(false);
    });

    it('should fail verification with invalid signature', async () => {
      const data = { message: 'test', timestamp: 123456 };
      const invalidSignature = 'aW52YWxpZHNpZ25hdHVyZQ==';
      
      const valid = await provider.verify(data, invalidSignature, testKeyId);
      expect(valid).toBe(false);
    });

    it('should fail verification with unknown key id', async () => {
      const data = { message: 'test', timestamp: 123456 };
      const signature = provider.sign(data, testPrivateKey);
      
      keyProvider.getPublicKey = jest.fn().mockResolvedValue(null);
      
      const valid = await provider.verify(data, signature, 'unknown_key');
      expect(valid).toBe(false);
    });

    it('should produce same signature for canonically equivalent objects', () => {
      const data1 = { b: 2, a: 1 };
      const data2 = { a: 1, b: 2 };
      
      const sig1 = provider.sign(data1, testPrivateKey);
      const sig2 = provider.sign(data2, testPrivateKey);
      
      expect(sig1).toBe(sig2);
    });
  });

  describe('tamper detection', () => {
    it('should detect payload tampering', async () => {
      const signedClaims = {
        payload_id: 'batch-123',
        manifest_hash: 'hash-abc',
        authorized_languages: ['en', 'tr'],
        keyId: testKeyId,
        algorithm: 'Ed25519' as const,
        issuedAt: 1000000,
        expiresAt: 2000000
      };
      
      const signature = provider.sign(signedClaims, testPrivateKey);
      
      // Tamper with payload_id
      const tamperedClaims = { ...signedClaims, payload_id: 'batch-999' };
      const valid = await provider.verify(tamperedClaims, signature, testKeyId);
      
      expect(valid).toBe(false);
    });

    it('should detect issuedAt tampering', async () => {
      const signedClaims = {
        payload_id: 'batch-123',
        manifest_hash: 'hash-abc',
        authorized_languages: ['en', 'tr'],
        keyId: testKeyId,
        algorithm: 'Ed25519' as const,
        issuedAt: 1000000,
        expiresAt: 2000000
      };
      
      const signature = provider.sign(signedClaims, testPrivateKey);
      
      // Tamper with issuedAt
      const tamperedClaims = { ...signedClaims, issuedAt: 999999 };
      const valid = await provider.verify(tamperedClaims, signature, testKeyId);
      
      expect(valid).toBe(false);
    });

    it('should detect expiresAt tampering', async () => {
      const signedClaims = {
        payload_id: 'batch-123',
        manifest_hash: 'hash-abc',
        authorized_languages: ['en', 'tr'],
        keyId: testKeyId,
        algorithm: 'Ed25519' as const,
        issuedAt: 1000000,
        expiresAt: 2000000
      };
      
      const signature = provider.sign(signedClaims, testPrivateKey);
      
      // Tamper with expiresAt (extend expiry)
      const tamperedClaims = { ...signedClaims, expiresAt: 9999999 };
      const valid = await provider.verify(tamperedClaims, signature, testKeyId);
      
      expect(valid).toBe(false);
    });

    it('should detect keyId tampering', async () => {
      const signedClaims = {
        payload_id: 'batch-123',
        manifest_hash: 'hash-abc',
        authorized_languages: ['en', 'tr'],
        keyId: testKeyId,
        algorithm: 'Ed25519' as const,
        issuedAt: 1000000,
        expiresAt: 2000000
      };
      
      const signature = provider.sign(signedClaims, testPrivateKey);
      
      // Tamper with keyId
      const tamperedClaims = { ...signedClaims, keyId: 'different_key' };
      const valid = await provider.verify(tamperedClaims, signature, testKeyId);
      
      expect(valid).toBe(false);
    });

    it('should detect algorithm tampering', async () => {
      const signedClaims = {
        payload_id: 'batch-123',
        manifest_hash: 'hash-abc',
        authorized_languages: ['en', 'tr'],
        keyId: testKeyId,
        algorithm: 'Ed25519' as const,
        issuedAt: 1000000,
        expiresAt: 2000000
      };
      
      const signature = provider.sign(signedClaims, testPrivateKey);
      
      // Tamper with algorithm
      const tamperedClaims = { ...signedClaims, algorithm: 'HS256' as any };
      const valid = await provider.verify(tamperedClaims, signature, testKeyId);
      
      expect(valid).toBe(false);
    });

    it('should detect manifest_hash tampering', async () => {
      const signedClaims = {
        payload_id: 'batch-123',
        manifest_hash: 'hash-abc',
        authorized_languages: ['en', 'tr'],
        keyId: testKeyId,
        algorithm: 'Ed25519' as const,
        issuedAt: 1000000,
        expiresAt: 2000000
      };
      
      const signature = provider.sign(signedClaims, testPrivateKey);
      
      // Tamper with manifest_hash
      const tamperedClaims = { ...signedClaims, manifest_hash: 'hash-xyz' };
      const valid = await provider.verify(tamperedClaims, signature, testKeyId);
      
      expect(valid).toBe(false);
    });

    it('should detect authorized_languages tampering', async () => {
      const signedClaims = {
        payload_id: 'batch-123',
        manifest_hash: 'hash-abc',
        authorized_languages: ['en', 'tr'],
        keyId: testKeyId,
        algorithm: 'Ed25519' as const,
        issuedAt: 1000000,
        expiresAt: 2000000
      };
      
      const signature = provider.sign(signedClaims, testPrivateKey);
      
      // Tamper with authorized_languages (add language)
      const tamperedClaims = { ...signedClaims, authorized_languages: ['en', 'tr', 'de'] };
      const valid = await provider.verify(tamperedClaims, signature, testKeyId);
      
      expect(valid).toBe(false);
    });
  });
});

describe('Global Crypto Provider', () => {
  afterEach(() => {
    resetGlobalCryptoProvider();
  });

  it('should return singleton instance', () => {
    const provider1 = getGlobalCryptoProvider();
    const provider2 = getGlobalCryptoProvider();
    
    expect(provider1).toBe(provider2);
  });

  it('should reset singleton', () => {
    const provider1 = getGlobalCryptoProvider();
    resetGlobalCryptoProvider();
    const provider2 = getGlobalCryptoProvider();
    
    expect(provider1).not.toBe(provider2);
  });
});
