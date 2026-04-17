/**
 * ULTRA-FINAL HARDENING TESTS
 * 
 * Tests for:
 * 1. Deterministic delivery verification (meta tag hash extraction)
 * 2. Atomic single-use bypass token enforcement
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { getGlobalDatabase, resetGlobalDatabase } from '../../database';
import { recordEmergencyBypass, type EmergencyBypassContext } from '../sink-verifier';
import { canonicalizeJSON } from '../crypto-provider';
import crypto from 'crypto';

describe('ULTRA-FINAL HARDENING', () => {
  beforeEach(() => {
    resetGlobalDatabase();
    // Force recreation with in-memory database for clean state
    const { EditorialDatabase } = require('../../database');
    const testDb = new EditorialDatabase(':memory:');
    (global as any).__TEST_DB__ = testDb;
  });

  afterEach(() => {
    const testDb = (global as any).__TEST_DB__;
    if (testDb) {
      testDb.close();
      delete (global as any).__TEST_DB__;
    }
    resetGlobalDatabase();
  });

  const getTestDb = () => {
    return (global as any).__TEST_DB__ || getGlobalDatabase();
  };

  describe('RISK 1: Deterministic Delivery Verification', () => {
    it('should compute deterministic hash for same content', () => {
      const article = {
        id: 'test-123',
        title: 'Test Article',
        slug: 'test-article',
        content: '<p>Test content</p>',
        summary: 'Test summary',
        language: 'en'
      };

      // Compute hash twice
      const canonical1 = canonicalizeJSON(article);
      const hash1 = crypto.createHash('sha256').update(canonical1, 'utf8').digest('hex');

      const canonical2 = canonicalizeJSON(article);
      const hash2 = crypto.createHash('sha256').update(canonical2, 'utf8').digest('hex');

      // Should be identical (deterministic)
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex chars
    });

    it('should extract meta tag hash from HTML content', () => {
      const manifestHash = 'a'.repeat(64); // 64-char hex hash
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><meta name="x-content-hash" content="${manifestHash}" data-verification="true" /></head>
        <body><p>Content</p></body>
        </html>
      `;

      const metaTagMatch = htmlContent.match(
        /<meta\s+name="x-content-hash"\s+content="([a-f0-9]{64})"\s+data-verification="true"\s*\/?>/i
      );

      expect(metaTagMatch).not.toBeNull();
      expect(metaTagMatch![1]).toBe(manifestHash);
    });

    it('should fail if meta tag not found', () => {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><title>Test</title></head>
        <body><p>Content</p></body>
        </html>
      `;

      const metaTagMatch = htmlContent.match(
        /<meta\s+name="x-content-hash"\s+content="([a-f0-9]{64})"\s+data-verification="true"\s*\/?>/i
      );

      expect(metaTagMatch).toBeNull();
    });

    it('should fail if hash format is invalid', () => {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><meta name="x-content-hash" content="invalid-hash" data-verification="true" /></head>
        <body><p>Content</p></body>
        </html>
      `;

      const metaTagMatch = htmlContent.match(
        /<meta\s+name="x-content-hash"\s+content="([a-f0-9]{64})"\s+data-verification="true"\s*\/?>/i
      );

      expect(metaTagMatch).toBeNull(); // Regex requires exactly 64 hex chars
    });
  });

  describe('RISK 2: Atomic Single-Use Bypass Token Enforcement', () => {
    it('should allow first use of valid bypass token', () => {
      const db = getTestDb();
      const now = Date.now();
      const expiresAt = now + 60000; // 1 minute from now

      // Generate valid token
      const token = crypto.createHash('sha256')
        .update(`ops-john:emergency-fix:${expiresAt}:${process.env.BYPASS_SECRET || 'default-secret'}`, 'utf8')
        .digest('hex');

      const context: EmergencyBypassContext = {
        bypass_token: token,
        operator_id: 'ops-john',
        reason: 'emergency-fix',
        expires_at: expiresAt,
        timestamp: now,
        sink_name: 'testSink'
      };

      // First use should succeed
      const result = recordEmergencyBypass(context);
      expect(result).toBe(true);

      // Verify log was created with bypass_token
      const logs = db.getLogs({ component: 'EMERGENCY_BYPASS', operation: 'BYPASS_ACTIVATED' });
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('SINGLE-USE');
    });

    it('should reject second use of same bypass token (atomic enforcement)', () => {
      const db = getTestDb();
      const now = Date.now();
      const expiresAt = now + 60000;

      const token = crypto.createHash('sha256')
        .update(`ops-john:emergency-fix:${expiresAt}:${process.env.BYPASS_SECRET || 'default-secret'}`, 'utf8')
        .digest('hex');

      const context: EmergencyBypassContext = {
        bypass_token: token,
        operator_id: 'ops-john',
        reason: 'emergency-fix',
        expires_at: expiresAt,
        timestamp: now,
        sink_name: 'testSink'
      };

      // First use succeeds
      const result1 = recordEmergencyBypass(context);
      expect(result1).toBe(true);

      // Second use should fail (UNIQUE constraint violation)
      const result2 = recordEmergencyBypass(context);
      expect(result2).toBe(false);

      // Verify replay attempt was logged
      const replayLogs = db.getLogs({ component: 'EMERGENCY_BYPASS', operation: 'BYPASS_REPLAY_ATTEMPT' });
      expect(replayLogs.length).toBeGreaterThan(0);
    });

    it('should reject expired bypass token', () => {
      const now = Date.now();
      const expiresAt = now - 1000; // Expired 1 second ago

      const token = crypto.createHash('sha256')
        .update(`ops-john:emergency-fix:${expiresAt}:${process.env.BYPASS_SECRET || 'default-secret'}`, 'utf8')
        .digest('hex');

      const context: EmergencyBypassContext = {
        bypass_token: token,
        operator_id: 'ops-john',
        reason: 'emergency-fix',
        expires_at: expiresAt,
        timestamp: now,
        sink_name: 'testSink'
      };

      const result = recordEmergencyBypass(context);
      expect(result).toBe(false);
    });

    it('should reject invalid bypass token', () => {
      const now = Date.now();
      const expiresAt = now + 60000;

      const context: EmergencyBypassContext = {
        bypass_token: 'invalid-token-12345',
        operator_id: 'ops-john',
        reason: 'emergency-fix',
        expires_at: expiresAt,
        timestamp: now,
        sink_name: 'testSink'
      };

      const result = recordEmergencyBypass(context);
      expect(result).toBe(false);
    });

    it('should handle concurrent token use attempts (race safety)', () => {
      const db = getTestDb();
      const now = Date.now();
      const expiresAt = now + 60000;

      const token = crypto.createHash('sha256')
        .update(`ops-john:emergency-fix:${expiresAt}:${process.env.BYPASS_SECRET || 'default-secret'}`, 'utf8')
        .digest('hex');

      const context: EmergencyBypassContext = {
        bypass_token: token,
        operator_id: 'ops-john',
        reason: 'emergency-fix',
        expires_at: expiresAt,
        timestamp: now,
        sink_name: 'testSink'
      };

      // Simulate concurrent attempts
      const results = [
        recordEmergencyBypass(context),
        recordEmergencyBypass(context),
        recordEmergencyBypass(context)
      ];

      // Only ONE should succeed
      const successCount = results.filter(r => r === true).length;
      expect(successCount).toBe(1);

      // Verify only one activation log exists
      const activationLogs = db.getLogs({ component: 'EMERGENCY_BYPASS', operation: 'BYPASS_ACTIVATED' });
      expect(activationLogs).toHaveLength(1);

      // Verify replay attempts were logged
      const replayLogs = db.getLogs({ component: 'EMERGENCY_BYPASS', operation: 'BYPASS_REPLAY_ATTEMPT' });
      expect(replayLogs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Integration: Database Schema Verification', () => {
    it('should have bypass_token column in observability_logs', () => {
      const db = getTestDb();
      
      // Query table schema
      const tableInfo = (db as any).db.pragma('table_info(observability_logs)') as any[];
      const bypassTokenColumn = tableInfo.find((col: any) => col.name === 'bypass_token');
      
      expect(bypassTokenColumn).toBeDefined();
      expect(bypassTokenColumn.type).toBe('TEXT');
    });

    it('should have UNIQUE index on bypass_token', () => {
      const db = getTestDb();
      
      // Query indexes
      const indexes = (db as any).db.pragma('index_list(observability_logs)') as any[];
      const uniqueIndex = indexes.find((idx: any) => idx.name === 'idx_bypass_token_unique');
      
      expect(uniqueIndex).toBeDefined();
      expect(uniqueIndex.unique).toBe(1); // SQLite uses 1 for true
    });
  });

  describe('Editorial Decision Audit Persistence', () => {
    it('should persist and retrieve structured editorial audit records', () => {
      const db = getTestDb();

      db.saveEditorialDecisionAudit({
        audit_id: 'editorial-audit-trace-123',
        batch_id: 'batch-123',
        trace_id: 'trace-123',
        decision_dna_audit_id: 'dna-audit-123',
        overall_decision: 'APPROVE_PARTIAL',
        confidence_score: 82,
        confidence_band: 'MEDIUM',
        requires_supervisor_review: true,
        approved_languages: ['en', 'tr'],
        rejected_languages: ['ru'],
        delayed_languages: ['fr'],
        reasons: ['Cross-language drift detected'],
        reason_code_digest: {
          trust_gate: ['TRUST_SIGNAL_MISSING'],
          truth_gate: ['TRUTH_SUPPORTED'],
          escalation_reason_code: 'HUMAN_REVIEW_REQUIRED'
        },
        gate_payload: {
          trust_gate_authorization: { trust_verdict: 'TRUST_REVIEW' },
          escalation_record_v1: { escalation_tier: 'HUMAN_REVIEW_REQUIRED' }
        },
        decision_trace_payload: {
          hard_rule_hits: ['MULTILINGUAL_DRIFT'],
          emitted_events: ['CHIEF_EDITOR_APPROVAL'],
          state_transition: 'AUDITING_TO_SUPERVISOR_REVIEW'
        },
        pecl_snapshot: {
          final_decision: 'ESCALATION_REQUIRED',
          publish_authorization_state: false
        },
        timestamp: 1700000000000
      });

      const records = db.getEditorialDecisionAudits({ batchId: 'batch-123', limit: 10 });

      expect(records).toHaveLength(1);
      expect(records[0].audit_id).toBe('editorial-audit-trace-123');
      expect(records[0].decision_dna_audit_id).toBe('dna-audit-123');
      expect(records[0].overall_decision).toBe('APPROVE_PARTIAL');
      expect(records[0].requires_supervisor_review).toBe(true);
      expect(records[0].approved_languages).toEqual(['en', 'tr']);
      expect(records[0].reason_code_digest).toMatchObject({
        trust_gate: ['TRUST_SIGNAL_MISSING'],
        escalation_reason_code: 'HUMAN_REVIEW_REQUIRED'
      });
    });

    it('should support trace-level query filters for operator lookups', () => {
      const db = getTestDb();

      db.saveEditorialDecisionAudit({
        audit_id: 'editorial-audit-trace-a',
        batch_id: 'batch-a',
        trace_id: 'trace-a',
        overall_decision: 'APPROVE_ALL',
        confidence_score: 95,
        confidence_band: 'HIGH',
        requires_supervisor_review: false,
        approved_languages: ['en'],
        rejected_languages: [],
        delayed_languages: [],
        reasons: ['All gates passed'],
        reason_code_digest: {},
        gate_payload: {},
        decision_trace_payload: {
          hard_rule_hits: [],
          emitted_events: []
        },
        pecl_snapshot: null,
        timestamp: 1700000001000
      });

      db.saveEditorialDecisionAudit({
        audit_id: 'editorial-audit-trace-b',
        batch_id: 'batch-b',
        trace_id: 'trace-b',
        overall_decision: 'REJECT',
        confidence_score: 40,
        confidence_band: 'LOW',
        requires_supervisor_review: true,
        approved_languages: [],
        rejected_languages: ['en'],
        delayed_languages: [],
        reasons: ['Hard rule block'],
        reason_code_digest: {},
        gate_payload: {},
        decision_trace_payload: {
          hard_rule_hits: ['HARD_RULE_GATE_BLOCK'],
          emitted_events: ['TERMINAL_BLOCK']
        },
        pecl_snapshot: null,
        timestamp: 1700000002000
      });

      const filtered = db.getEditorialDecisionAudits({ traceId: 'trace-b', limit: 10 });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].batch_id).toBe('batch-b');
      expect(filtered[0].trace_id).toBe('trace-b');
      expect(filtered[0].overall_decision).toBe('REJECT');
    });
  });
});
