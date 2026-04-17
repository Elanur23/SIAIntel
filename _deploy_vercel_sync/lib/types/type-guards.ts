/**
 * TYPE GUARDS & UTILITIES - TypeScript Strict Mode Helpers
 * 
 * Common type guards and utilities for strict null checking
 */

/**
 * Check if value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Assert value is defined, throw if not
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  if (!isDefined(value)) {
    throw new Error(message || 'Value is null or undefined')
  }
}

/**
 * Get value or default
 */
export function getOrDefault<T>(value: T | null | undefined, defaultValue: T): T {
  return isDefined(value) ? value : defaultValue
}

/**
 * Safe array index access
 */
export function safeArrayAccess<T>(
  array: T[],
  index: number
): T | undefined {
  return array[index]
}

/**
 * Safe array index access with default
 */
export function safeArrayAccessWithDefault<T>(
  array: T[],
  index: number,
  defaultValue: T
): T {
  const value = array[index]
  return isDefined(value) ? value : defaultValue
}

/**
 * Safe object property access
 */
export function safePropertyAccess<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K
): T[K] | undefined {
  return obj?.[key]
}

/**
 * Safe nested property access
 */
export function safeNestedAccess<T>(
  obj: any,
  path: string
): T | undefined {
  const keys = path.split('.')
  let current = obj
  
  for (const key of keys) {
    if (!isDefined(current)) return undefined
    current = current[key]
  }
  
  return current as T | undefined
}

/**
 * Type guard for non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

/**
 * Type guard for non-empty array
 */
export function isNonEmptyArray<T>(value: T[] | null | undefined): value is [T, ...T[]] {
  return Array.isArray(value) && value.length > 0
}

/**
 * Ensure function returns value (for components)
 */
export function ensureReturn<T>(value: T | undefined, fallback: T): T {
  return isDefined(value) ? value : fallback
}
