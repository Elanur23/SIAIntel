#!/usr/bin/env node
/**
 * GEMINI DIRECT PROVIDER PROBE
 * STEP 2: Minimal direct API test without gcloud dependency
 * 
 * Tests ONLY:
 * - API key validity
 * - Direct Gemini API connectivity
 * - Basic generation capability
 * 
 * Does NOT touch:
 * - Production orchestration
 * - Groq routing
 * - Fallback logic
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        process.env[match[1].trim()] = match[2].trim();
      }
    });
  }
}

loadEnv();

const apiKey = process.env.GEMINI_API_KEY || process.env.GA4_GEMINI_API_KEY;

console.log('━'.repeat(80));
console.log('  GEMINI DIRECT PROVIDER PROBE - STEP 2');
console.log('━'.repeat(80));
console.log('\n📋 CONFIGURATION CHECK');
console.log('─'.repeat(80));
console.log(`API Key Present: ${apiKey ? 'YES' : 'NO'}`);
console.log(`API Key Value: ${apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING'}`);
console.log(`API Key Length: ${apiKey ? apiKey.length : 0} characters`);

if (!apiKey) {
  console.log('\n❌ BLOCKED: No API key found');
  console.log('ℹ️  Set GEMINI_API_KEY in .env.local');
  process.exit(2);
}

console.log('\n🧪 DIRECT API TEST');
console.log('─'.repeat(80));
console.log('Testing: gemini-2.5-flash (latest production model)');
console.log('Method: Direct HTTPS POST to generativelanguage.googleapis.com');
console.log('Payload: Minimal test prompt');

const testPayload = JSON.stringify({
  contents: [{
    parts: [{ text: 'Hello, respond with "OK" if you can read this.' }]
  }]
});

const options = {
  hostname: 'generativelanguage.googleapis.com',
  port: 443,
  path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testPayload)
  }
};

const startTime = Date.now();

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    const latency = Date.now() - startTime;
    
    console.log(`\nHTTP Status: ${res.statusCode}`);
    console.log(`Latency: ${latency}ms`);
    
    console.log('\n📊 PROBE RESULT');
    console.log('─'.repeat(80));
    
    if (res.statusCode === 200) {
      try {
        const response = JSON.parse(data);
        const text = response.candidates?.[0]?.content?.parts?.[0]?.text || 'N/A';
        const tokensUsed = response.usageMetadata?.totalTokenCount || 0;
        
        console.log('✅ SUCCESS: Gemini API is accessible');
        console.log(`Response: ${text.substring(0, 100)}`);
        console.log(`Tokens Used: ${tokensUsed}`);
        console.log(`Model: gemini-2.5-flash`);
        
        console.log('\n🎯 DIAGNOSIS');
        console.log('─'.repeat(80));
        console.log('✅ API Key: VALID');
        console.log('✅ API Access: GRANTED');
        console.log('✅ Quota: AVAILABLE');
        console.log('✅ Generation: FUNCTIONAL');
        
        console.log('\n━'.repeat(80));
        console.log('  GEMINI IS API-READY');
        console.log('━'.repeat(80));
        
        process.exit(0);
        
      } catch (err) {
        console.log(`❌ FAILED: Response parsing error`);
        console.log(`Error: ${err.message}`);
        console.log(`Raw response: ${data.substring(0, 200)}`);
        process.exit(2);
      }
    } else if (res.statusCode === 429) {
      try {
        const response = JSON.parse(data);
        console.log('❌ FAILED: HTTP 429 RESOURCE_EXHAUSTED');
        console.log(`Error: ${response.error?.message || 'Quota exceeded'}`);
        console.log(`Status: ${response.error?.status || 'RESOURCE_EXHAUSTED'}`);
        
        console.log('\n🎯 DIAGNOSIS');
        console.log('─'.repeat(80));
        console.log('✅ API Key: VALID');
        console.log('✅ API Access: GRANTED');
        console.log('❌ Quota: EXHAUSTED');
        console.log('❌ Generation: BLOCKED BY QUOTA');
        
        console.log('\n━'.repeat(80));
        console.log('  GEMINI IS NOT API-READY (QUOTA EXCEEDED)');
        console.log('━'.repeat(80));
        
        process.exit(1);
      } catch (err) {
        console.log(`❌ FAILED: HTTP 429 (quota exceeded)`);
        console.log(`Raw response: ${data.substring(0, 200)}`);
        process.exit(1);
      }
    } else if (res.statusCode === 400) {
      try {
        const response = JSON.parse(data);
        console.log('❌ FAILED: HTTP 400 BAD REQUEST');
        console.log(`Error: ${response.error?.message || 'Invalid request'}`);
        
        console.log('\n🎯 DIAGNOSIS');
        console.log('─'.repeat(80));
        console.log('⚠️  API Key: POSSIBLY INVALID');
        console.log('❌ API Access: DENIED');
        console.log('❓ Quota: UNKNOWN');
        console.log('❌ Generation: BLOCKED BY AUTH');
        
        console.log('\n━'.repeat(80));
        console.log('  GEMINI IS NOT API-READY (INVALID KEY OR REQUEST)');
        console.log('━'.repeat(80));
        
        process.exit(2);
      } catch (err) {
        console.log(`❌ FAILED: HTTP 400`);
        console.log(`Raw response: ${data.substring(0, 200)}`);
        process.exit(2);
      }
    } else {
      console.log(`❌ FAILED: HTTP ${res.statusCode}`);
      console.log(`Response: ${data.substring(0, 200)}`);
      
      console.log('\n🎯 DIAGNOSIS');
      console.log('─'.repeat(80));
      console.log('❓ API Key: UNKNOWN');
      console.log('❌ API Access: FAILED');
      console.log('❓ Quota: UNKNOWN');
      console.log('❌ Generation: BLOCKED');
      
      console.log('\n━'.repeat(80));
      console.log('  GEMINI IS NOT API-READY (UNEXPECTED ERROR)');
      console.log('━'.repeat(80));
      
      process.exit(2);
    }
  });
});

req.on('error', (err) => {
  console.log(`\n❌ NETWORK ERROR: ${err.message}`);
  
  console.log('\n🎯 DIAGNOSIS');
  console.log('─'.repeat(80));
  console.log('❓ API Key: UNKNOWN');
  console.log('❌ API Access: NETWORK FAILURE');
  console.log('❓ Quota: UNKNOWN');
  console.log('❌ Generation: BLOCKED BY NETWORK');
  
  console.log('\n━'.repeat(80));
  console.log('  GEMINI IS NOT API-READY (NETWORK ERROR)');
  console.log('━'.repeat(80));
  
  process.exit(3);
});

req.write(testPayload);
req.end();
