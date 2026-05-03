# Validator Fields Checklist

**Validator**: `validateCanonicalReAuditRequest`  
**Domain**: Canonical Re-Audit Request  
**Date**: 2026-05-03

---

## Fields to Check

### ✅ Required String Fields

| Field | Type | Constraint | Error Code |
|-------|------|-----------|-----------|
| `articleId` | string | Non-empty | MISSING_REQUIRED_FIELD |
| `operatorId` | string | Non-empty | MISSING_REQUIRED_FIELD |
| `requestedAt` | string | Valid ISO 8601 timestamp | INVALID_TIMESTAMP |

**Validation Logic**:
```typescript
// articleId
if (!hasOwnStringField(record, "articleId")) {
  errors.push({
    code: "MISSING_REQUIRED_FIELD",
    fieldPath: ["articleId"],
    message: "articleId is required and must be a string",
    remediationHint: "Provide a non-empty string for articleId"
  });
}

// operatorId
if (!hasOwnStringField(record, "operatorId")) {
  errors.push({
    code: "MISSING_REQUIRED_FIELD",
    fieldPath: ["operatorId"],
    message: "operatorId is required and must be a string",
    remediationHint: "Provide a non-empty string for operatorId"
  });
}

// requestedAt
if (!hasOwnStringField(record, "requestedAt")) {
  errors.push({
    code: "MISSING_REQUIRED_FIELD",
    fieldPath: ["requestedAt"],
    message: "requestedAt is required and must be a string",
    remediationHint: "Provide an ISO 8601 timestamp for requestedAt"
  });
} else if (!isValidISOTimestamp(record.requestedAt)) {
  errors.push({
    code: "INVALID_TIMESTAMP",
    fieldPath: ["requestedAt"],
    message: "requestedAt must be a valid ISO 8601 timestamp",
    remediationHint: "Use new Date().toISOString() format"
  });
}
```

---

### ✅ Canonical Snapshot Structure

| Field | Type | Constraint | Error Code |
|-------|------|-----------|-----------|
| `canonicalSnapshot` | object | Valid snapshot structure | INVALID_SNAPSHOT_STRUCTURE |
| `canonicalSnapshot.contentHash` | string | Required | INVALID_SNAPSHOT_STRUCTURE |
| `canonicalSnapshot.ledgerSequence` | number | Required | INVALID_SNAPSHOT_STRUCTURE |
| `canonicalSnapshot.source` | string | Must be "canonical-vault" | INVALID_SNAPSHOT_STRUCTURE |
| `canonicalSnapshot.capturedAt` | string | Valid ISO 8601 timestamp | INVALID_SNAPSHOT_STRUCTURE |
| `canonicalSnapshot.promotionId` | string | Optional | N/A |

**Validation Logic**:
```typescript
// Snapshot structure
if (!hasValidSnapshotStructure(record)) {
  errors.push({
    code: "INVALID_SNAPSHOT_STRUCTURE",
    fieldPath: ["canonicalSnapshot"],
    message: "canonicalSnapshot must have contentHash (string), ledgerSequence (number), source ('canonical-vault'), and capturedAt (ISO timestamp)",
    remediationHint: "Provide a valid CanonicalReAuditSnapshotIdentity object"
  });
}

// Guard function implementation:
export function hasValidSnapshotStructure(obj: Record<string, any>): boolean {
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
```

---

### ✅ Required Boolean Flags

| Field | Type | Required Value | Error Code |
|-------|------|----------------|-----------|
| `manualTrigger` | boolean | `true` | INVALID_FLAG_VALUE |
| `memoryOnly` | boolean | `true` | INVALID_FLAG_VALUE |
| `deployUnlockAllowed` | boolean | `false` | INVALID_FLAG_VALUE |
| `backendPersistenceAllowed` | boolean | `false` | INVALID_FLAG_VALUE |
| `sessionAuditInheritanceAllowed` | boolean | `false` | INVALID_FLAG_VALUE |

