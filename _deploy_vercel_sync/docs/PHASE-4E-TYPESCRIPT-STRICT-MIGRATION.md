# Phase 4E: Full TypeScript Strict Migration

**Status**: IN PROGRESS  
**Started**: 2026-03-21  
**Goal**: Enable full TypeScript strict mode and fix all type errors

## Migration Strategy

### Strict Mode Settings Enabled
```json
{
  "strict": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true,
  "strictPropertyInitialization": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true
}
```

## Error Categories

### 1. Translation Function (`t`) Possibly Undefined (60+ errors)
**Pattern**: `t` is possibly 'undefined'
**Files**: All page components using `useLanguage()` hook
**Fix**: Add null checks or default values

### 2. Object Property Access (40+ errors)
**Pattern**: Object is possibly 'undefined'
**Files**: Components accessing nested properties
**Fix**: Optional chaining and null coalescing

### 3. Array Index Access (20+ errors)
**Pattern**: Element possibly 'undefined' due to `noUncheckedIndexedAccess`
**Files**: Components using array indexing
**Fix**: Add index checks or use `.at()` method

### 4. Missing Return Statements (5 errors)
**Pattern**: Not all code paths return a value
**Files**: Modal components with conditional rendering
**Fix**: Add explicit return statements

### 5. Type Assignments (10+ errors)
**Pattern**: Type 'X | undefined' not assignable to type 'X'
**Files**: API routes and components
**Fix**: Add type guards and assertions

## Fix Implementation

### Priority 1: Core Type Utilities
Create helper types and utilities for common patterns.

### Priority 2: Language Context
Fix translation function type safety across all pages.

### Priority 3: Component Props
Add proper null checks in component rendering.

### Priority 4: API Routes
Fix type safety in API route handlers.

### Priority 5: Validation
Run full type check and verify no regressions.

## Progress Tracking

- [ ] Create type utilities
- [ ] Fix language context issues
- [ ] Fix component prop access
- [ ] Fix API route types
- [ ] Fix array index access
- [ ] Fix missing return statements
- [ ] Run full type check
- [ ] Verify build passes
- [ ] Document breaking changes

## Breaking Changes

None expected - all fixes are internal type safety improvements.

## Testing

- TypeScript compilation: `npx tsc --noEmit`
- Build verification: `npm run build`
- Runtime testing: Manual verification of key pages

---

**Next Steps**: Implement fixes systematically by category.
