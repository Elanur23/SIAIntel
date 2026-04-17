#!/usr/bin/env node
/**
 * scripts/probe-gemini-provider.js
 *
 * STANDALONE DIRECT PROVIDER PROBE
 * Decoupled from application orchestrators and SDK abstractions.
 * Used as an OS-level gate for provider readiness.
 */

const fs = require('fs');
const path = require('path');

// 1. INDEPENDENT BOOTSTRAP
let GEMINI_API_KEY = null;
let PROVIDER_LABEL = 'google-gemini';
let MODEL_NAME = 'gemini-2.5-flash';

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

GEMINI_API_KEY = process.env.GA4_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

// Telemetry state
const stats = {
  auth_ok: false,
  provider_label_ok: PROVIDER_LABEL === 'google-gemini',
  model_reachable: false,
  raw_http_status: 'NONE',
  raw_error_body: 'NONE',
  final_verdict: 'PENDING'
};

async function runProbe() {
  // Pre-request config validation
  if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '') {
    stats.final_verdict = 'PROBE_FAIL: GEMINI_API_KEY_MISSING';
    return exitProbe();
  }

  if (stats.provider_label_ok === false) {
    stats.final_verdict = 'PROBE_FAIL: PROVIDER_LABEL_MISMATCH';
    return exitProbe();
  }

  if (!MODEL_NAME) {
    stats.final_verdict = 'PROBE_FAIL: GEMINI_MODEL_MISSING';
    return exitProbe();
  }

  // 2. MINIMAL VIABLE RAW PING
  const url = `https://generativelanguage.googleapis.com/v1/models/${MODEL_NAME}?key=${GEMINI_API_KEY}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' }
    });

    clearTimeout(timeoutId);
    stats.raw_http_status = response.status;

    if (response.ok) {
      stats.auth_ok = true;
      stats.model_reachable = true;
      stats.final_verdict = 'PROBE_PASS: GOOGLE_GEMINI_READY';
    } else {
      const errorText = await response.text();
      stats.raw_error_body = errorText.substring(0, 100).replace(/[\r\n]/g, ' ');

      // 4. NORMALIZED ERROR MAPPING
      switch (response.status) {
        case 400: stats.final_verdict = 'PROBE_FAIL: GEMINI_BAD_REQUEST'; break;
        case 401:
        case 403: stats.final_verdict = 'PROBE_FAIL: GEMINI_API_KEY_INVALID'; break;
        case 404: stats.final_verdict = 'PROBE_FAIL: GEMINI_MODEL_UNSUPPORTED'; break;
        case 429: stats.final_verdict = 'PROBE_FAIL: GEMINI_QUOTA_EXCEEDED'; break;
        case 500:
        case 503: stats.final_verdict = 'PROBE_FAIL: GEMINI_PROVIDER_UNAVAILABLE'; break;
        default: stats.final_verdict = 'PROBE_FAIL: GEMINI_PROVIDER_UNKNOWN';
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      stats.final_verdict = 'PROBE_FAIL: GEMINI_PROVIDER_TIMEOUT';
    } else {
      stats.raw_error_body = error.message.substring(0, 100);
      stats.final_verdict = 'PROBE_FAIL: GEMINI_PROVIDER_UNKNOWN';
    }
  }

  return exitProbe();
}

function exitProbe() {
  // 3. OUTPUT CONTRACT
  console.log(`auth_ok=${stats.auth_ok}`);
  console.log(`provider_label_ok=${stats.provider_label_ok}`);
  console.log(`model_reachable=${stats.model_reachable}`);
  console.log(`raw_http_status=${stats.raw_http_status}`);
  console.log(`raw_error_body=${stats.raw_error_body}`);
  console.log(`final_verdict=${stats.final_verdict}`);

  if (stats.final_verdict.startsWith('PROBE_PASS')) {
    return 0;
  } else {
    return 1;
  }
}

runProbe().then(code => {
  // Wait a tiny bit for any pending Windows handles to settle
  setTimeout(() => process.exit(code), 100);
});

