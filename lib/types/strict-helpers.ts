/**
 * STRICT MODE HELPERS - Common patterns for TypeScript strict mode
 * 
 * Utilities to handle strict null checks and undefined values
 */

/**
 * Non-null assertion with runtime check
 * Use this when you're certain a value exists but TypeScript can't infer it
 */
export function assertExists<T>(
  value: T | null | undefined,
  errorMessage: string = 'Value does not exist'
): T {
  if (value === null || value === undefined) {
    throw new Error(errorMessage)
  }
  return value
}

/**
 * Safe property access with default
 */
export function getProperty<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  defaultValue: T[K]
): T[K] {
  return obj?.[key] ?? defaultValue
}

/**
 * Safe array element access
 */
export function getArrayElement<T>(
  array: T[],
  index: number,
  defaultValue: T
): T {
  const element = array[index]
  return element !== undefined ? element : defaultValue
}

/**
 * Safe record access with fallback
 */
export function getRecordValue<K extends string | number | symbol, V>(
  record: Record<K, V>,
  key: K,
  fallbackKey: K
): V {
  const value = record[key]
  if (value !== undefined) return value
  
  const fallback = record[fallbackKey]
  if (fallback !== undefined) return fallback
  
  throw new Error(`No value found for key ${String(key)} or fallback ${String(fallbackKey)}`)
}

/**
 * Safe partial record access with default
 */
export function getPartialRecordValue<K extends string | number | symbol, V>(
  record: Partial<Record<K, V>>,
  key: K,
  defaultValue: V
): V {
  const value = record[key]
  return value !== undefined ? value : defaultValue
}

/**
 * Ensure value is defined for rendering
 */
export function ensureDefined<T>(value: T | undefined, fallback: T): T {
  return value !== undefined ? value : fallback
}

/**
 * Type guard for checking if object has property
 */
export function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj
}

/**
 * Safe function call - only calls if function is defined
 */
export function safeCall<T extends any[], R>(
  fn: ((...args: T) => R) | undefined,
  ...args: T
): R | undefined {
  return fn?.(...args)
}

/**
 * Coalesce multiple values, return first defined
 */
export function coalesce<T>(...values: (T | undefined)[]): T | undefined {
  return values.find(v => v !== undefined)
}

/**
 * Assert all code paths return (for components)
 */
export function unreachable(message: string = 'Unreachable code'): never {
  throw new Error(message)
}
