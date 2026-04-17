/**
 * API INPUT VALIDATION SCHEMAS
 *
 * Centralized Zod schemas for API request validation
 * Prevents injection attacks and ensures data integrity
 */

import { z } from 'zod'

// ============================================
// COMMON SCHEMAS
// ============================================

export const idSchema = z.string().cuid()

export const emailSchema = z.string().email().max(255)

export const urlSchema = z.string().url().max(2048)

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9-]+$/)
  .min(1)
  .max(200)

export const languageSchema = z.enum(['en', 'tr', 'de', 'fr', 'es', 'ru', 'ja', 'zh', 'pt-br'])

export const regionSchema = z.enum(['US', 'TR', 'DE', 'FR', 'ES', 'RU', 'AE', 'JP', 'CN', 'GLOBAL'])

export const categorySchema = z.enum([
  'MARKET',
  'CRYPTO',
  'FOREX',
  'STOCKS',
  'COMMODITIES',
  'MACRO',
  'TECH',
  'GENERAL',
])

export const statusSchema = z.enum(['draft', 'scheduled', 'published', 'archived'])

// ============================================
// ARTICLE SCHEMAS
// ============================================

export const articleTitleSchema = z.string().min(10).max(200).trim()

export const articleContentSchema = z.string().min(100).max(50000).trim()

export const articleSummarySchema = z.string().min(50).max(500).trim()

export const createArticleSchema = z.object({
  // Required fields
  titleEn: articleTitleSchema,
  contentEn: articleContentSchema,

  // Optional multilingual fields
  titleTr: articleTitleSchema.optional(),
  titleDe: articleTitleSchema.optional(),
  titleEs: articleTitleSchema.optional(),
  titleFr: articleTitleSchema.optional(),
  titleRu: articleTitleSchema.optional(),
  titleAr: articleTitleSchema.optional(),
  titleJp: articleTitleSchema.optional(),
  titleZh: articleTitleSchema.optional(),

  contentTr: articleContentSchema.optional(),
  contentDe: articleContentSchema.optional(),
  contentEs: articleContentSchema.optional(),
  contentFr: articleContentSchema.optional(),
  contentRu: articleContentSchema.optional(),
  contentAr: articleContentSchema.optional(),
  contentJp: articleContentSchema.optional(),
  contentZh: articleContentSchema.optional(),

  summaryEn: articleSummarySchema.optional(),
  summaryTr: articleSummarySchema.optional(),

  // Metadata
  category: categorySchema.default('GENERAL'),
  region: regionSchema.default('GLOBAL'),
  status: statusSchema.default('published'),

  // Optional fields
  imageUrl: urlSchema.optional(),
  source: z.string().max(100).optional(),
  sentiment: z.enum(['bullish', 'bearish', 'neutral']).optional(),
  confidence: z.number().int().min(0).max(100).default(90),
  marketImpact: z.number().int().min(1).max(10).default(5),
  publishedAt: z.string().datetime().optional(),

  // Force save flag (for duplicates)
  forceSave: z.boolean().default(false),
})

export const updateArticleSchema = createArticleSchema.partial().extend({
  id: idSchema,
})

// ============================================
// COMMENT SCHEMAS
// ============================================

export const createCommentSchema = z.object({
  articleId: idSchema,
  content: z.string().min(10).max(1000).trim(),
  authorName: z.string().min(2).max(100).trim().default('Anonymous Analyst'),
  lang: languageSchema.default('en'),
})

// ============================================
// USER SCHEMAS
// ============================================

export const usernameSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')

export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

export const createUserSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  role: z.enum(['super_admin', 'admin', 'editor', 'analyst', 'viewer']),
})

export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1), // Don't validate on login (already hashed)
})

// ============================================
// DISTRIBUTION SCHEMAS
// ============================================

export const platformSchema = z.enum(['twitter', 'telegram', 'linkedin', 'facebook'])

export const createDistributionJobSchema = z.object({
  articleId: idSchema,
  platforms: z.array(platformSchema).min(1),
  languages: z.array(languageSchema).min(1),
  mode: z.enum(['test', 'live']).default('test'),
  scheduledAt: z.string().datetime().optional(),
})

// ============================================
// SEO SCHEMAS
// ============================================

export const generateSchemaRequestSchema = z.object({
  title: articleTitleSchema,
  content: articleContentSchema,
  imageUrl: urlSchema.optional(),
  category: categorySchema.optional(),
  author: z.string().max(100).optional(),
  publishedAt: z.string().datetime().optional(),
})

// ============================================
// UPLOAD SCHEMAS
// ============================================

export const uploadFileSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().default(5 * 1024 * 1024), // 5MB default
  allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
})

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate request body against schema
 * Returns parsed data or throws validation error
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
      throw new ValidationError(messages.join(', '))
    }
    throw error
  }
}

/**
 * Validate request body and return result
 * Returns { success: true, data } or { success: false, errors }
 */
export function safeValidateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
  return { success: false, errors }
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Sanitize HTML content (basic)
 * For full sanitization, use DOMPurify
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
}

/**
 * Sanitize SQL input (basic)
 * Prisma handles this automatically, but useful for raw queries
 */
export function sanitizeSql(input: string): string {
  return input
    .replace(/['";\\]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol')
    }
    return parsed.toString()
  } catch {
    throw new ValidationError('Invalid URL')
  }
}
