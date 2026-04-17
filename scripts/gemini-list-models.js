#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');

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

console.log('Listing available Gemini models...\n');

const options = {
  hostname: 'generativelanguage.googleapis.com',
  port: 443,
  path: `/v1beta/models?key=${apiKey}`,
  method: 'GET'
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (response.models) {
        console.log(`Found ${response.models.length} models:\n`);
        response.models.forEach(model => {
          const name = model.name.replace('models/', '');
          console.log(`✓ ${name}`);
          if (model.supportedGenerationMethods?.includes('generateContent')) {
            console.log(`  → Supports generateContent`);
          }
        });
      } else {
        console.log('Error:', response.error?.message || 'Unknown error');
      }
    } catch (err) {
      console.log('Parse error:', err.message);
      console.log('Raw:', data.substring(0, 500));
    }
  });
});

req.on('error', (err) => console.log('Network error:', err.message));
req.end();
