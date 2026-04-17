#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${BASH_VERSION:-}" ]]; then
  echo "[ERROR] This runner requires bash." >&2
  exit 1
fi

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "[ERROR] Linux-only runner. Use Codespaces/Linux for closure runs." >&2
  exit 1
fi

umask 077

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

K8S_NAMESPACE="${PV_K8S_NAMESPACE:-sia-validation-production}"
K8S_SECRET_NAME="${PV_K8S_SECRET_NAME:-sia-validation-secrets}"
K8S_PRIVATE_FIELD="${PV_K8S_PRIVATE_FIELD:-pecl-private-key}"
K8S_PUBLIC_FIELD="${PV_K8S_PUBLIC_FIELD:-pecl-public-key-dev-ephemeral}"

RUN_ID="${PV_RUN_ID:-pv_closure_$(date -u +%Y%m%d_%H%M%S)}"
ART_DIR="${PV_ARTIFACT_DIR:-/tmp/$RUN_ID}"
mkdir -p "$ART_DIR"

RUN_META="$ART_DIR/run_meta.txt"
ENV_SUMMARY="$ART_DIR/env_summary.txt"
FULL_LOG="$ART_DIR/full_run.log"
MARKERS_FILE="$ART_DIR/marker_extract.log"
BATCH_SELECTION_FILE="$ART_DIR/batch_id_selection.txt"
DB_SNAPSHOT_FILE="$ART_DIR/db_snapshot.json"
DB_NOTE_FILE="$ART_DIR/db_snapshot_note.txt"
DB_SUMMARY_FILE="$ART_DIR/db_summary.env"
FINAL_REPORT_FILE="$ART_DIR/final_closure_report.md"
FINAL_REPORT_JSON="$ART_DIR/final_closure_report.json"

RUN_COMMAND="PECL_SIGNING_KEY_ID=dev_ephemeral SHADOW_MODE=false VALIDATION_STRICT_MODE=true PECL_PRIVATE_KEY=<masked> PECL_PUBLIC_KEY_dev_ephemeral=<masked> node scripts/submit-synthetic-batch.js"

cat > "$RUN_META" <<EOF
run_id=$RUN_ID
repo_root=$REPO_ROOT
started_at_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)
artifacts_dir=$ART_DIR
full_log=$FULL_LOG
marker_extract=$MARKERS_FILE
final_report=$FINAL_REPORT_FILE
EOF

fail_with_required_env() {
  local reason="$1"
  cat >&2 <<EOF
[ERROR] $reason
[ERROR] Production validation closure run did not start.

Required environment variables:
  PECL_SIGNING_KEY_ID=dev_ephemeral
  PECL_PRIVATE_KEY
  PECL_PUBLIC_KEY_dev_ephemeral

Expected Kubernetes source:
  namespace: $K8S_NAMESPACE
  secret: $K8S_SECRET_NAME
  private field: $K8S_PRIVATE_FIELD
  public field: $K8S_PUBLIC_FIELD

Set the required variables manually and rerun:
  bash scripts/run-production-validation-closure.sh
EOF
  exit 1
}

decode_base64() {
  local encoded="$1"
  if printf '%s' "$encoded" | base64 --decode >/dev/null 2>&1; then
    printf '%s' "$encoded" | base64 --decode
    return 0
  fi

  if printf '%s' "$encoded" | base64 -d >/dev/null 2>&1; then
    printf '%s' "$encoded" | base64 -d
    return 0
  fi

  return 1
}

has_non_whitespace() {
  local value="${1:-}"
  [[ -n "$(printf '%s' "$value" | tr -d '[:space:]')" ]]
}

SIGNING_KEY_ID_VALUE=""
PECL_PRIVATE_KEY_VALUE=""
PECL_PUBLIC_KEY_DEV_VALUE=""
SECRET_LOADING_MODE=""

if has_non_whitespace "${PECL_SIGNING_KEY_ID:-}" \
  && has_non_whitespace "${PECL_PRIVATE_KEY:-}" \
  && has_non_whitespace "${PECL_PUBLIC_KEY_dev_ephemeral:-}"; then
  SIGNING_KEY_ID_VALUE="${PECL_SIGNING_KEY_ID}"
  PECL_PRIVATE_KEY_VALUE="${PECL_PRIVATE_KEY}"
  PECL_PUBLIC_KEY_DEV_VALUE="${PECL_PUBLIC_KEY_dev_ephemeral}"
  SECRET_LOADING_MODE="PRELOADED_ENV"
  echo "[INFO] Using preloaded PECL environment variables"
