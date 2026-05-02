/**
 * PURE PRIMITIVE GUARDS ONLY.
 * This module must not validate full assessments, create validation results, build objects,
 * mutate input, persist, register, promote, deploy, or authorize anything.
 *
 * This file must:
 * - export only pure guard functions
 * - be synchronous
 * - be deterministic
 * - be non-mutating
 * - accept unknown input
 * - return only boolean or TypeScript type predicates
 * - contain no async, Promise, I/O, persistence/storage, network/API/database/provider calls
 * - contain no UI/handler/adapter imports
 * - contain no validation result object creation
 * - contain no error/warning object creation
 * - contain no preview/assessment object creation
 * - contain no builder/factory/generator
 */

/**
 * Guard: isPlainRecord
 * Returns true only if value is a plain object (not null, not array).
 */
export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Guard: hasOwnStringField
 * Returns true only if value is a plain record, has own property key, and field is string.
 */
export function hasOwnStringField<K extends string>(
  value: unknown,
  key: K
): value is Record<K, string> {
  if (!isPlainRecord(value)) return false;
  if (!Object.prototype.hasOwnProperty.call(value, key)) return false;
  return typeof (value as Record<string, unknown>)[key] === 'string';
}

/**
 * Guard: hasOwnBooleanField
 * Returns true only if value is a plain record, has own property key, and field is boolean.
 */
export function hasOwnBooleanField<K extends string>(
  value: unknown,
  key: K
): value is Record<K, boolean> {
  if (!isPlainRecord(value)) return false;
  if (!Object.prototype.hasOwnProperty.call(value, key)) return false;
  return typeof (value as Record<string, unknown>)[key] === 'boolean';
}

/**
 * Guard: hasOwnNumberField
 * Returns true only if value is a plain record, has own property key, field is number, and Number.isFinite(field).
 */
export function hasOwnNumberField<K extends string>(
  value: unknown,
  key: K
): value is Record<K, number> {
  if (!isPlainRecord(value)) return false;
  if (!Object.prototype.hasOwnProperty.call(value, key)) return false;
  const field = (value as Record<string, unknown>)[key];
  return typeof field === 'number' && Number.isFinite(field);
}

/**
 * Guard: hasOwnLiteralField
 * Returns true only if value is a plain record, has own property key, and field strictly equals literal.
 */
export function hasOwnLiteralField<K extends string, L extends string | number | boolean>(
  value: unknown,
  key: K,
  literal: L
): value is Record<K, L> {
  if (!isPlainRecord(value)) return false;
  if (!Object.prototype.hasOwnProperty.call(value, key)) return false;
  return (value as Record<string, unknown>)[key] === literal;
}

/**
 * Guard: isReadonlyStringArray
 * Returns true only if Array.isArray(value) and every item is string.
 */
export function isReadonlyStringArray(value: unknown): value is readonly string[] {
  if (!Array.isArray(value)) return false;
  return value.every((item) => typeof item === 'string');
}

/**
 * Guard: hasReadonlyStringArrayField
 * Returns true only if value is a plain record, has own property key, and field is readonly string array-like.
 */
export function hasReadonlyStringArrayField<K extends string>(
  value: unknown,
  key: K
): value is Record<K, readonly string[]> {
  if (!isPlainRecord(value)) return false;
  if (!Object.prototype.hasOwnProperty.call(value, key)) return false;
  const field = (value as Record<string, unknown>)[key];
  return isReadonlyStringArray(field);
}

/**
 * Guard: isNonEmptyString
 * Returns true only if typeof value === "string" and value.length > 0.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Guard: isSafeStringLength
 * Returns true only if value is string, maxLength is finite non-negative integer, and value.length <= maxLength.
 */
export function isSafeStringLength(value: unknown, maxLength: number): value is string {
  if (typeof value !== 'string') return false;
  if (!Number.isInteger(maxLength) || !Number.isFinite(maxLength) || maxLength < 0) return false;
  return value.length <= maxLength;
}

/**
 * Guard: isIso8601LikeString
 * Returns true only if value is string and matches a conservative ISO-8601-like regex.
 * Uses only regex matching, no Date constructor or parsing.
 */
export function isIso8601LikeString(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  // Conservative ISO-8601-like pattern: YYYY-MM-DDTHH:MM:SSZ or with timezone offset
  const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;
  return iso8601Pattern.test(value);
}
