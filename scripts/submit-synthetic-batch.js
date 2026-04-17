#!/usr/bin/env node
/**
 * scripts/submit-synthetic-batch.js
 *
 * Principal Production SRE Tool: Synthetic Canary Injector
 */

// 1. DETERMINISTIC ENV BOOTSTRAP (PHASE 1.9.15.D/E/F) - MUST BE FIRST
const bootstrapDiagnostics = {
  env_file_path: '.env.local',
  env_file_found: false,
  env_keys_applied: [],
  env_keys_preserved: [],
  shadow_mode_source: 'default(false)'
};

try {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(process.cwd(), '.env.local');
  bootstrapDiagnostics.env_file_path = envPath;

  if (fs.existsSync(envPath)) {
    bootstrapDiagnostics.env_file_found = true;
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let key = match[1];
        let value = (match[2] || '').trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);

        if (process.env[key] === undefined) {
          process.env[key] = value;
          bootstrapDiagnostics.env_keys_applied.push(key);

          if (key === 'SHADOW_MODE') {
            bootstrapDiagnostics.shadow_mode_source = '.env.local';
          }
        } else {
          bootstrapDiagnostics.env_keys_preserved.push(key);

          if (key === 'SHADOW_MODE') {
            bootstrapDiagnostics.shadow_mode_source = 'inherited_process_env';
          }
        }
      }
    });
  }

  // Also try standard dotenv if available
  require('dotenv').config({ path: '.env.local', override: false });

  if (process.env.SHADOW_MODE !== undefined && bootstrapDiagnostics.shadow_mode_source === 'default(false)') {
    bootstrapDiagnostics.shadow_mode_source = 'inherited_process_env';
  }

  if (!process.env.RUNTIME_SHADOW_MODE_SOURCE) {
    process.env.RUNTIME_SHADOW_MODE_SOURCE = bootstrapDiagnostics.shadow_mode_source;
  }
} catch (e) {
  // Fallback to manual load already attempted
}

// 2. Register TypeScript loader
try {
  require('ts-node/register');
} catch (error) {
  try {
    require('tsx/cjs');
  } catch (error2) {
    console.error('[ERROR] TypeScript loader not available. Install ts-node or tsx:');
    console.error('  npm install --save-dev ts-node');
    console.error('  OR');
    console.error('  npm install --save-dev tsx');
    process.exit(1);
  }
}

// 3. Import dependencies AFTER bootstrap
const fs = require('fs');
const MasterOrchestrator = require('../lib/neural-assembly/master-orchestrator').default;
const { getGlobalDatabase } = require('../lib/neural-assembly/database');
const { getGlobalBlackboard } = require('../lib/neural-assembly/blackboard-system');
const { runDeepAudit } = require('../lib/neural-assembly/sia-sentinel-core');
const { preflightProviderCheck } = require('../lib/neural-assembly/llm-provider');
const { PECL_DEPLOYMENT_MODE } = require('../lib/neural-assembly/stabilization/config');
const { logOperation } = require('../lib/neural-assembly/observability');
const { evaluateOperatorPrecheck, logOperatorPrecheckSummary } = require('../lib/neural-assembly/stabilization/operator-precheck');
const {
  LIVE_VALIDATION_LANGUAGE_TARGET,
  REDUCED_VALIDATION_LANGUAGE_TARGET,
  resolveValidationReducedModeSelection
} = require('../lib/neural-assembly/validation-reduced-mode');

function resolveSyntheticValidationLanguageSelection() {
  return resolveValidationReducedModeSelection({
    liveTargetLanguages: LIVE_VALIDATION_LANGUAGE_TARGET
  });
}