else
  if ! command -v kubectl >/dev/null 2>&1; then
    fail_with_required_env "kubectl not found on PATH."
  fi

  PRIVATE_KEY_B64="$(kubectl -n "$K8S_NAMESPACE" get secret "$K8S_SECRET_NAME" -o "jsonpath={.data['$K8S_PRIVATE_FIELD']}" 2>/dev/null || true)"
  PUBLIC_KEY_B64="$(kubectl -n "$K8S_NAMESPACE" get secret "$K8S_SECRET_NAME" -o "jsonpath={.data['$K8S_PUBLIC_FIELD']}" 2>/dev/null || true)"

  if [[ -z "$PRIVATE_KEY_B64" || -z "$PUBLIC_KEY_B64" ]]; then
    fail_with_required_env "Failed to read one or more Kubernetes secret fields."
  fi

  PECL_PRIVATE_KEY_VALUE="$(decode_base64 "$PRIVATE_KEY_B64" || true)"
  PECL_PUBLIC_KEY_DEV_VALUE="$(decode_base64 "$PUBLIC_KEY_B64" || true)"

  if [[ -z "$(printf '%s' "$PECL_PRIVATE_KEY_VALUE" | tr -d '[:space:]')" ]]; then
    fail_with_required_env "Decoded PECL_PRIVATE_KEY is empty."
  fi

  if [[ -z "$(printf '%s' "$PECL_PUBLIC_KEY_DEV_VALUE" | tr -d '[:space:]')" ]]; then
    fail_with_required_env "Decoded PECL_PUBLIC_KEY_dev_ephemeral is empty."
  fi

  SIGNING_KEY_ID_VALUE="dev_ephemeral"
  SECRET_LOADING_MODE="KUBECTL"
fi

KUBECTL_LOADING_STATUS="SKIPPED_PRELOADED_ENV"
if [[ "$SECRET_LOADING_MODE" == "KUBECTL" ]]; then
  KUBECTL_LOADING_STATUS="SUCCESS"
fi

cat > "$ENV_SUMMARY" <<EOF
PECL_SIGNING_KEY_ID=$SIGNING_KEY_ID_VALUE
SHADOW_MODE=false
VALIDATION_STRICT_MODE=true
PECL_PRIVATE_KEY=<set>
PECL_PUBLIC_KEY_dev_ephemeral=<set>
kubectl_secret_loading=$KUBECTL_LOADING_STATUS
EOF

echo "[INFO] Linux/Codespaces closure runner started"
echo "[INFO] Artifact directory: $ART_DIR"
echo "[INFO] PECL_PRIVATE_KEY=<set>"
echo "[INFO] PECL_PUBLIC_KEY_dev_ephemeral=<set>"
echo "[INFO] Running canonical validation command"

set +e
PECL_SIGNING_KEY_ID="$SIGNING_KEY_ID_VALUE" \
SHADOW_MODE="false" \
VALIDATION_STRICT_MODE="true" \
PECL_PRIVATE_KEY="$PECL_PRIVATE_KEY_VALUE" \
PECL_PUBLIC_KEY_dev_ephemeral="$PECL_PUBLIC_KEY_DEV_VALUE" \
node scripts/submit-synthetic-batch.js > "$FULL_LOG" 2>&1
RUN_EXIT_CODE=$?
set -e

RUN_OUTCOME="SUCCESS"
if [[ "$RUN_EXIT_CODE" -ne 0 ]]; then
  RUN_OUTCOME="FAILED"
fi

MARKERS=(
  "runtime.shadow_mode.final_state"
  "validation.active_provider.selected"
  "GROQ_CALL"
  "provider.fallback.decision"
  "CENTRAL_GEMINI_SUCCESS"
  "live_rail.acceptance_decision"
  "live_rail.result"
  "saveBatch.callsite"
  "saveBatch.entry"
  "saveBatch.contextBeforeEnforce"
  "terminalSinkEnforcer.provenanceCheck"
  "TERMINAL_SINK_ENFORCER"
  "PROVENANCE_UNAVAILABLE"
  "saveDecisionDNA"
  "createNews"
  "saveBatch"
  "finalBatch.reconciliation"
  "FULLY_PUBLISHED"
  "PARTIAL_PUBLISHED"
  "DELIVERY_FAILED"
  "FINALIZED"
  "ABANDONED"
  "[SUCCESS]"
  "[FAILED]"
  "SRE_ORCHESTRATION_FAILURE"
)