**Validation Logic**:
```typescript
// manualTrigger
if (!hasOwnBooleanField(record, "manualTrigger")) {
  errors.push({
    code: "MISSING_REQUIRED_FIELD",
    fieldPath: ["manualTrigger"],
    message: "manualTrigger is required and must be a boolean",
    remediationHint: "Set manualTrigger to true"
  });
} else if (!hasOwnLiteralField(record, "manualTrigger", true)) {
  errors.push({
    code: "INVALID_FLAG_VALUE",
    fieldPath: ["manualTrigger"],
    message: "manualTrigger must be true",
    remediationHint: "Set manualTrigger to true"
  });
}

// memoryOnly
if (!hasOwnBooleanField(record, "memoryOnly")) {
  errors.push({
    code: "MISSING_REQUIRED_FIELD",
    fieldPath: ["memoryOnly"],
    message: "memoryOnly is required and must be a boolean",
    remediationHint: "Set memoryOnly to true"
  });
} else if (!hasOwnLiteralField(record, "memoryOnly", true)) {
  errors.push({
    code: "INVALID_FLAG_VALUE",
    fieldPath: ["memoryOnly"],
    message: "memoryOnly must be true",
    remediationHint: "Set memoryOnly to true"
  });
}

// deployUnlockAllowed
if (!hasOwnBooleanField(record, "deployUnlockAllowed")) {
  errors.push({
    code: "MISSING_REQUIRED_FIELD",
    fieldPath: ["deployUnlockAllowed"],
    message: "deployUnlockAllowed is required and must be a boolean",
    remediationHint: "Set deployUnlockAllowed to false"
  });
} else if (!hasOwnLiteralField(record, "deployUnlockAllowed", false)) {
  errors.push({
    code: "INVALID_FLAG_VALUE",
    fieldPath: ["deployUnlockAllowed"],
    message: "deployUnlockAllowed must be false",
    remediationHint: "Set deployUnlockAllowed to false"
  });
}

// backendPersistenceAllowed
if (!hasOwnBooleanField(record, "backendPersistenceAllowed")) {
  errors.push({
    code: "MISSING_REQUIRED_FIELD",
    fieldPath: ["backendPersistenceAllowed"],
    message: "backendPersistenceAllowed is required and must be a boolean",
    remediationHint: "Set backendPersistenceAllowed to false"
  });
} else if (!hasOwnLiteralField(record, "backendPersistenceAllowed", false)) {
  errors.push({
    code: "INVALID_FLAG_VALUE",
    fieldPath: ["backendPersistenceAllowed"],
    message: "backendPersistenceAllowed must be false",
    remediationHint: "Set backendPersistenceAllowed to false"
  });
}

// sessionAuditInheritanceAllowed
if (!hasOwnBooleanField(record, "sessionAuditInheritanceAllowed")) {
  errors.push({
    code: "MISSING_REQUIRED_FIELD",
    fieldPath: ["sessionAuditInheritanceAllowed"],
    message: "sessionAuditInheritanceAllowed is required and must be a boolean",
    remediationHint: "Set sessionAuditInheritanceAllowed to false"
  });
} else if (!hasOwnLiteralField(record, "sessionAuditInheritanceAllowed", false)) {
  errors.push({
    code: "INVALID_FLAG_VALUE",
    fieldPath: ["sessionAuditInheritanceAllowed"],
    message: "sessionAuditInheritanceAllowed must be false",
    remediationHint: "Set sessionAuditInheritanceAllowed to false"
  });
}
```

---

### ✅ Optional Fields

| Field | Type | Constraint | Error Code |
|-------|------|-----------|-----------|
| `promotionArchiveId` | string | Optional, if present must be string | INVALID_TYPE |
| `promotionId` | string | Optional, if present must be string | INVALID_TYPE |

**Validation Logic**:
```typescript
// promotionArchiveId
if ("promotionArchiveId" in record && record.promotionArchiveId !== undefined) {
  if (typeof record.promotionArchiveId !== "string") {
    errors.push({
      code: "INVALID_TYPE",
      fieldPath: ["promotionArchiveId"],
      message: "promotionArchiveId must be a string if provided",
      remediationHint: "Provide a string or omit the field"
    });
  }
}

// promotionId
if ("promotionId" in record && record.promotionId !== undefined) {
  if (typeof record.promotionId !== "string") {
    errors.push({
      code: "INVALID_TYPE",
      fieldPath: ["promotionId"],
      message: "promotionId must be a string if provided",
      remediationHint: "Provide a string or omit the field"
    });
  }
}
```

---

## Guard Functions

### `isPlainRecord(input: unknown): boolean`

Checks if input is a plain object (not null, not array, not primitive).

```typescript
export function isPlainRecord(input: unknown): input is Record<string, any> {
  return (
    input !== null &&
    typeof input === "object" &&
    !Array.isArray(input) &&
    Object.getPrototypeOf(input) === Object.prototype
  );
}
```

**Usage**: Root input check (fail-fast)

---

### `hasOwnStringField(obj: Record<string, any>, fieldName: string): boolean`

Checks if object has a string field with the given name.

