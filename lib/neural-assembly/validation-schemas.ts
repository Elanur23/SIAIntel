/**
 * INPUT VALIDATION SCHEMAS
 * Zod schemas for Neural Assembly API endpoints
 * 
 * @version 1.0.0 (Phase 2 Pre-Gap #4)
 * @author SIA Intelligence Systems - Security Team
 */

import { z } from 'zod'

// ============================================================================
// ORCHESTRATE ENDPOINT
// ============================================================================

export const SourceSchema = z.object({
  url: z.string().url().max(2048),
  content: z.string().min(10).max(50000), // Max 50KB per source
  credibility_score: z.number().min(0).max(1).optional().default(0.8)
})

export const OrchestrateRequestSchema = z.object({
  sources: z.array(SourceSchema)
    .min(1, 'At least one source required')
    .max(10, 'Maximum 10 sources allowed'), // Prevent memory exhaustion
  priority: z.enum(['breaking', 'standard', 'evergreen']).optional().default('standard'),
  category: z.string().max(100).optional(),
  max_budget: z.number().min(0).max(10).optional().default(5) // Max $10 per request
})

export type OrchestrateRequest = z.infer<typeof OrchestrateRequestSchema>

// ============================================================================
// LOGS ENDPOINT
// ============================================================================

export const LogsQuerySchema = z.object({
  level: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']).optional(),
  component: z.string().max(100).optional(),
  operation: z.string().max(100).optional(),
  trace_id: z.string().max(200).optional(),
  batch_id: z.string().max(200).optional(),
  provider: z.string().max(100).optional(),
  start_time: z.string().regex(/^\d+$/).optional().transform(val => val ? Number(val) : undefined),
  end_time: z.string().regex(/^\d+$/).optional().transform(val => val ? Number(val) : undefined),
  limit: z.string().regex(/^\d+$/).optional().default('100').transform(val => {
    const num = Number(val)
    return Math.min(Math.max(num, 1), 1000)
  }),
  source: z.enum(['memory', 'database']).optional().default('database')
})

export type LogsQuery = z.infer<typeof LogsQuerySchema>

// ============================================================================
// METRICS ENDPOINT
// ============================================================================

export const MetricsQuerySchema = z.object({
  format: z.enum(['json', 'prometheus']).optional().default('json')
})

export type MetricsQuery = z.infer<typeof MetricsQuerySchema>

// ============================================================================
// STATUS ENDPOINT
// ============================================================================

export const StatusQuerySchema = z.object({
  format: z.enum(['full', 'summary']).optional().default('full'),
  batch_id: z.string().max(200).optional(),
  trace_id: z.string().max(200).optional(),
  audit_limit: z.string().regex(/^\d+$/).optional().default('20').transform(val => {
    const num = Number(val)
    return Math.min(Math.max(num, 1), 200)
  })
})

export type StatusQuery = z.infer<typeof StatusQuerySchema>

// ============================================================================
// CLEANUP ENDPOINTS
// ============================================================================

export const CleanupQuerySchema = z.object({
  retention_days: z.string().regex(/^\d+$/).optional().default('7').transform(val => {
    const num = Number(val)
    return Math.min(Math.max(num, 1), 365)
  })
})

export type CleanupQuery = z.infer<typeof CleanupQuerySchema>