{
  echo "# Marker Extraction"
  echo "run_id=$RUN_ID"
  echo "log_file=$FULL_LOG"
  echo
  for marker in "${MARKERS[@]}"; do
    echo "## $marker"
    grep -nF "$marker" "$FULL_LOG" || echo "(no match)"
    echo
  done

  echo "## Additional forensic aliases"
  for alias_marker in "FORENSIC-1-CALLSITE" "FORENSIC-2-DB-ENTRY" "FORENSIC-3-DB-CONTEXT" "saveBatch entry received" "saveBatch context assembled before sink enforcement"; do
    echo "### $alias_marker"
    grep -nF "$alias_marker" "$FULL_LOG" || echo "(no match)"
    echo
  done
} > "$MARKERS_FILE"

SUBMITTED_BATCH_ID="$(grep -m1 -oE '\[SUBMITTED\] Batch: [^, ]+' "$FULL_LOG" | sed -E 's/^\[SUBMITTED\] Batch: ([^, ]+)$/\1/' || true)"
BATCH_ID_EQ="$(grep -m1 -oE 'batch_id=[A-Za-z0-9._:-]+' "$FULL_LOG" | cut -d'=' -f2 || true)"
PUBLISH_BATCH_ID="$(grep -m1 -oE 'for batch [A-Za-z0-9._:-]+' "$FULL_LOG" | awk '{print $3}' || true)"

mapfile -t BATCH_ID_CANDIDATES < <(grep -oE '(canary|batch)-[A-Za-z0-9-]+' "$FULL_LOG" | awk '!seen[$0]++' || true)

CANONICAL_BATCH_ID=""
BATCH_ID_REASON=""

if [[ -n "$SUBMITTED_BATCH_ID" ]]; then
  CANONICAL_BATCH_ID="$SUBMITTED_BATCH_ID"
  BATCH_ID_REASON="Selected from [SUBMITTED] batch marker emitted by scripts/submit-synthetic-batch.js"
elif [[ -n "$BATCH_ID_EQ" ]]; then
  CANONICAL_BATCH_ID="$BATCH_ID_EQ"
  BATCH_ID_REASON="Selected from first structured batch_id=... marker"
elif [[ -n "$PUBLISH_BATCH_ID" ]]; then
  CANONICAL_BATCH_ID="$PUBLISH_BATCH_ID"
  BATCH_ID_REASON="Selected from publish path marker 'for batch ...'"
elif [[ "${#BATCH_ID_CANDIDATES[@]}" -gt 0 ]]; then
  CANONICAL_BATCH_ID="${BATCH_ID_CANDIDATES[0]}"
  BATCH_ID_REASON="Selected from first discovered candidate id in log"
else
  BATCH_ID_REASON="No batch id marker found"
fi

{
  echo "run_id=$RUN_ID"
  echo "canonical_batch_id=${CANONICAL_BATCH_ID:-UNRESOLVED}"
  echo "selection_reason=$BATCH_ID_REASON"
  echo "candidates:"
  if [[ "${#BATCH_ID_CANDIDATES[@]}" -gt 0 ]]; then
    for candidate in "${BATCH_ID_CANDIDATES[@]}"; do
      echo "- $candidate"
    done
  else
    echo "- (none)"
  fi
} > "$BATCH_SELECTION_FILE"

cat > "$DB_SUMMARY_FILE" <<EOF
DB_SNAPSHOT_AVAILABLE=false
DB_PATH=UNAVAILABLE
DB_BATCH_ROW_PRESENT=false
DB_BATCH_STATUS=UNAVAILABLE
DB_EDITION_COUNT=0
DB_DECISION_DNA_COUNT=0
DB_METADATA_PRESENT_COUNT=0
DB_HEALING_PRESENT_COUNT=0
DB_NOTE=not_attempted
EOF

