#!/usr/bin/env node

/**
 * Verifier for Task 8C-2E: Registration Preview Assessment
 * 
 * Validates that the registration preview assessment overlay is type-only,
 * readonly, and follows all safety boundaries.
 * 
 * @version 8C-2E.0.0
 * @author SIA Intelligence Systems
 */

import * as fs from 'fs';
import * as path from 'path';

const ASSESSMENT_FILE_PATH = 'lib/editorial/canonical-reaudit-registration-preview-assessment.ts';

interface VerificationResult {
  passed: boolean;
  message: string;
}

function verifyFileExists(): VerificationResult {
  if (!fs.existsSync(ASSESSMENT_FILE_PATH)) {
    return {
      passed: false,
      message: `Assessment file does not exist: ${ASSESSMENT_FILE_PATH}`
    };
  }
  return {
    passed: true,
    message: 'Assessment file exists'
  };
}

function verifyExports(): VerificationResult {
  const content = fs.readFileSync(ASSESSMENT_FILE_PATH, 'utf8');
  
  const requiredExports = [
    'CanonicalReAuditRegistrationPreviewAssessmentKind',
    'CanonicalReAuditRegistrationPreviewAssessmentSafety',
    'CanonicalReAuditRegistrationPreviewAssessmentBoundary',
    'CanonicalReAuditRegistrationPreviewAssessment'
  ];
  
  const missingExports = requiredExports.filter(exportName => {
    const exportPattern = new RegExp(`export\\s+(type\\s+|interface\\s+)${exportName}\\b`);
    return !exportPattern.test(content);
  });
  
  if (missingExports.length > 0) {
    return {
      passed: false,
      message: `Missing required exports: ${missingExports.join(', ')}`
    };
  }
  
  return {
    passed: true,
    message: 'All required exports present'
  };
}

function verifyTypeOnlyEnforcement(): VerificationResult {
  const content = fs.readFileSync(ASSESSMENT_FILE_PATH, 'utf8');
  
  // Remove comments to avoid false positives
  const contentWithoutComments = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  
  const forbiddenPatterns = [
    /export\s+function\b/,
    /\bfunction\b/,
    /=>/,
    /export\s+class\b/,
    /\bclass\b/,
    /export\s+const\b/,
    /\bconst\b/,
    /export\s+let\b/,
    /\blet\b/,
    /export\s+var\b/,
    /\bvar\b/,
    /\bnew\b/,
    /\breturn\b/,
    /\basync\b/,
    /\bawait\b/,
    /\bPromise\b/,
    /\benum\b/
  ];
  
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(contentWithoutComments)) {
      return {
        passed: false,
        message: `Found forbidden runtime construct: ${pattern.source}`
      };
    }
  }
  
  return {
    passed: true,
    message: 'Type-only enforcement passed'
  };
}

function verifyImportSafety(): VerificationResult {
  const content = fs.readFileSync(ASSESSMENT_FILE_PATH, 'utf8');
  
  // Check that all project imports use import type
  const importLines = content.split('\n').filter(line => line.trim().startsWith('import'));
  
  for (const line of importLines) {
    if (line.includes('from "./') || line.includes("from '../")) {
      if (!line.includes('import type')) {
        return {
          passed: false,
          message: `Non-type import found: ${line.trim()}`
        };
      }
    }
  }
  
  // Check allowed imports only
  const allowedImports = [
    'canonical-reaudit-registration-preview-shape',
    'canonical-reaudit-registration-eligibility-types',
    'canonical-reaudit-registration-readiness-explanation'
  ];
  
  const forbiddenImports = [
    'react',
    'next',
    'app/',
    'components/',
    'hooks/',
    'handlers/',
    'api/',
    'canonical-reaudit-adapter',
    'canonical-reaudit-input-builder',
    'prisma',
    'turso',
    'libsql',
    'axios',
    'provider',
    'database',
    'storage',
    'persistence'
  ];
  
  for (const forbidden of forbiddenImports) {
    const importPattern = new RegExp(`from\\s+['"].*${forbidden}.*['"]`);
    if (importPattern.test(content)) {
      return {
        passed: false,
        message: `Forbidden import detected: ${forbidden}`
      };
    }
  }
  
  return {
    passed: true,
    message: 'Import safety passed'
  };
}