function getSyntheticValidationReducedModeLogEntries(trace_id, validationLanguageSelection) {
  return [
    {
      operation: 'validation.reduced_mode.enabled',
      level: 'INFO',
      message: 'Validation reduced mode gate evaluated for synthetic canary execution',
      context: {
        trace_id,
        status: validationLanguageSelection.enabled ? 'ENABLED' : 'DISABLED',
        metadata: {
          enabled: validationLanguageSelection.enabled,
          strict_validation_mode: validationLanguageSelection.strict_validation_mode,
          validation_only_control_run: true,
          live_target_language_count: validationLanguageSelection.live_target_languages.length,
          live_target_remains_full: true
        }
      }
    },
    {
      operation: 'validation.reduced_mode.language_set',
      level: 'INFO',
      message: 'Validation reduced mode language set resolved for synthetic canary execution',
      context: {
        trace_id,
        status: validationLanguageSelection.result,
        metadata: {
          language_set: validationLanguageSelection.execution_languages,
          reduced_control_language_set: REDUCED_VALIDATION_LANGUAGE_TARGET,
          live_target_languages: validationLanguageSelection.live_target_languages,
          validation_only_control_run: true
        }
      }
    },
    {
      operation: 'validation.reduced_mode.language_count',
      level: 'INFO',
      message: 'Validation reduced mode language count resolved for synthetic canary execution',
      context: {
        trace_id,
        status: validationLanguageSelection.result,
        metadata: {
          language_count: validationLanguageSelection.execution_languages.length,
          live_target_language_count: validationLanguageSelection.live_target_languages.length,
          validation_only_control_run: true
        }
      }
    },
    {
      operation: 'validation.reduced_mode.source',
      level: 'INFO',
      message: 'Validation reduced mode source resolved for synthetic canary execution',
      context: {
        trace_id,
        status: validationLanguageSelection.source,
        metadata: {
          source: validationLanguageSelection.source,
          env_switch: 'VALIDATION_REDUCED_MODE',
          strict_validation_mode: validationLanguageSelection.strict_validation_mode,
          validation_only_control_run: true
        }
      }
    },
    {
      operation: 'validation.reduced_mode.result',
      level: 'INFO',
      message: 'Validation reduced mode result applied for synthetic canary execution',
      context: {
        trace_id,
        status: validationLanguageSelection.result,
        metadata: {
          result: validationLanguageSelection.result,
          execution_languages: validationLanguageSelection.execution_languages,
          live_target_languages: validationLanguageSelection.live_target_languages,
          live_target_unchanged: true,
          validation_only_control_run: true
        }
      }
    }
  ];
}

function emitSyntheticValidationReducedModeLogs(trace_id, validationLanguageSelection) {
  const entries = getSyntheticValidationReducedModeLogEntries(trace_id, validationLanguageSelection);
  for (const entry of entries) {
    logOperation('RUNTIME', entry.operation, entry.level, entry.message, entry.context);
  }
}