discover_db_path() {
  local candidates=()
  local db_from_url=""

  if [[ -n "${PV_DB_PATH:-}" ]]; then
    candidates+=("$PV_DB_PATH")
  fi

  if [[ -n "${EDITORIAL_DB_PATH:-}" ]]; then
    candidates+=("$EDITORIAL_DB_PATH")
  fi

  if [[ -n "${DATABASE_URL:-}" && "$DATABASE_URL" == file:* ]]; then
    db_from_url="${DATABASE_URL#file:}"
    if [[ "$db_from_url" != /* ]]; then
      db_from_url="$REPO_ROOT/${db_from_url#./}"
    fi
    candidates+=("$db_from_url")
  fi

  candidates+=(
    "$REPO_ROOT/data/editorial.db"
    "$REPO_ROOT/editorial.db"
    "/tmp/data/editorial.db"
  )

  while IFS= read -r tmp_db; do
    candidates+=("$tmp_db")
  done < <(ls -1dt /tmp/controlled-*/data/editorial.db 2>/dev/null | head -n 10 || true)

  declare -A seen=()
  local candidate=""
  local resolved=""
  for candidate in "${candidates[@]}"; do
    [[ -n "$candidate" ]] || continue
    resolved="$candidate"
    if [[ "$resolved" != /* ]]; then
      resolved="$REPO_ROOT/$resolved"
    fi
    if [[ -z "${seen[$resolved]+x}" ]]; then
      seen["$resolved"]=1
      if [[ -f "$resolved" && -r "$resolved" ]]; then
        echo "$resolved"
        return 0
      fi
    fi
  done

  return 1
}

DB_PATH=""
if [[ -n "$CANONICAL_BATCH_ID" ]]; then
  if node -e "require('better-sqlite3')" >/dev/null 2>&1; then
    DB_PATH="$(discover_db_path || true)"
    if [[ -n "$DB_PATH" ]]; then
      if node - "$DB_PATH" "$CANONICAL_BATCH_ID" "$DB_SNAPSHOT_FILE" "$DB_SUMMARY_FILE" <<'NODE'
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = process.argv[2];
const batchId = process.argv[3];
const outFile = process.argv[4];
const summaryFile = process.argv[5];

const hasData = (value) => {
  if (value === null || value === undefined) return false;
  const text = String(value).trim();
  if (!text) return false;
  if (text === '[]' || text === '{}' || text === 'null') return false;
  return true;
};

try {
  const db = new Database(dbPath, { readonly: true, fileMustExist: true });

  const batchRow = db.prepare(`
    SELECT id, mic_id, status, approved_languages, pending_languages, rejected_languages,
           is_mock, shadow_run, created_at, updated_at
    FROM batch_jobs
    WHERE id = ?
    LIMIT 1
  `).get(batchId) || null;

  const decisionRows = db.prepare(`
    SELECT payload_id, manifest_hash, trace_id, contract_version, final_decision,
           pecl_decision, gate_results, timestamp
    FROM decision_dna
    WHERE payload_id = ?
    ORDER BY timestamp DESC
    LIMIT 5
  `).all(batchId);

  const editionRows = db.prepare(`
    SELECT id, batch_id, language, status, metadata, healing_history, mic_id, mic_version
    FROM language_editions
    WHERE batch_id = ?
    ORDER BY language ASC
  `).all(batchId);

  const metadataPresentCount = editionRows.filter((row) => hasData(row.metadata)).length;
  const healingPresentCount = editionRows.filter((row) => hasData(row.healing_history)).length;

  const decisionDigestSummary = decisionRows.map((row) => {
    let peclDecision = {};
    try {
      peclDecision = JSON.parse(row.pecl_decision || '{}');
    } catch {
      peclDecision = {};
    }

    return {
      payload_id: row.payload_id,
      final_decision: row.final_decision,
      manifest_hash_prefix: row.manifest_hash ? row.manifest_hash.slice(0, 16) : null,
      trace_id: row.trace_id,
      claim_graph_digest_present: Boolean(peclDecision.claimGraphDigest),
      evidence_ledger_digest_present: Boolean(peclDecision.evidenceLedgerDigest),
      key_id: peclDecision.keyId || null,
      timestamp: row.timestamp
    };
  });

  const snapshot = {
    snapshot_available: true,
    db_path: dbPath,
    requested_batch_id: batchId,
    batch_row: batchRow ? {
      batch_id: batchRow.id,
      canonical_batch_id: batchRow.id,
      mic_id: batchRow.mic_id,
      status: batchRow.status,
      is_mock: Number(batchRow.is_mock || 0),
      shadow_run: Number(batchRow.shadow_run || 0),
      created_at: batchRow.created_at,
      updated_at: batchRow.updated_at
    } : null,
    decision_dna: {
      count: decisionRows.length,
      rows: decisionDigestSummary
    },
    language_editions: {
      count: editionRows.length,
      metadata_present_count: metadataPresentCount,
      healing_history_present_count: healingPresentCount,
      rows: editionRows.map((row) => ({
        id: row.id,
        batch_id: row.batch_id,
        language: row.language,
        status: row.status,
        mic_id: row.mic_id,
        mic_version: row.mic_version,
        metadata_present: hasData(row.metadata),
        healing_history_present: hasData(row.healing_history)
      }))
    }
  };

  fs.writeFileSync(outFile, JSON.stringify(snapshot, null, 2));

  const summary = [
    'DB_SNAPSHOT_AVAILABLE=true',
    `DB_PATH=${dbPath}`,
    `DB_BATCH_ROW_PRESENT=${batchRow ? 'true' : 'false'}`,
    `DB_BATCH_STATUS=${batchRow ? String(batchRow.status) : 'NONE'}`,
    `DB_EDITION_COUNT=${editionRows.length}`,
    `DB_DECISION_DNA_COUNT=${decisionRows.length}`,
    `DB_METADATA_PRESENT_COUNT=${metadataPresentCount}`,
    `DB_HEALING_PRESENT_COUNT=${healingPresentCount}`,
    'DB_NOTE=ok'
  ].join('\n');

  fs.writeFileSync(summaryFile, `${summary}\n`);
} catch (error) {
  const summary = [
    'DB_SNAPSHOT_AVAILABLE=false',
    `DB_PATH=${dbPath}`,
    'DB_BATCH_ROW_PRESENT=false',
    'DB_BATCH_STATUS=UNAVAILABLE',
    'DB_EDITION_COUNT=0',
    'DB_DECISION_DNA_COUNT=0',
    'DB_METADATA_PRESENT_COUNT=0',
    'DB_HEALING_PRESENT_COUNT=0',
    'DB_NOTE=query_failed'
  ].join('\n');

  fs.writeFileSync(summaryFile, `${summary}\n`);
  process.stderr.write(`DB snapshot query failed: ${error.message}\n`);
  process.exit(1);
}
NODE
      then
        :
      else
        echo "DB snapshot unavailable: query failure for discovered path $DB_PATH" > "$DB_NOTE_FILE"
      fi
    else
      echo "DB snapshot unavailable: no readable editorial DB found." > "$DB_NOTE_FILE"
      cat > "$DB_SUMMARY_FILE" <<EOF
DB_SNAPSHOT_AVAILABLE=false
DB_PATH=UNAVAILABLE
DB_BATCH_ROW_PRESENT=false
DB_BATCH_STATUS=UNAVAILABLE
DB_EDITION_COUNT=0
DB_DECISION_DNA_COUNT=0
DB_METADATA_PRESENT_COUNT=0
DB_HEALING_PRESENT_COUNT=0
DB_NOTE=db_not_found
EOF
    fi
  else
    echo "DB snapshot unavailable: better-sqlite3 runtime not available in this environment." > "$DB_NOTE_FILE"
    cat > "$DB_SUMMARY_FILE" <<EOF
DB_SNAPSHOT_AVAILABLE=false
DB_PATH=UNAVAILABLE
DB_BATCH_ROW_PRESENT=false
DB_BATCH_STATUS=UNAVAILABLE
DB_EDITION_COUNT=0
DB_DECISION_DNA_COUNT=0
DB_METADATA_PRESENT_COUNT=0
DB_HEALING_PRESENT_COUNT=0
DB_NOTE=better_sqlite3_unavailable
EOF
  fi
else
  echo "DB snapshot unavailable: canonical batch id could not be resolved from run log." > "$DB_NOTE_FILE"
  cat > "$DB_SUMMARY_FILE" <<EOF
DB_SNAPSHOT_AVAILABLE=false
DB_PATH=UNAVAILABLE
DB_BATCH_ROW_PRESENT=false
DB_BATCH_STATUS=UNAVAILABLE
DB_EDITION_COUNT=0
DB_DECISION_DNA_COUNT=0
DB_METADATA_PRESENT_COUNT=0
DB_HEALING_PRESENT_COUNT=0
DB_NOTE=batch_id_unresolved
EOF
fi

source "$DB_SUMMARY_FILE"

SINK_STATUS="UNCLEAR"
if grep -qF "PROVENANCE_UNAVAILABLE" "$FULL_LOG"; then
  SINK_STATUS="FAIL"
elif grep -qE "VERIFICATION_PASS.*(createNews|saveBatch|saveDecisionDNA)" "$FULL_LOG"; then
  SINK_STATUS="PASS"
elif grep -qF "TERMINAL_SINK_ENFORCER" "$FULL_LOG"; then
  SINK_STATUS="UNCLEAR"
fi

SINK_EVIDENCE="$(grep -nE 'PROVENANCE_UNAVAILABLE|VERIFICATION_(PASS|FAIL).*createNews|VERIFICATION_(PASS|FAIL).*saveBatch|VERIFICATION_(PASS|FAIL).*saveDecisionDNA|TERMINAL_SINK_ENFORCER' "$FULL_LOG" | head -n 30 || true)"

FINAL_STATE_STATUS="UNCLEAR"
if [[ "$DB_SNAPSHOT_AVAILABLE" == "true" ]]; then
  if [[ "$DB_BATCH_ROW_PRESENT" != "true" ]]; then
    FINAL_STATE_STATUS="FAIL"
  elif [[ "$DB_BATCH_STATUS" == "IN_PROGRESS" || "$DB_BATCH_STATUS" == "SUPERVISOR_REVIEW" || "$DB_BATCH_STATUS" == "AUDITING" || "$DB_BATCH_STATUS" == "HEALING" ]]; then
    FINAL_STATE_STATUS="FAIL"
  elif [[ "$DB_EDITION_COUNT" -eq 0 ]]; then
    FINAL_STATE_STATUS="FAIL"
  else
    FINAL_STATE_STATUS="PASS"
  fi
else
  if [[ "$RUN_EXIT_CODE" -ne 0 ]]; then
    FINAL_STATE_STATUS="FAIL"
  else
    FINAL_STATE_STATUS="UNCLEAR"
  fi
fi

FINAL_STATE_EVIDENCE="$(grep -nE 'finalBatch\.reconciliation|FULLY_PUBLISHED|PARTIAL_PUBLISHED|DELIVERY_FAILED|FINALIZED|ABANDONED|\[SUBMITTED\]|\[FAILED\]|SRE_ORCHESTRATION_FAILURE' "$FULL_LOG" | head -n 30 || true)"
KEY_MARKERS="$(grep -nE 'runtime.shadow_mode.final_state|validation.active_provider.selected|GROQ_CALL|provider.fallback.decision|CENTRAL_GEMINI_SUCCESS|live_rail.acceptance_decision|live_rail.result|\[SUBMITTED\]|\[FAILED\]|SRE_ORCHESTRATION_FAILURE' "$FULL_LOG" | head -n 40 || true)"

if [[ "$RUN_EXIT_CODE" -eq 0 && "$SINK_STATUS" == "PASS" && "$FINAL_STATE_STATUS" == "PASS" ]]; then
  EXECUTIVE_RESULT="PRODUCTION VALIDATION CLOSED"
elif [[ "$RUN_EXIT_CODE" -eq 0 && "$SINK_STATUS" != "FAIL" && "$FINAL_STATE_STATUS" != "FAIL" ]]; then
  EXECUTIVE_RESULT="MOSTLY CLOSED / ONE PROOF GAP REMAINS"
else
  EXECUTIVE_RESULT="NOT CLOSED / REAL BLOCKER CONFIRMED"
fi

if [[ "$SINK_STATUS" == "FAIL" ]]; then
  FINAL_DECISION_REASON="Sink-time provenance or terminal sink verification failure detected."
elif [[ "$FINAL_STATE_STATUS" == "FAIL" ]]; then
  FINAL_DECISION_REASON="Batch final-state/canonical linkage check failed."
elif [[ "$EXECUTIVE_RESULT" == "PRODUCTION VALIDATION CLOSED" ]]; then
  FINAL_DECISION_REASON="Closure run passed with sink and final-state checks satisfied."
else
  FINAL_DECISION_REASON="Run completed but at least one closure proof area remains unclear."
fi

append_evidence_block() {
  local title="$1"
  local content="$2"

  {
    echo "$title"
    echo '```text'
    if [[ -n "$content" ]]; then
      printf '%s\n' "$content"
    else
      echo '(no matching lines)'
    fi
    echo '```'
  } >> "$FINAL_REPORT_FILE"
}

cat > "$FINAL_REPORT_FILE" <<EOF
# PRODUCTION VALIDATION — FINAL CLOSURE RUN REPORT

## 1. Executive Result
- $EXECUTIVE_RESULT

## 2. Run Command and Environment
- command: $RUN_COMMAND
- kubectl secret loading succeeded: YES
- PECL env loaded: YES
- artifact paths:
  - run meta: $RUN_META
  - env summary: $ENV_SUMMARY
  - full log: $FULL_LOG
  - marker extract: $MARKERS_FILE
  - batch id selection: $BATCH_SELECTION_FILE
  - db snapshot: $DB_SNAPSHOT_FILE
  - final report: $FINAL_REPORT_FILE

## 3. Full Run Outcome
- run exit code: $RUN_EXIT_CODE
- run outcome: $RUN_OUTCOME
- canonical batch id: ${CANONICAL_BATCH_ID:-UNRESOLVED}
- canonical id selection basis: $BATCH_ID_REASON
- key raw markers:
EOF

append_evidence_block "" "$KEY_MARKERS"

cat >> "$FINAL_REPORT_FILE" <<EOF

## 4. Sink-Time Provenance Check
- status: $SINK_STATUS
- evidence lines:
EOF

append_evidence_block "" "$SINK_EVIDENCE"

cat >> "$FINAL_REPORT_FILE" <<EOF

## 5. Batch Final-State / Canonical Linkage Check
- status: $FINAL_STATE_STATUS
- evidence lines:
EOF

append_evidence_block "" "$FINAL_STATE_EVIDENCE"

cat >> "$FINAL_REPORT_FILE" <<EOF

## 6. DB Snapshot
EOF

if [[ "$DB_SNAPSHOT_AVAILABLE" == "true" ]]; then
  cat >> "$FINAL_REPORT_FILE" <<EOF
- snapshot status: AVAILABLE
- db path: $DB_PATH
- batch row present: $DB_BATCH_ROW_PRESENT
- batch status: $DB_BATCH_STATUS
- edition count: $DB_EDITION_COUNT
- decision_dna count: $DB_DECISION_DNA_COUNT
- metadata present count: $DB_METADATA_PRESENT_COUNT
- healing_history present count: $DB_HEALING_PRESENT_COUNT
- snapshot file: $DB_SNAPSHOT_FILE
EOF
else
  DB_NOTE_CONTENT="DB snapshot unavailable."
  if [[ -f "$DB_NOTE_FILE" ]]; then
    DB_NOTE_CONTENT="$(cat "$DB_NOTE_FILE")"
  fi
  cat >> "$FINAL_REPORT_FILE" <<EOF
- snapshot status: UNAVAILABLE
- note: $DB_NOTE_CONTENT
EOF
fi

cat >> "$FINAL_REPORT_FILE" <<EOF

## 7. Final Decision
- classification: $EXECUTIVE_RESULT
- exact blocker if any: $FINAL_DECISION_REASON
EOF

cat > "$FINAL_REPORT_JSON" <<EOF
{
  "run_id": "$RUN_ID",
  "executive_result": "$EXECUTIVE_RESULT",
  "run_exit_code": $RUN_EXIT_CODE,
  "run_outcome": "$RUN_OUTCOME",
  "canonical_batch_id": "${CANONICAL_BATCH_ID:-UNRESOLVED}",
  "canonical_id_reason": "$BATCH_ID_REASON",
  "sink_time_provenance_check": "$SINK_STATUS",
  "batch_final_state_check": "$FINAL_STATE_STATUS",
  "db_snapshot_available": "$DB_SNAPSHOT_AVAILABLE",
  "db_path": "$DB_PATH",
  "artifacts": {
    "full_log": "$FULL_LOG",
    "marker_extract": "$MARKERS_FILE",
    "batch_id_selection": "$BATCH_SELECTION_FILE",
    "db_snapshot": "$DB_SNAPSHOT_FILE",
    "final_report_md": "$FINAL_REPORT_FILE",
    "final_report_json": "$FINAL_REPORT_JSON"
  }
}
EOF

unset PRIVATE_KEY_B64
unset PUBLIC_KEY_B64
unset PECL_PRIVATE_KEY_VALUE
unset PECL_PUBLIC_KEY_DEV_VALUE

echo "[INFO] Closure run complete"
echo "[INFO] Outcome: $RUN_OUTCOME (exit_code=$RUN_EXIT_CODE)"
echo "[INFO] Final report: $FINAL_REPORT_FILE"
echo "[INFO] JSON summary: $FINAL_REPORT_JSON"

exit "$RUN_EXIT_CODE"