```typescript
export function hasOwnStringField(
  obj: Record<string, any>,
  fieldName: string
): boolean {
  return typeof obj[fieldName] === "string";
}
```

**Usage**: Validate string fields (articleId, operatorId, requestedAt)

---

### `hasOwnBooleanField(obj: Record<string, any>, fieldName: string): boolean`

Checks if object has a boolean field with the given name.

```typescript
export function hasOwnBooleanField(
  obj: Record<string, any>,
  fieldName: string
): boolean {
  return typeof obj[fieldName] === "boolean";
}
```

**Usage**: Validate boolean fields (manualTrigger, memoryOnly, etc.)

---

### `hasOwnLiteralField(obj: Record<string, any>, fieldName: string, expectedValue: any): boolean`

Checks if object has a field with the given name and exact value.

```typescript
export function hasOwnLiteralField(
  obj: Record<string, any>,
  fieldName: string,
  expectedValue: any
): boolean {
  return obj[fieldName] === expectedValue;
}
```

**Usage**: Validate flag values (manualTrigger === true, deployUnlockAllowed === false)

---

### `isValidISOTimestamp(value: string): boolean`

Checks if a string is a valid ISO 8601 timestamp.

```typescript
export function isValidISOTimestamp(value: string): boolean {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return !isNaN(date.getTime()) && date.toISOString() === value;
}
```

**Usage**: Validate timestamp fields (requestedAt, canonicalSnapshot.capturedAt)

---

### `hasValidSnapshotStructure(obj: Record<string, any>): boolean`

Checks if object has a valid snapshot identity structure.

```typescript
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
```

**Usage**: Validate snapshot structure

---

## Validation Order

1. **Root Input Check (Fail-Fast)**
   - `isPlainRecord(input)` → if false, return BLOCKED immediately

2. **Required String Fields (Collect All Errors)**
   - `hasOwnStringField(record, "articleId")`
   - `hasOwnStringField(record, "operatorId")`
   - `hasOwnStringField(record, "requestedAt")`
   - `isValidISOTimestamp(record.requestedAt)`

3. **Canonical Snapshot Structure (Collect All Errors)**
   - `hasValidSnapshotStructure(record)`

4. **Required Boolean Flags (Collect All Errors)**
   - `hasOwnBooleanField(record, "manualTrigger")` + `hasOwnLiteralField(record, "manualTrigger", true)`
   - `hasOwnBooleanField(record, "memoryOnly")` + `hasOwnLiteralField(record, "memoryOnly", true)`
   - `hasOwnBooleanField(record, "deployUnlockAllowed")` + `hasOwnLiteralField(record, "deployUnlockAllowed", false)`
   - `hasOwnBooleanField(record, "backendPersistenceAllowed")` + `hasOwnLiteralField(record, "backendPersistenceAllowed", false)`
   - `hasOwnBooleanField(record, "sessionAuditInheritanceAllowed")` + `hasOwnLiteralField(record, "sessionAuditInheritanceAllowed", false)`

5. **Optional Fields (Collect All Errors)**
   - `promotionArchiveId` - if present, must be string
   - `promotionId` - if present, must be string

---

## Error Codes Reference

| Code | Meaning | When Used |
|------|---------|-----------|
| `MISSING_REQUIRED_FIELD` | Required field missing or wrong type | articleId, operatorId, requestedAt, flags |
| `INVALID_TYPE` | Field has wrong type | promotionId, promotionArchiveId |
| `INVALID_SNAPSHOT_STRUCTURE` | Snapshot structure invalid | canonicalSnapshot |
| `INVALID_FLAG_VALUE` | Flag has wrong value | manualTrigger, memoryOnly, deployUnlockAllowed, etc. |
| `INVALID_TIMESTAMP` | Timestamp not valid ISO 8601 | requestedAt, canonicalSnapshot.capturedAt |

---

## Summary

**Total Fields to Check**: 11 required + 2 optional = 13 fields

**Required Fields**:
- 3 string fields (articleId, operatorId, requestedAt)
- 1 snapshot structure (canonicalSnapshot with 5 sub-fields)
- 5 boolean flags (manualTrigger, memoryOnly, deployUnlockAllowed, backendPersistenceAllowed, sessionAuditInheritanceAllowed)

**Optional Fields**:
- 2 string fields (promotionArchiveId, promotionId)

**Validation Approach**:
- Fail-fast on root input check
- Collect all errors for all other checks
- Return comprehensive validation result with error details

---

**Document Version**: 1.0.0  
**Date**: 2026-05-03  
**Status**: ✅ Complete
