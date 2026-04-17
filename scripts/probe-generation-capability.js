#!/usr/bin/env node
/**
 * scripts/probe-generation-capability.js
 *
 * LAYER B: REAL GENERATION CAPABILITY PROBE
 * This script executes a minimal raw POST request to the configured
 * production model's generateContent endpoint to verify actual
 * generation capability (quota/billing check).
 *
 * SRE OPERATIONAL DIRECTIVE: PHASE FIX — CANONICAL GEMINI ENV SOURCE ONLY
 */

const fs = require('fs');
const path = require('path');

// 1. INDEPENDENT BOOTSTRAP
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let key = match[1];
        let value = (match[2] || '').trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (e) {
  // Manual bootstrap failure - continue to check process.env
}

// 2. STRICT ENV EXTRACTION & TRIM
const rawGeminiKey = (process.env.GEMINI_API_KEY || '').trim();
const rawGa4Key = (process.env.GA4_GEMINI_API_KEY || '').trim();

let GEMINI_API_KEY = null;
let MODEL_NAME = (process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash').trim();

// Telemetry state (STABLE DIAGNOSTICS CONTRACT)
const stats = {
  gemini_key_present: false,
  gemini_key_source: 'NONE',
  raw_http_status: 'N/A',
  normalized_error_code: 'NONE',
  final_verdict: 'PENDING'
};

async function runProbe() {
  // 3. EXPLICIT MISCONFIGURATION DETECTION (STRICT LOGIC)
  if (rawGeminiKey !== '') {
    // Proceed to generation ping
    GEMINI_API_KEY = rawGeminiKey;
    stats.gemini_key_present = true;
    stats.gemini_key_source = 'GEMINI_API_KEY';
  } else if (rawGa4Key !== '') {
    // HALT: GA4 key present but GEMINI key missing
    stats.gemini_key_present = false;
    stats.gemini_key_source = 'NONE';
    stats.normalized_error_code = 'GEMINI_ENV_MISCONFIGURED';
    stats.final_verdict = 'GENERATION_PREFLIGHT_FAIL';
    return exitProbe();
  } else {
    // HALT: Both missing
    stats.gemini_key_present = false;
    stats.gemini_key_source = 'NONE';
    stats.normalized_error_code = 'GEMINI_API_KEY_MISSING';
    stats.final_verdict = 'GENERATION_PREFLIGHT_FAIL';
    return exitProbe();
  }

  // 4. MINIMAL VIABLE GENERATION REQUEST (LAYER B)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;
  const payload = {
    contents: [{ parts: [{ text: "ping" }] }],
    generationConfig: { maxOutputTokens: 1 }
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    clearTimeout(timeoutId);
    stats.raw_http_status = response.status;

    if (response.status === 200) {
      stats.normalized_error_code = 'NONE';
      stats.final_verdict = 'GENERATION_PREFLIGHT_PASS: GOOGLE_GEMINI_GENERATION_READY';
    } else {
      stats.final_verdict = 'GENERATION_PREFLIGHT_FAIL';
      // EXACT NORMALIZED ERROR MAPPING
      switch (response.status) {
        case 429:
          stats.normalized_error_code = 'GEMINI_QUOTA_EXCEEDED';
          break;
        case 401:
        case 403:
          stats.normalized_error_code = 'GEMINI_API_KEY_INVALID';
          break;
        case 404:
          stats.normalized_error_code = 'GEMINI_MODEL_UNSUPPORTED';
          break;
        default:
          stats.normalized_error_code = 'GEMINI_PROVIDER_UNKNOWN';
      }
    }
  } catch (error) {
    stats.final_verdict = 'GENERATION_PREFLIGHT_FAIL';
    if (error.name === 'AbortError') {
      stats.normalized_error_code = 'GEMINI_PROVIDER_TIMEOUT';
    } else {
      stats.normalized_error_code = 'GEMINI_PROVIDER_UNKNOWN';
    }
  }

  return exitProbe();
}

function exitProbe() {
  // STABLE DIAGNOSTICS CONTRACT (Stdout)
  console.log(`gemini_key_present=${stats.gemini_key_present}`);
  console.log(`gemini_key_source=${stats.gemini_key_source}`);
  console.log(`raw_http_status=${stats.raw_http_status}`);
  console.log(`normalized_error_code=${stats.normalized_error_code}`);
  console.log(`final_verdict=${stats.final_verdict}`);

  // POSIX Exit Discipline
  if (stats.final_verdict.startsWith('GENERATION_PREFLIGHT_PASS')) {
    return 0;
  } else {
    return 1;
  }
}

runProbe().then(code => {
  setTimeout(() => process.exit(code), 100);
});