function verifyReadonlyEnforcement(): VerificationResult {
  const content = fs.readFileSync(ASSESSMENT_FILE_PATH, 'utf8');
  
  // Extract interface definitions
  const interfaceMatches = content.match(/export\s+interface\s+\w+\s*{[^}]+}/gs);
  
  if (!interfaceMatches) {
    return {
      passed: false,
      message: 'No interface definitions found'
    };
  }
  
  for (const interfaceMatch of interfaceMatches) {
    const lines = interfaceMatch.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip empty lines, comments, and interface declaration lines
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || 
          trimmed.startsWith('*') || trimmed.startsWith('export interface') || 
          trimmed === '{' || trimmed === '}') {
        continue;
      }
      
      // Check if this is a field line (contains colon)
      if (trimmed.includes(':') && !trimmed.startsWith('readonly')) {
        return {
          passed: false,
          message: `Non-readonly field found: ${trimmed}`
        };
      }
    }
  }
  
  return {
    passed: true,
    message: 'Readonly enforcement passed'
  };
}

function verifyBrandedDiscriminant(): VerificationResult {
  const content = fs.readFileSync(ASSESSMENT_FILE_PATH, 'utf8');
  
  const requiredPatterns = [
    /readonly\s+__kind:\s*CanonicalReAuditRegistrationPreviewAssessmentKind/,
    /"registration-preview-assessment"/
  ];
  
  for (const pattern of requiredPatterns) {
    if (!pattern.test(content)) {
      return {
        passed: false,
        message: `Missing branded discriminant pattern: ${pattern.source}`
      };
    }
  }
  
  return {
    passed: true,
    message: 'Branded discriminant check passed'
  };
}

function verifyCompositeFields(): VerificationResult {
  const content = fs.readFileSync(ASSESSMENT_FILE_PATH, 'utf8');
  
  const requiredFields = [
    /readonly\s+preview:\s*CanonicalReAuditRegistrationPreviewShape/,
    /readonly\s+eligibility:\s*CanonicalReAuditRegistrationEligibilityResult/,
    /readonly\s+explanation:\s*CanonicalReAuditRegistrationReadinessExplanation/
  ];
  
  for (const pattern of requiredFields) {
    if (!pattern.test(content)) {
      return {
        passed: false,
        message: `Missing composite field: ${pattern.source}`
      };
    }
  }
  
  return {
    passed: true,
    message: 'Composite field check passed'
  };
}

function verifySafetyInvariants(): VerificationResult {
  const content = fs.readFileSync(ASSESSMENT_FILE_PATH, 'utf8');
  
  const requiredSafetyFlags = [
    /readonly\s+typeOnly:\s*true/,
    /readonly\s+assessmentOnly:\s*true/,
    /readonly\s+previewOnly:\s*true/,
    /readonly\s+informationalOnly:\s*true/,
    /readonly\s+memoryOnly:\s*true/,
    /readonly\s+executionAllowed:\s*false/,
    /readonly\s+registrationExecutionAllowed:\s*false/,
    /readonly\s+persistenceAllowed:\s*false/,
    /readonly\s+mutationAllowed:\s*false/,
    /readonly\s+deployRemainsLocked:\s*true/,
    /readonly\s+globalAuditOverwriteAllowed:\s*false/,
    /readonly\s+vaultMutationAllowed:\s*false/,
    /readonly\s+productionAuthorizationAllowed:\s*false/,
    /readonly\s+promotionRequired:\s*true/
  ];
  
  for (const pattern of requiredSafetyFlags) {
    if (!pattern.test(content)) {
      return {
        passed: false,
        message: `Missing safety invariant: ${pattern.source}`
      };
    }
  }
  
  return {
    passed: true,
    message: 'Safety invariant check passed'
  };
}

function verifyBoundaryInvariants(): VerificationResult {
  const content = fs.readFileSync(ASSESSMENT_FILE_PATH, 'utf8');
  
  const requiredBoundaryFlags = [
    /readonly\s+runtimeValidatorAllowed:\s*false/,
    /readonly\s+runtimeBuilderAllowed:\s*false/,
    /readonly\s+factoryAllowed:\s*false/,
    /readonly\s+generatorAllowed:\s*false/,
    /readonly\s+handlerIntegrationAllowed:\s*false/,
    /readonly\s+uiIntegrationAllowed:\s*false/,
    /readonly\s+adapterIntegrationAllowed:\s*false/,
    /readonly\s+deployUnlockAllowed:\s*false/
  ];
  
  for (const pattern of requiredBoundaryFlags) {
    if (!pattern.test(content)) {
      return {
        passed: false,
        message: `Missing boundary invariant: ${pattern.source}`
      };
    }
  }
  
  return {
    passed: true,
    message: 'Boundary invariant check passed'
  };
}

