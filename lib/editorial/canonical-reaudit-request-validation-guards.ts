/**
 * Canonical Re-Audit Request Validation Guards
 *
 * Pure guard functions for type checking and field validation.
 * No side effects — only boolean returns.
 */

/**
 * Checks if input is a plain object (not null, not array, not primitive).
 */
export function isPlainRecord(input: unknown): input is Record<string, any> {
  return (
    input !== null &&
    typeof input === "object" &&
    !Array.isArray(input) &&
    Object.getPrototypeOf(input) === Object.prototype
  );
}

/**
 * Checks if object has a string field with the given name.
 */
export function hasOwnStringField(
  obj: Record<string, any>,
  fieldName: string
): boolean {
  return typeof obj[fieldName] === "string";
}

/**
 * Checks if object has a boolean field with the given name.
 */
export function hasOwnBooleanField(
  obj: Record<string, any>,
  fieldName: string
): boolean {
  return typeof obj[fieldName] === "boolean";
}

/**
 * Checks if object has a field with the given name and value.
 */
export function hasOwnLiteralField(
  obj: Record<string, any>,
  fieldName: string,
  expectedValue: any
): boolean {
  return obj[fieldName] === expectedValue;
}

/**
 * Checks if a string is a valid ISO 8601 timestamp.
 */
export function isValidISOTimestamp(value: string): boolean {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return !isNaN(date.getTime()) && date.toISOString() === value;
}

/**
 * Checks if object has a snapshot identity structure.
 * Snapshot must have: contentHash (string), ledgerSequence (number), source (literal "canonical-vault")
 */
export function hasValidSnapshotStructure(
  obj: Record<string, any>
): boolean {
  const snapshot = obj.canonicalSnapshot;
  
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return false;
  }

  const snap = snapshot as Record<string, any>;

  // Required fields
  if (typeof snap.contentHash !== "string") return false;
  if (typeof snap.ledgerSequence !== "number") return false;
  if (snap.source !== "canonical-vault") return false;
  if (typeof snap.capturedAt !== "string") return false;

  // capturedAt must be valid ISO timestamp
  if (!isValidISOTimestamp(snap.capturedAt)) return false;

  return true;
}
