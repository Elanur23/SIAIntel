/**
 * SCHEMA VALIDATOR - SAFETY LAYER
 * Prevents duplicate schema injection and validates JSON-LD
 */

interface SchemaValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate JSON-LD schema structure
 */
export function validateSchema(schema: any): SchemaValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check for required @context
  if (!schema['@context']) {
    errors.push('Missing @context property')
  } else if (schema['@context'] !== 'https://schema.org') {
    warnings.push('Non-standard @context value')
  }

  // Check for required @type
  if (!schema['@type']) {
    errors.push('Missing @type property')
  }

  // Validate NewsArticle schema
  if (schema['@type'] === 'NewsArticle' || (Array.isArray(schema['@type']) && schema['@type'].includes('NewsArticle'))) {
    if (!schema.headline) {
      errors.push('NewsArticle missing required headline')
    }
    if (!schema.datePublished) {
      errors.push('NewsArticle missing required datePublished')
    }
    if (!schema.author) {
      errors.push('NewsArticle missing required author')
    }
    if (!schema.publisher) {
      errors.push('NewsArticle missing required publisher')
    }
  }

  // Validate ClaimReview schema
  if (schema['@type'] === 'ClaimReview') {
    if (!schema.claimReviewed) {
      errors.push('ClaimReview missing required claimReviewed')
    }
    if (!schema.reviewRating) {
      errors.push('ClaimReview missing required reviewRating')
    }
    if (!schema.itemReviewed) {
      errors.push('ClaimReview missing required itemReviewed')
    }
  }

  // Check for circular references
  try {
    JSON.stringify(schema)
  } catch (e) {
    errors.push('Schema contains circular references')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Detect duplicate schema types in page
 */
export function detectDuplicateSchemas(existingSchemas: any[], newSchema: any): boolean {
  const newType = Array.isArray(newSchema['@type']) ? newSchema['@type'] : [newSchema['@type']]
  
  for (const existing of existingSchemas) {
    const existingType = Array.isArray(existing['@type']) ? existing['@type'] : [existing['@type']]
    
    // Check for type overlap
    const hasOverlap = newType.some(t => existingType.includes(t))
    if (hasOverlap) {
      return true
    }
  }
  
  return false
}

/**
 * Sanitize schema to prevent XSS
 */
export function sanitizeSchema(schema: any): any {
  // Convert to JSON and back to remove functions and undefined values
  const sanitized = JSON.parse(JSON.stringify(schema))
  
  // Remove any potentially dangerous properties
  const dangerousKeys = ['__proto__', 'constructor', 'prototype']
  
  function cleanObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj
    }
    
    if (Array.isArray(obj)) {
      return obj.map(cleanObject)
    }
    
    const cleaned: any = {}
    for (const key in obj) {
      if (!dangerousKeys.includes(key)) {
        cleaned[key] = cleanObject(obj[key])
      }
    }
    
    return cleaned
  }
  
  return cleanObject(sanitized)
}

/**
 * Validate and prepare schema for injection
 */
export function prepareSchemaForInjection(schema: any): { schema: any; isValid: boolean; errors: string[] } {
  // Sanitize first
  const sanitized = sanitizeSchema(schema)
  
  // Validate
  const validation = validateSchema(sanitized)
  
  if (!validation.isValid) {
    console.error('[Schema Validator] Validation failed:', validation.errors)
    return {
      schema: null,
      isValid: false,
      errors: validation.errors
    }
  }
  
  if (validation.warnings.length > 0) {
    console.warn('[Schema Validator] Warnings:', validation.warnings)
  }
  
  return {
    schema: sanitized,
    isValid: true,
    errors: []
  }
}