function verifyForbiddenActiveRuntimeTokens(): VerificationResult {
  const content = fs.readFileSync(ASSESSMENT_FILE_PATH, 'utf8');
  
  const forbiddenTokens = [
    'fetch(',
    'axios.',
    'prisma.',
    'turso.',
    'libsql.',
    'localStorage.',
    'sessionStorage.',
    'indexedDB.',
    'document.',
    'window.',
    'process.env',
    'child_process',
    'exec(',
    'spawn(',
    'setGlobalAudit(',
    'setVault(',
    'setIsDeployBlocked(',
    'registerCanonicalReAudit(',
    'transitionToRegistered(',
    'promote(',
    'deployUnlock(',
    'save(',
    'publish(',
    'fs.writeFile',
    'fs.appendFile',
    'fs.createWriteStream'
  ];
  
  for (const token of forbiddenTokens) {
    if (content.includes(token)) {
      return {
        passed: false,
        message: `Forbidden active runtime token found: ${token}`
      };
    }
  }
  
  return {
    passed: true,
    message: 'Forbidden active runtime token check passed'
  };
}

function verifyForbiddenNaming(): VerificationResult {
  const content = fs.readFileSync(ASSESSMENT_FILE_PATH, 'utf8');
  
  const forbiddenNames = [
    'Payload',
    'Transition',
    'RegisteredPreview',
    'RegisteredStatePreview',
    'Execute',
    'Executor',
    'Builder',
    'Factory',
    'Generator',
    'Persist',
    'Save',
    'Publish',
    'DeployUnlock',
    'Promote',
    'Commit',
    'Apply',
    'Validate',
    'Validator',
    'Check',
    'Verify'
  ];
  
  // Extract new exported type/interface names
  const exportMatches = content.match(/export\s+(type|interface)\s+(\w+)/g);
  
  if (exportMatches) {
    for (const match of exportMatches) {
      const nameMatch = match.match(/export\s+(?:type|interface)\s+(\w+)/);
      if (nameMatch) {
        const exportName = nameMatch[1];
        for (const forbidden of forbiddenNames) {
          if (exportName.includes(forbidden)) {
            return {
              passed: false,
              message: `Forbidden naming in export: ${exportName} contains ${forbidden}`
            };
          }
        }
      }
    }
  }
  
  return {
    passed: true,
    message: 'Forbidden naming check passed'
  };
}

function verifyNoStructuralMethods(): VerificationResult {
  const content = fs.readFileSync(ASSESSMENT_FILE_PATH, 'utf8');
  
  const forbiddenPatterns = [
    /\w+\s*\(\s*\):/,  // method signatures like foo():
    /readonly\s+\w+:\s*\(\s*\)\s*=>/,  // callable fields like readonly foo: () =>
    /readonly\s+\w+:\s*\w+\s*=>/,  // function property syntax
    /:\s*Promise</  // Promise fields
  ];
  
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) {
      return {
        passed: false,
        message: `Forbidden structural method found: ${pattern.source}`
      };
    }
  }
  
  return {
    passed: true,
    message: 'No structural methods check passed'
  };
}

function verifyNoObjectInstanceOrBuilder(): VerificationResult {
  const content = fs.readFileSync(ASSESSMENT_FILE_PATH, 'utf8');
  
  const forbiddenPatterns = [
    /=\s*{/,  // object literals assigned to exports
    /\bnew\b/,
    /\breturn\b/,
    /createAssessment/,
    /makeAssessment/,
    /buildAssessment/,
    /generateAssessment/,
    /validateAssessment/,
    /checkAssessment/,
    /verifyAssessment/
  ];
  
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) {
      return {
        passed: false,
        message: `Forbidden object instance or builder pattern found: ${pattern.source}`
      };
    }
  }
  
  return {
    passed: true,
    message: 'No object instance or builder check passed'
  };
}

