/**
 * ADMIN ACTION VALIDATION - Server-Side Schema Validation
 * 
 * Strict validation for all admin operations using Zod
 * No client-side trust - all inputs validated server-side
 */

import { z } from 'zod'

/**
 * Publish content validation schema
 */
export const publishContentSchema = z.object({
  articleId: z.string().min(1, 'Article ID is required'),
  confirmPublish: z.boolean().refine(val => val === true, {
    message: 'Publish confirmation required',
  }),
  publishDate: z.string().datetime().optional(),
  notifySubscribers: z.boolean().optional(),
})

export type PublishContentInput = z.infer<typeof publishContentSchema>

/**
 * Delete content validation schema
 */
export const deleteContentSchema = z.object({
  articleId: z.string().min(1, 'Article ID is required'),
  confirmDelete: z.boolean().refine(val => val === true, {
    message: 'Delete confirmation required',
  }),
  reason: z.string().min(3, 'Deletion reason required (min 3 characters)'),
})

export type DeleteContentInput = z.infer<typeof deleteContentSchema>

/**
 * Bulk delete validation schema
 */
export const bulkDeleteSchema = z.object({
  articleIds: z.array(z.string()).min(1, 'At least one article ID required').max(50, 'Maximum 50 articles per bulk delete'),
  confirmBulkDelete: z.boolean().refine(val => val === true, {
    message: 'Bulk delete confirmation required',
  }),
  reason: z.string().min(3, 'Deletion reason required (min 3 characters)'),
})

export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>

/**
 * Update settings validation schema
 */
export const updateSettingsSchema = z.object({
  settingKey: z.string().min(1, 'Setting key is required'),
  settingValue: z.union([z.string(), z.number(), z.boolean()]),
  confirmUpdate: z.boolean().refine(val => val === true, {
    message: 'Settings update confirmation required',
  }),
})

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>

/**
 * Security settings validation schema
 */
export const securitySettingsSchema = z.object({
  action: z.enum(['change_password', 'update_session_timeout', 'enable_2fa', 'disable_2fa']),
  confirmSecurityChange: z.boolean().refine(val => val === true, {
    message: 'Security change confirmation required',
  }),
  currentPassword: z.string().min(1, 'Current password required for security changes'),
  newValue: z.string().optional(),
})

export type SecuritySettingsInput = z.infer<typeof securitySettingsSchema>

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: z.ZodError
  message?: string
}

/**
 * Validate input against schema
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): ValidationResult<T> {
  try {
    const data = schema.parse(input)
    return {
      success: true,
      data,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error,
        message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      }
    }
    return {
      success: false,
      message: 'Validation failed',
    }
  }
}

/**
 * Sanitize string input (basic XSS prevention)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Validate and sanitize article ID
 */
export function validateArticleId(articleId: unknown): string | null {
  if (typeof articleId !== 'string') return null
  if (articleId.length === 0 || articleId.length > 100) return null
  // Only allow alphanumeric, hyphens, and underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(articleId)) return null
  return articleId
}

/**
 * Validate array of article IDs
 */
export function validateArticleIds(articleIds: unknown): string[] | null {
  if (!Array.isArray(articleIds)) return null
  if (articleIds.length === 0 || articleIds.length > 50) return null
  
  const validated: string[] = []
  for (const id of articleIds) {
    const validId = validateArticleId(id)
    if (!validId) return null
    validated.push(validId)
  }
  
  return validated
}

/**
 * Check if request contains unexpected fields
 */
export function hasUnexpectedFields(
  input: Record<string, any>,
  allowedFields: string[]
): { hasUnexpected: boolean; unexpectedFields: string[] } {
  const inputFields = Object.keys(input)
  const unexpectedFields = inputFields.filter(field => !allowedFields.includes(field))
  
  return {
    hasUnexpected: unexpectedFields.length > 0,
    unexpectedFields,
  }
}
