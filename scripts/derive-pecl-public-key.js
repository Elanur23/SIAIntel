#!/usr/bin/env node
/**
 * PECL Public Key Derivation Script
 * 
 * Derives Ed25519 public key from private key (32-byte seed format)
 * Matches the format expected by lib/neural-assembly/stabilization/crypto-provider.ts
 */

const crypto = require('crypto');

// PECL private key from pecl-secret-patch.json (base64 encoded)
const PRIVATE_KEY_BASE64 = 'Zy9VUlJFaDFXMFN6NkpLdVVEQmc4L3dTVWowcjYzcUczR2g0d3RrZndyaz0=';

function deriveFromRawKey(privateKeyRaw) {
  console.log(`✓ Using 32-byte private key\n`);
  
  // Create PKCS8 DER format for Ed25519 private key
  const pkcs8Der = Buffer.concat([
    Buffer.from([0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20]),
    privateKeyRaw
  ]);
  
  // Import private key
  const privateKey = crypto.createPrivateKey({
    key: pkcs8Der,
    format: 'der',
    type: 'pkcs8',
  });
  
  console.log('✓ Private key imported successfully\n');
  
  // Derive public key
  const publicKey = crypto.createPublicKey(privateKey);
  
  // Export public key in SPKI DER format
  const spkiDer = publicKey.export({ type: 'spki', format: 'der' });
  
  // Extract raw 32-byte public key (last 32 bytes of SPKI DER)
  const publicKeyRaw = spkiDer.slice(-32);
  
  console.log(`✓ Public key derived: ${publicKeyRaw.length} bytes`);
  
  // Encode to base64
  const publicKeyBase64 = publicKeyRaw.toString('base64');
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('RESULTS');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('Public Key (base64):');
  console.log(publicKeyBase64);
  console.log('');
  
  console.log('Public Key Length:', publicKeyRaw.length, 'bytes (expected: 32)');
  console.log('Base64 Length:', publicKeyBase64.length, 'characters (expected: 44)');
  console.log('');
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Test sign and verify
  const testData = 'test-message';
  const signature = crypto.sign(null, Buffer.from(testData, 'utf8'), privateKey);
  
  // Create public key for verification
  const spkiDerForVerify = Buffer.concat([
    Buffer.from([0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00]),
    publicKeyRaw
  ]);
  
  const publicKeyForVerify = crypto.createPublicKey({
    key: spkiDerForVerify,
    format: 'der',
    type: 'spki',
  });
  
  const isValid = crypto.verify(null, Buffer.from(testData, 'utf8'), publicKeyForVerify, signature);
  
  console.log('✓ Sign/Verify Test:', isValid ? 'PASSED ✓' : 'FAILED ✗');
  console.log('');
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('POWERSHELL ASSIGNMENT');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('$pub = "' + publicKeyBase64 + '"');
  console.log('');
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('KUBERNETES SECRET KEY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('Secret Key Name: pecl-public-key-dev-ephemeral');
  console.log('Environment Variable: PECL_PUBLIC_KEY_dev_ephemeral');
  console.log('');
  
  return publicKeyBase64;
}

function derivePublicKey(privateKeyBase64) {
  try {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('PECL PUBLIC KEY DERIVATION');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // Decode base64 private key
    const firstDecode = Buffer.from(privateKeyBase64, 'base64');
    console.log(`✓ First decode: ${firstDecode.length} bytes`);
    console.log(`  Hex: ${firstDecode.toString('hex').substring(0, 64)}...`);
    
    // Check if it's 32 bytes (raw key)
    if (firstDecode.length === 32) {
      console.log('✓ Found 32-byte raw key (single encoding)\n');
      return deriveFromRawKey(firstDecode);
    }
    
    // Check if it's a base64 string (double encoded)
    const asString = firstDecode.toString('utf8');
    console.log(`  As UTF-8: ${asString.substring(0, 50)}...`);
    
    if (/^[A-Za-z0-9+/=]+$/.test(asString)) {
      console.log('⚠ Detected double-encoded base64, attempting second decode...\n');
      const secondDecode = Buffer.from(asString, 'base64');
      console.log(`✓ Second decode: ${secondDecode.length} bytes`);
      console.log(`  Hex: ${secondDecode.toString('hex')}`);
      
      if (secondDecode.length === 32) {
        console.log('✓ Found 32-byte raw key after second decode!\n');
        return deriveFromRawKey(secondDecode);
      } else {
        throw new Error(`Second decode produced ${secondDecode.length} bytes, expected 32`);
      }
    }
    
    throw new Error(`Invalid private key format: ${firstDecode.length} bytes after first decode, not base64 string`);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

// Run derivation
derivePublicKey(PRIVATE_KEY_BASE64);
