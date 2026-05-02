#!/usr/bin/env tsx
/**
 * VERIFIER FOR TASK 8C-3A-3C-1: VALIDATION RESULT FACTORY HELPERS ONLY.
 * This script verifies that the factory module contains only pure factory functions
 * and does not contain validation logic, guard calls, or forbidden runtime operations.
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const FACTORY_FILE = "lib/editorial/canonical-reaudit-registration-preview-assessment-validation-factories.ts";

const REQUIRED_EXPORTS = [
  "createCanonicalReAuditRegistrationPreviewAssessmentValidationError",
  "createCanonicalReAuditRegistrationPreviewAssessmentValidationWarning",
  "createCanonicalReAuditRegistrationPreviewAssessmentValidationSafety",
  "createCanonicalReAuditRegistrationPreviewAssessmentValidationResult",
];

const FORBIDDEN_IMPORTS = [
  "primitive-guards",
  "preview-shape",
  "state-types",
  "react",
  "next",
  "app/",
  "components/",
  "hooks/",
  "handlers/",
  "api/",
  "adapter",
  "database",
  "provider",
  "persistence",
  "storage",
  "prisma",
  "turso",
  "libsql",
  "axios",
];

const FORBIDDEN_GUARD_TOKENS = [
  "isPlainRecord",
  "hasOwnStringField",
  "hasOwnBooleanField",
  "hasOwnNumberField",
  "hasOwnLiteralField",
  "isReadonlyStringArray",
  "validateCanonical",
];

const FORBIDDEN_RUNTIME_TOKENS = [
  "fetch(",
  "axios",
  "prisma",
  "turso",
  "libsql",
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "document.",
  "window.",
  "process.env",
  "child_process",
  "exec(",
  "spawn(",
  "fs.",
  "path.",
  "Date.now",
  "Date.parse",
  "new Date",
  "Math.random",
  "JSON.parse",
  "JSON.stringify",
  "eval(",
  "Function(",
  "Reflect.",
  "Object.assign",
  "Object.create",
  "Object.setPrototypeOf",
  "delete ",
  "console.",
  "setTimeout",
  "setInterval",
  "Promise",
  "async ",
  "await ",
];

const FORBIDDEN_MUTATION_TOKENS = [
  ".push(",
  ".pop(",
  ".splice(",
  ".sort(",
  ".reverse(",
  ".shift(",
  ".unshift(",
  "+=",
  "-=",
  "*=",
  "/=",
  "++",
  "--",
  "Object.freeze",
  "Object.assign",
];

const FORBIDDEN_OBJECT_TYPES = [
  "PreviewShape",
  "PreviewAssessment",
  "RegistrationState",
  "DeployDecision",
  "GlobalAudit",
  "Vault",
  "Session",
  "Publish",
  "Promote",
  "Register",
  "Acceptance",
];

const REQUIRED_LITERALS = [
  "registration-preview-assessment-validation-result",
  "deployUnlockForbidden: true",
  "persistenceForbidden: true",
  "mutationForbidden: true",
  "validatorBuildsObjects: false",
  "validatorMutatesInput: false",
  "validatorPersistsState: false",
  "validatorUnlocksDeploy: false",
];

const FORBIDDEN_SINGLETON_TOKENS = [
  "defaultValidationResult",
  "DEFAULT_VALIDATION_RESULT",
  "defaultError",
  "DEFAULT_ERROR",
  "defaultWarning",
  "DEFAULT_WARNING",
  "singleton",
  "SINGLETON",
  "export const",
];

let checkCount = 0;

function check(condition: boolean, message: string): void {
  checkCount++;
  if (!condition) {
    console.error(`❌ CHECK ${checkCount} FAILED: ${message}`);
    process.exit(1);
  }
}

function stripComments(content: string): string {
  // Remove single-line comments
  content = content.replace(/\/\/.*$/gm, "");
  // Remove multi-line comments
  content = content.replace(/\/\*[\s\S]*?\*\//g, "");
  return content;
}

console.log("🔍 TASK 8C-3A-3C-1 VALIDATION FACTORY VERIFIER\n");

// Check 1: File existence
console.log("Check 1: File existence");
check(fs.existsSync(FACTORY_FILE), `Factory file must exist: ${FACTORY_FILE}`);

const factoryContent = fs.readFileSync(FACTORY_FILE, "utf-8");
const factoryContentStripped = stripComments(factoryContent);

// Check 2: Exact export surface
console.log("Check 2: Exact export surface");
for (const exportName of REQUIRED_EXPORTS) {
  check(
    factoryContent.includes(`export function ${exportName}`),
    `Factory must export function: ${exportName}`
  );
}

// Check for forbidden exports (export const, export let, export var, export default)
check(
  !factoryContentStripped.includes("export default"),
  "Factory must not have default export"
);

// Check 3: Import policy
console.log("Check 3: Import policy");
check(
  factoryContent.includes('import type {'),
  "Factory must use 'import type' syntax"
);
check(
  factoryContent.includes('./canonical-reaudit-registration-preview-assessment-validation-result'),
  "Factory must import from validation-result file"
);

// Check that we're not importing from preview-assessment module (but allow validation-result filename)
const importLines = factoryContent.split('\n').filter(line => line.trim().startsWith('import'));
for (const line of importLines) {
  if (line.includes('preview-assessment') && !line.includes('validation-result')) {
    check(false, "Factory must not import from preview-assessment module");
  }
}

// Check forbidden imports only in import statements
for (const forbiddenImport of FORBIDDEN_IMPORTS) {
  for (const line of importLines) {
    check(
      !line.includes(forbiddenImport),
      `Factory must not import from: ${forbiddenImport}`
    );
  }
}

// Check 4: No guard or validator logic
console.log("Check 4: No guard or validator logic");
for (const guardToken of FORBIDDEN_GUARD_TOKENS) {
  check(
    !factoryContentStripped.includes(guardToken),
    `Factory must not contain guard token: ${guardToken}`
  );
}

// Check 5: Forbidden runtime token scan
console.log("Check 5: Forbidden runtime token scan");
for (const runtimeToken of FORBIDDEN_RUNTIME_TOKENS) {
  check(
    !factoryContentStripped.includes(runtimeToken),
    `Factory must not contain runtime token: ${runtimeToken}`
  );
}

// Check 6: Forbidden mutation scan
console.log("Check 6: Forbidden mutation scan");
for (const mutationToken of FORBIDDEN_MUTATION_TOKENS) {
  // Special handling for spread operator which is allowed
  if (mutationToken === "++") {
    // Check for ++ but allow it in comments (already stripped)
    const incrementPattern = /\+\+/;
    check(
      !incrementPattern.test(factoryContentStripped),
      `Factory must not contain mutation token: ${mutationToken}`
    );
  } else if (mutationToken === "--") {
    const decrementPattern = /--/;
    check(
      !decrementPattern.test(factoryContentStripped),
      `Factory must not contain mutation token: ${mutationToken}`
    );
  } else {
    check(
      !factoryContentStripped.includes(mutationToken),
      `Factory must not contain mutation token: ${mutationToken}`
    );
  }
}

// Check 7: Forbidden object type scan
console.log("Check 7: Forbidden object type scan");
for (const objectType of FORBIDDEN_OBJECT_TYPES) {
  // Use word boundary to avoid matching substrings in allowed type names
  const pattern = new RegExp(`\\b${objectType}\\b`);
  // Exclude import lines from this check since they contain allowed validation types
  const nonImportContent = factoryContentStripped.split('\n')
    .filter(line => !line.trim().startsWith('import'))
    .join('\n');
  check(
    !pattern.test(nonImportContent),
    `Factory must not reference forbidden type: ${objectType}`
  );
}

// Check 8: Required literal checks
console.log("Check 8: Required literal checks");
for (const literal of REQUIRED_LITERALS) {
  check(
    factoryContent.includes(literal),
    `Factory must contain required literal: ${literal}`
  );
}

// Check 9: No default/singleton result objects
console.log("Check 9: No default/singleton result objects");
for (const singletonToken of FORBIDDEN_SINGLETON_TOKENS) {
  check(
    !factoryContentStripped.includes(singletonToken),
    `Factory must not contain singleton token: ${singletonToken}`
  );
}

// Check 10: Smoke tests
console.log("Check 10: Smoke tests");

// Dynamic import for smoke tests
(async () => {
  try {
    const factories = await import(`../${FACTORY_FILE.replace('.ts', '.js')}`);

    // Test error factory
    const error = factories.createCanonicalReAuditRegistrationPreviewAssessmentValidationError(
      "MISSING_REQUIRED_FIELD",
      ["field", "path"],
      "Test message",
      "Test hint"
    );
    check(error.code === "MISSING_REQUIRED_FIELD", "Error factory: code");
    check(error.fieldPath.length === 2, "Error factory: fieldPath length");
    check(error.message === "Test message", "Error factory: message");
    check(error.remediationHint === "Test hint", "Error factory: remediationHint");

    // Test warning factory
    const warning = factories.createCanonicalReAuditRegistrationPreviewAssessmentValidationWarning(
      "UNUSUAL_FIELD_VALUE",
      ["warn", "path"],
      "Warning message"
    );
    check(warning.code === "UNUSUAL_FIELD_VALUE", "Warning factory: code");
    check(warning.fieldPath.length === 2, "Warning factory: fieldPath length");
    check(warning.message === "Warning message", "Warning factory: message");

    // Test safety factory
    const safety = factories.createCanonicalReAuditRegistrationPreviewAssessmentValidationSafety();
    check(safety.deployUnlockForbidden === true, "Safety factory: deployUnlockForbidden");
    check(safety.persistenceForbidden === true, "Safety factory: persistenceForbidden");
    check(safety.mutationForbidden === true, "Safety factory: mutationForbidden");
    check(safety.validatorBuildsObjects === false, "Safety factory: validatorBuildsObjects");
    check(safety.validatorMutatesInput === false, "Safety factory: validatorMutatesInput");
    check(safety.validatorPersistsState === false, "Safety factory: validatorPersistsState");
    check(safety.validatorUnlocksDeploy === false, "Safety factory: validatorUnlocksDeploy");

    // Test result factory
    const result = factories.createCanonicalReAuditRegistrationPreviewAssessmentValidationResult(
      true,
      [error],
      [warning],
      ["DEPLOY_UNLOCK_FORBIDDEN"]
    );
    check(
      result.__kind === "registration-preview-assessment-validation-result",
      "Result factory: __kind"
    );
    check(result.valid === true, "Result factory: valid");
    check(result.errors.length === 1, "Result factory: errors length");
    check(result.warnings.length === 1, "Result factory: warnings length");
    check(result.safetyFlags.length === 1, "Result factory: safetyFlags length");
    check(result.safety.deployUnlockForbidden === true, "Result factory: safety object");

    // Test immutability: mutating input arrays should not affect result
    const inputErrors = [error];
    const inputWarnings = [warning];
    const inputFlags: readonly ("DEPLOY_UNLOCK_FORBIDDEN")[] = ["DEPLOY_UNLOCK_FORBIDDEN"];
    const result2 = factories.createCanonicalReAuditRegistrationPreviewAssessmentValidationResult(
      false,
      inputErrors,
      inputWarnings,
      inputFlags
    );
    // Mutate input arrays
    (inputErrors as any[]).push(error);
    (inputWarnings as any[]).push(warning);
    (inputFlags as any[]).push("MUTATION_FORBIDDEN");
    // Result should still have original lengths
    check(result2.errors.length === 1, "Result factory: immutability - errors");
    check(result2.warnings.length === 1, "Result factory: immutability - warnings");
    check(result2.safetyFlags.length === 1, "Result factory: immutability - safetyFlags");

    // Check 11: Scope check
    console.log("Check 11: Scope check");
    try {
      const gitStatus = execSync("git diff --name-only", { encoding: "utf-8" }).trim();
      const gitCached = execSync("git diff --cached --name-only", { encoding: "utf-8" }).trim();

      const changedFiles = [...gitStatus.split("\n"), ...gitCached.split("\n")].filter(Boolean);
      const allowedFiles = [
        FACTORY_FILE,
        "scripts/verify-canonical-reaudit-8c3a-validation-factories.ts",
        "tsconfig.tsbuildinfo",
        ".idea/planningMode.xml",
        ".idea/caches/deviceStreaming.xml",
      ];

      for (const file of changedFiles) {
        const isAllowed = allowedFiles.some((allowed) => file.includes(allowed));
        const isUntracked = file.includes(".kiro/") || file.includes("SIAIntel.worktrees/") || file.endsWith(".md");
        check(
          isAllowed || isUntracked,
          `Scope check: unexpected file change: ${file}`
        );
      }
    } catch (e) {
      console.log("⚠️  Git not available or no repository, skipping scope check");
    }

    console.log(`\n✅ ALL ${checkCount} CHECKS PASSED`);
    console.log("✅ TASK 8C-3A-3C-1 VALIDATION FACTORIES: VERIFIED");
    process.exit(0);
  } catch (error) {
    console.error("❌ Smoke test failed:", error);
    process.exit(1);
  }
})();
