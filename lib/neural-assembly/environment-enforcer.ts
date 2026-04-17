/**
 * ENVIRONMENT ENFORCER
 * Zero-Trust Constrained-Production Environment Identity Verification
 * 
 * MISSION: Prevent local/dev execution of official validation campaign batches
 * ENFORCEMENT: Hard environment identity checks that cannot be bypassed by NODE_ENV alone
 */

export interface EnvironmentIdentity {
  isConstrainedProduction: boolean
  namespace?: string
  podName?: string
  serviceAccount?: string
  executionEnvironment?: string
  validationTier?: string
  zeroTrustEnforcement?: string
  blockingReasons: string[]
}

/**
 * Detects and verifies constrained-production environment identity
 * Returns identity markers and blocking reasons if verification fails
 */
export function detectEnvironmentIdentity(): EnvironmentIdentity {
  const blockingReasons: string[] = []
  
  // 1. Check Kubernetes namespace marker (injected via downward API)
  const namespace = process.env.KUBERNETES_NAMESPACE
  if (!namespace) {
    blockingReasons.push('KUBERNETES_NAMESPACE not set (not running in Kubernetes)')
  } else if (namespace !== 'sia-validation-production') {
    blockingReasons.push(`KUBERNETES_NAMESPACE is '${namespace}' (expected 'sia-validation-production')`)
  }
  
  // 2. Check pod identity marker
  const podName = process.env.KUBERNETES_POD_NAME
  if (!podName) {
    blockingReasons.push('KUBERNETES_POD_NAME not set (not running in Kubernetes pod)')
  }
  
  // 3. Check service account identity
  const serviceAccount = process.env.KUBERNETES_SERVICE_ACCOUNT
  if (!serviceAccount) {
    blockingReasons.push('KUBERNETES_SERVICE_ACCOUNT not set (not running with service account)')
  } else if (serviceAccount !== 'sia-validation-executor') {
    blockingReasons.push(`KUBERNETES_SERVICE_ACCOUNT is '${serviceAccount}' (expected 'sia-validation-executor')`)
  }
  
  // 4. Check explicit constrained-production environment contract
  const executionEnvironment = process.env.EXECUTION_ENVIRONMENT
  if (!executionEnvironment) {
    blockingReasons.push('EXECUTION_ENVIRONMENT not set (environment contract missing)')
  } else if (executionEnvironment !== 'constrained-production') {
    blockingReasons.push(`EXECUTION_ENVIRONMENT is '${executionEnvironment}' (expected 'constrained-production')`)
  }
  
  // 5. Check validation tier marker
  const validationTier = process.env.VALIDATION_TIER
  if (!validationTier) {
    blockingReasons.push('VALIDATION_TIER not set (validation tier contract missing)')
  } else if (validationTier !== 'official') {
    blockingReasons.push(`VALIDATION_TIER is '${validationTier}' (expected 'official')`)
  }
  
  // 6. Check zero-trust enforcement marker
  const zeroTrustEnforcement = process.env.ZERO_TRUST_ENFORCEMENT
  if (!zeroTrustEnforcement) {
    blockingReasons.push('ZERO_TRUST_ENFORCEMENT not set (zero-trust contract missing)')
  } else if (zeroTrustEnforcement !== 'enabled') {
    blockingReasons.push(`ZERO_TRUST_ENFORCEMENT is '${zeroTrustEnforcement}' (expected 'enabled')`)
  }
  
  // 7. Detect local machine indicators (anti-masquerade)
  const isWindows = process.platform === 'win32'
  const isDarwin = process.platform === 'darwin'
  const hasLocalUserPath = process.cwd().includes('/Users/') || process.cwd().includes('C:\\Users\\')
  
  if (isWindows) {
    blockingReasons.push('Running on Windows platform (local machine detected)')
  }
  if (isDarwin) {
    blockingReasons.push('Running on macOS platform (local machine detected)')
  }
  if (hasLocalUserPath) {
    blockingReasons.push(`Working directory contains local user path: ${process.cwd()}`)
  }
  
  const isConstrainedProduction = blockingReasons.length === 0
  
  return {
    isConstrainedProduction,
    namespace,
    podName,
    serviceAccount,
    executionEnvironment,
    validationTier,
    zeroTrustEnforcement,
    blockingReasons
  }
}

/**
 * Enforces constrained-production environment identity
 * Throws error with precise blocking reasons if verification fails
 */
export function enforceConstrainedProductionEnvironment(): EnvironmentIdentity {
  const identity = detectEnvironmentIdentity()
  
  if (!identity.isConstrainedProduction) {
    const blockingReasonsFormatted = identity.blockingReasons
      .map((reason, index) => `  ${index + 1}. ${reason}`)
      .join('\n')
    
    throw new Error(
      `CONSTRAINED_PRODUCTION_ENVIRONMENT_VERIFICATION_FAILED\n\n` +
      `Official validation campaign execution is only allowed in authorized constrained-production environment.\n\n` +
      `Blocking Reasons:\n${blockingReasonsFormatted}\n\n` +
      `Required Environment Markers:\n` +
      `  - KUBERNETES_NAMESPACE=sia-validation-production\n` +
      `  - KUBERNETES_POD_NAME=<pod-name>\n` +
      `  - KUBERNETES_SERVICE_ACCOUNT=sia-validation-executor\n` +
      `  - EXECUTION_ENVIRONMENT=constrained-production\n` +
      `  - VALIDATION_TIER=official\n` +
      `  - ZERO_TRUST_ENFORCEMENT=enabled\n\n` +
      `Local/dev execution is forbidden for official validation campaign batches.\n` +
      `Deploy to constrained-production infrastructure using deployment/constrained-production/ manifests.`
    )
  }
  
  return identity
}

/**
 * Logs environment identity for audit trail
 */
export function logEnvironmentIdentity(identity: EnvironmentIdentity): void {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('ENVIRONMENT IDENTITY VERIFICATION')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')
  console.log(`Constrained-Production: ${identity.isConstrainedProduction ? 'YES' : 'NO'}`)
  console.log(`Namespace: ${identity.namespace || 'NOT SET'}`)
  console.log(`Pod Name: ${identity.podName || 'NOT SET'}`)
  console.log(`Service Account: ${identity.serviceAccount || 'NOT SET'}`)
  console.log(`Execution Environment: ${identity.executionEnvironment || 'NOT SET'}`)
  console.log(`Validation Tier: ${identity.validationTier || 'NOT SET'}`)
  console.log(`Zero-Trust Enforcement: ${identity.zeroTrustEnforcement || 'NOT SET'}`)
  
  if (identity.blockingReasons.length > 0) {
    console.log('')
    console.log('Blocking Reasons:')
    identity.blockingReasons.forEach((reason, index) => {
      console.log(`  ${index + 1}. ${reason}`)
    })
  }
  
  console.log('')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')
}