async function main() {
  const EMERGENCY_STOP_FILE = '.emergency-stop-active';
  const PAUSE_INGESTION_FILE = '.ingestion-paused';
  const HARD_LOCK_FILE = '.system-hard-lock';
  const THROTTLE_PREFIX = '.ingestion-throttle-';

  const strictValidationMode = (process.env.VALIDATION_STRICT_MODE || 'true').toLowerCase() === 'true';
  process.env.VALIDATION_STRICT_MODE = strictValidationMode ? 'true' : 'false';

  const shadowMode = (process.env.SHADOW_MODE || '').trim().toLowerCase() === 'true';
  const shadowModeSource = process.env.RUNTIME_SHADOW_MODE_SOURCE || bootstrapDiagnostics.shadow_mode_source;

  logOperation('RUNTIME', 'runtime.shadow_mode.source', 'INFO', 'Resolved runtime shadow mode source for synthetic canary execution', {
    metadata: {
      source: shadowModeSource,
      env_file_found: bootstrapDiagnostics.env_file_found,
      env_keys_applied_count: bootstrapDiagnostics.env_keys_applied.length,
      env_keys_preserved_count: bootstrapDiagnostics.env_keys_preserved.length
    }
  });

  logOperation('RUNTIME', 'runtime.shadow_mode.final_state', shadowMode ? 'WARN' : 'INFO', 'Resolved runtime shadow mode final state for synthetic canary execution', {
    metadata: {
      shadow_mode: shadowMode,
      shadow_mode_raw: process.env.SHADOW_MODE ?? null,
      strict_validation_mode: strictValidationMode
    }
  });

  logOperation(
    'RUNTIME',
    'validation.run.mode_summary',
    strictValidationMode && shadowMode ? 'ERROR' : 'INFO',
    'Validation run mode summary for synthetic canary execution',
    {
      metadata: {
        strict_validation_mode: strictValidationMode,
        shadow_mode: shadowMode,
        shadow_mode_source: shadowModeSource,
        pecl_deployment_mode: PECL_DEPLOYMENT_MODE,
        node_env: process.env.NODE_ENV || null
      }
    }
  );

  if (strictValidationMode && shadowMode) {
    console.error('[VALIDATION_MODE_FAIL] Strict validation mode requires SHADOW_MODE=false.');
    process.exit(1);
  }

  const precheckSummary = await evaluateOperatorPrecheck();
  logOperatorPrecheckSummary(precheckSummary);

  if (strictValidationMode && !precheckSummary.pass) {
    console.error('[PRECHECK_FAIL] Strict validation mode requires PECL_SIGNING_KEY_ID, PECL_PRIVATE_KEY, and a matching PECL_PUBLIC_KEY_<keyId>.');
    process.exit(1);
  }

  // --- CONTROL SURFACE SAFETY VERIFICATION ---

  // 0. SYSTEM HARD LOCK (Provider Quota/Fatal Block)
  if (fs.existsSync(HARD_LOCK_FILE)) {
    let reason = 'UNKNOWN_REASON';
    try {
      reason = fs.readFileSync(HARD_LOCK_FILE, 'utf8').trim();
    } catch (e) {}
    console.log(`[HARD_LOCK_BLOCK: ${reason}]`);
    process.exit(1);
  }

  // 1. EMERGENCY STOP (Hard Kill)
  if (fs.existsSync(EMERGENCY_STOP_FILE)) {
    console.log('[BLOCKED - EMERGENCY STOP ACTIVE]');
    process.exit(1);
  }

  // 2. PAUSE INGESTION (Admission Control)
  if (fs.existsSync(PAUSE_INGESTION_FILE)) {
    console.log('[BLOCKED - INGESTION PAUSED]');
    process.exit(1);
  }

  // 3. THROTTLE INGESTION (Concurrency Control)
  const throttleFiles = fs.readdirSync('.').filter(f => f.startsWith(THROTTLE_PREFIX));
  if (throttleFiles.length > 0) {
    const throttleFile = throttleFiles[0];
    const limit = parseInt(throttleFile.replace(THROTTLE_PREFIX, ''), 10);
    const db = getGlobalDatabase();
    // Use 'system-operator' context to check active batch count
    const activeBatchCount = db.getActiveBatchCount('system-operator');

    if (activeBatchCount >= limit) {
      console.log(`[BLOCKED - THROTTLE LIMIT REACHED (Limit: ${limit}, Active: ${activeBatchCount})]`);
      process.exit(1);
    }
  }

  // 4. PROVIDER PREFLIGHT GATE (PHASE 1.9.15.F)
  try {
    await preflightProviderCheck();
  } catch (error) {
    console.error(`[PREFLIGHT_FAIL] Provider readiness check failed: ${error.message}`);
    process.exit(1);
  }

  // --- EXECUTION (REAL INTERNAL PATH) ---

  try {
    const orchestrator = new MasterOrchestrator();
    const trace_id = `synthetic-canary-${Date.now()}`;

    const validationLanguageSelection = resolveSyntheticValidationLanguageSelection();
    emitSyntheticValidationReducedModeLogs(trace_id, validationLanguageSelection);

    const languages = validationLanguageSelection.execution_languages;
    if (!Array.isArray(languages) || languages.length === 0) {
      throw new Error('VALIDATION_REDUCED_MODE_EMPTY_LANGUAGE_SET');
    }

    console.log(`[SYNTHETIC] Execution language scope: ${languages.join(', ')}`);
    console.log(`[SYNTHETIC] Live target language scope: ${validationLanguageSelection.live_target_languages.join(', ')}`);

    // Formulation of microscopic synthetic payload
    const payload = {
      sources: [{
        url: 'https://synthetic.sia-intel.com/canary-signal-0',
        content: 'CANARY_SIGNAL_0: System integrity verification payload. Microscopic synthetic batch for telemetry validation.',
        timestamp: Date.now(),
        credibility_score: 1.0
      }]
    };

    // Step 1: MIC Creation (Real Logic)
    const mic = await orchestrator.createMIC(payload.sources);
    mic.metadata.urgency = "standard"; // L6-BLK-005 Fix: Set to standard to avoid automatic escalation
    mic.metadata.category = "General";

    // Step 2: Edition Planning (Real Logic)
    const plans = await orchestrator.planEditions(mic);
    const editions = {};

    for (const lang of languages) {
      console.log(`[SYNTHETIC] Processing ${lang}...`);
      const plan = plans[lang];

      // Step 3: Edition Generation (Real Logic - invokes LLM provider)
      const edition = await orchestrator.generateEdition(mic, plan, lang);

      // Step 4: Deep Audit (Real Logic - SIA Sentinel)
      const auditResult = runDeepAudit({
        title: edition.content.title,
        lead: edition.content.lead,
        summary: edition.content.body.summary,
        body: edition.content.body.full,
        language: lang,
        schema: edition.content.schema, // L6-BLK-005 Fix: Pass schema for audit
        internalLinks: edition.content.internalLinks, // L6-BLK-005 Fix: Pass links for audit
        metadata: { category: 'System', language: lang }
      });

      // Map internal audit metrics to edition state
      edition.audit_results = {
        overall_score: auditResult.overall_score,
        cell_scores: auditResult.cell_scores,
        issues: auditResult.issues.map(i => ({
          id: i.issue_id,
          severity: i.severity,
          description: i.message,
          pattern_hash: `canary-audit-${i.issue_type}`
        }))
      };
      edition.status = auditResult.overall_score >= 85 ? 'APPROVED' : 'REJECTED';
      editions[lang] = edition;
    }

    // Step 5: Batch Job Persistence (Real Logic)
    const batchId = `canary-${mic.id}-${Date.now()}`;
    const batch = {
      id: batchId,
      mic_id: mic.id,
      user_id: 'system-operator',
      status: 'IN_PROGRESS',
      created_at: Date.now(),
      updated_at: Date.now(),
      editions: editions,
      approved_languages: [],
      pending_languages: languages,
      budget: { total: 1.0, spent: 0, remaining: 1.0 }
    };

    const db = getGlobalDatabase();
    db.saveBatch(batch);

    // Seed blackboard with complete runner-owned batch state before decision routing.
    const blackboard = getGlobalBlackboard();
    blackboard.write(`batch.${batchId}`, batch, 'system');

    // Step 6: Chief Editor Review (Real Logic - Decision Engine)
    const decision = await orchestrator.chiefEditorReview(batch, mic);

    // Step 7: Continue through publish path when approval surface exists.
    // This preserves existing sink enforcement and idempotency while ensuring
    // the runner reaches terminal persistence stages for validation.
    const approvedLanguages = Array.isArray(decision.approved_languages)
      ? decision.approved_languages
      : [];

    if (approvedLanguages.length > 0) {
      await orchestrator.publish(batch, approvedLanguages, mic);
    }

    console.log(`[SUBMITTED] Batch: ${batchId}, Decision: ${decision.overall_decision}`);
    process.exit(0);
  } catch (error) {
    console.log('[FAILED]');
    console.error(`SRE_ORCHESTRATION_FAILURE: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  main,
  resolveSyntheticValidationLanguageSelection,
  getSyntheticValidationReducedModeLogEntries
};