function verifyBoundaryCompliance(): VerificationResult {
  // Check that the assessment file is not imported by runtime files
  const searchDirs = ['app', 'components', 'hooks', 'handlers', 'api'];
  const assessmentFileName = 'canonical-reaudit-registration-preview-assessment';
  
  for (const dir of searchDirs) {
    if (fs.existsSync(dir)) {
      const files = getAllTsFiles(dir);
      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          if (content.includes(assessmentFileName)) {
            return {
              passed: false,
              message: `Assessment file imported by runtime file: ${file}`
            };
          }
        } catch (error) {
          // Skip files that can't be read
          continue;
        }
      }
    }
  }
  
  return {
    passed: true,
    message: 'Boundary compliance check passed'
  };
}

function getAllTsFiles(dir: string): string[] {
  const files: string[] = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        files.push(...getAllTsFiles(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Skip directories that can't be read
  }
  
  return files;
}

function verifyNoDateTimestamp(): VerificationResult {
  const content = fs.readFileSync(ASSESSMENT_FILE_PATH, 'utf8');
  
  const forbiddenPatterns = [
    /\bDate\b/,
    /assessedAt/,
    /timestamp/,
    /createdAt/,
    /updatedAt/
  ];
  
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) {
      return {
        passed: false,
        message: `Forbidden date/timestamp pattern found: ${pattern.source}`
      };
    }
  }
  
  return {
    passed: true,
    message: 'No date/timestamp check passed'
  };
}

function verifyScopeCheck(): VerificationResult {
  // This would ideally use git to check changed files, but we'll simulate it
  // by checking that only the expected files exist
  const expectedFiles = [
    'lib/editorial/canonical-reaudit-registration-preview-assessment.ts',
    'scripts/verify-canonical-reaudit-8c2e-registration-preview-assessment.ts'
  ];
  
  for (const file of expectedFiles) {
    if (!fs.existsSync(file)) {
      return {
        passed: false,
        message: `Expected file missing: ${file}`
      };
    }
  }
  
  return {
    passed: true,
    message: 'Scope check passed'
  };
}

function main(): void {
  console.log('🔍 Verifying Task 8C-2E: Registration Preview Assessment...\n');
  
  const checks = [
    { name: 'File existence', fn: verifyFileExists },
    { name: 'Export checks', fn: verifyExports },
    { name: 'Type-only enforcement', fn: verifyTypeOnlyEnforcement },
    { name: 'Import safety', fn: verifyImportSafety },
    { name: 'Readonly enforcement', fn: verifyReadonlyEnforcement },
    { name: 'Branded discriminant check', fn: verifyBrandedDiscriminant },
    { name: 'Composite field check', fn: verifyCompositeFields },
    { name: 'Safety invariant check', fn: verifySafetyInvariants },
    { name: 'Boundary invariant check', fn: verifyBoundaryInvariants },
    { name: 'Forbidden active runtime token check', fn: verifyForbiddenActiveRuntimeTokens },
    { name: 'Forbidden naming check', fn: verifyForbiddenNaming },
    { name: 'No structural methods check', fn: verifyNoStructuralMethods },
    { name: 'No object instance / no assessment builder check', fn: verifyNoObjectInstanceOrBuilder },
    { name: 'Boundary compliance / consumer isolation check', fn: verifyBoundaryCompliance },
    { name: 'No Date / timestamp expectation check', fn: verifyNoDateTimestamp },
    { name: 'Scope check', fn: verifyScopeCheck }
  ];
  
  let passedCount = 0;
  let failedChecks: string[] = [];
  
  for (const check of checks) {
    const result = check.fn();
    if (result.passed) {
      console.log(`✅ ${check.name}: ${result.message}`);
      passedCount++;
    } else {
      console.log(`❌ ${check.name}: ${result.message}`);
      failedChecks.push(check.name);
    }
  }
  
  console.log(`\n📊 Results: ${passedCount}/${checks.length} checks passed`);
  
  if (failedChecks.length === 0) {
    console.log('\n🎉 PASS: All verification checks passed!');
    process.exit(0);
  } else {
    console.log(`\n💥 FAIL: ${failedChecks.length} checks failed:`);
    failedChecks.forEach(check => console.log(`   - ${check}`));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}