/**
 * Source Verification System for SIA_NEWS_v1.0
 * 
 * This module validates data sources against approved categories and extracts
 * structured data for downstream processing. It ensures only trusted sources
 * (on-chain data, central banks, verified news agencies) are used in content generation.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.5
 */

import type {
  NormalizedEvent,
  VerifiedData,
  SourceCategory,
  AuditEntry,
  CrossReference
} from './types'

// ============================================================================
// APPROVED SOURCES CONFIGURATION
// ============================================================================

/**
 * Approved data sources organized by category
 * 
 * ON_CHAIN: Blockchain explorers and on-chain analytics platforms
 * CENTRAL_BANK: Official central bank sources
 * VERIFIED_NEWS_AGENCY: Trusted global news agencies
 */
export const APPROVED_SOURCES: Record<SourceCategory, string[]> = {
  ON_CHAIN: [
    'Binance',
    'WhaleAlert',
    'Etherscan',
    'Glassnode',
    'CryptoQuant',
    'Nansen',
    'Dune Analytics',
    'Blockchain.com',
    'BscScan',
    'PolygonScan',
    'Coinbase',
    'Kraken',
    'Bitfinex'
  ],
  CENTRAL_BANK: [
    'Federal Reserve',
    'FED',
    'ECB',
    'European Central Bank',
    'Bank of England',
    'BoE',
    'TCMB',
    'Central Bank of Turkey',
    'Bank of Japan',
    'BoJ',
    'People\'s Bank of China',
    'PBOC',
    'Swiss National Bank',
    'SNB',
    'Reserve Bank of Australia',
    'RBA',
    'Bank of Canada',
    'BoC',
    'Banco Central do Brasil',
    'Central Bank of Russia',
    'CBR'
  ],
  VERIFIED_NEWS_AGENCY: [
    'Bloomberg',
    'Reuters',
    'Financial Times',
    'Wall Street Journal',
    'Associated Press',
    'AP',
    'Agence France-Presse',
    'AFP',
    'CNBC',
    'MarketWatch',
    'The Economist',
    'Barron\'s',
    'CoinDesk',
    'CoinTelegraph',
    'Decrypt'
  ]
}

/**
 * Credibility scores for each source category (0-100)
 */
export const CATEGORY_CREDIBILITY: Record<SourceCategory, number> = {
  ON_CHAIN: 95, // Highest credibility - immutable blockchain data
  CENTRAL_BANK: 100, // Maximum credibility - official government sources
  VERIFIED_NEWS_AGENCY: 85 // High credibility - established journalism
}

// ============================================================================
// SOURCE VERIFICATION
// ============================================================================

/**
 * Verifies if a source is in the approved list
 * 
 * @param sourceName - Name of the data source
 * @returns True if source is approved, false otherwise
 */
export function isApprovedSource(sourceName: string): boolean {
  const normalizedSource = sourceName.trim().toLowerCase()
  
  for (const category of Object.keys(APPROVED_SOURCES) as SourceCategory[]) {
    const approvedList = APPROVED_SOURCES[category]
    const isApproved = approvedList.some(
      approved => approved.toLowerCase() === normalizedSource
    )
    
    if (isApproved) {
      return true
    }
  }
  
  return false
}

/**
 * Determines the category of an approved source
 * 
 * @param sourceName - Name of the data source
 * @returns Source category or null if not approved
 */
export function getSourceCategory(sourceName: string): SourceCategory | null {
  const normalizedSource = sourceName.trim().toLowerCase()
  
  for (const category of Object.keys(APPROVED_SOURCES) as SourceCategory[]) {
    const approvedList = APPROVED_SOURCES[category]
    const isInCategory = approvedList.some(
      approved => approved.toLowerCase() === normalizedSource
    )
    
    if (isInCategory) {
      return category
    }
  }
  
  return null
}

/**
 * Main source verification function
 * 
 * Validates the event source against approved categories and extracts
 * structured data for downstream processing.
 * 
 * @param event - Normalized event from data ingestion
 * @returns VerifiedData object if approved, null if rejected
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.5
 */
export async function verifySource(
  event: NormalizedEvent
): Promise<VerifiedData | null> {
  try {
    // Check if source is approved
    if (!isApprovedSource(event.source)) {
      // Create audit trail for rejection
      const auditTrail = await createAuditTrail(
        event.source,
        'REJECTED',
        `Source "${event.source}" is not in approved categories`
      )
      
      console.warn(`[Source Verification] Rejected source: ${event.source}`)
      return null
    }
    
    // Get source category
    const category = getSourceCategory(event.source)
    if (!category) {
      const auditTrail = await createAuditTrail(
        event.source,
        'REJECTED',
        'Failed to determine source category'
      )
      return null
    }
    
    // Extract structured data from event
    const extractedData = await extractStructuredData(event)
    
    // Create audit trail for approval
    const auditTrail = await createAuditTrail(
      event.source,
      'APPROVED',
      undefined
    )
    
    // Build verified data object
    const verifiedData: VerifiedData = {
      source: event.source,
      category,
      timestamp: event.timestamp,
      extractedData,
      crossReferences: [], // Will be populated by cross-reference validation
      auditTrail
    }
    
    console.log(`[Source Verification] Approved: ${event.source} (${category})`)
    return verifiedData
    
  } catch (error) {
    console.error('[Source Verification] Error:', error)
    
    // Create audit trail for error
    await createAuditTrail(
      event.source,
      'FLAGGED',
      `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
    
    return null
  }
}

// ============================================================================
// STRUCTURED DATA EXTRACTION
// ============================================================================

/**
 * Extracts structured data from normalized event
 * 
 * Parses timestamps, numerical values, and entity references from event data
 * for use in causal analysis and content generation.
 * 
 * @param event - Normalized event
 * @returns Extracted structured data
 * 
 * Requirements: 1.3
 */
export async function extractStructuredData(
  event: NormalizedEvent
): Promise<VerifiedData['extractedData']> {
  const timestamps: string[] = []
  const numericalValues: Array<{ metric: string; value: number; unit: string }> = []
  const entityReferences: string[] = []
  
  // Extract primary timestamp
  timestamps.push(event.timestamp)
  
  // Extract asset as entity reference
  if (event.asset) {
    entityReferences.push(event.asset)
  }
  
  // Extract numerical values from metrics
  if (event.metrics) {
    // Price change
    if (typeof event.metrics.priceChange === 'number') {
      numericalValues.push({
        metric: 'priceChange',
        value: event.metrics.priceChange,
        unit: '%'
      })
    }
    
    // Volume
    if (typeof event.metrics.volume === 'number') {
      numericalValues.push({
        metric: 'volume',
        value: event.metrics.volume,
        unit: 'USD'
      })
    }
    
    // Wallet movement
    if (typeof event.metrics.walletMovement === 'number') {
      numericalValues.push({
        metric: 'walletMovement',
        value: event.metrics.walletMovement,
        unit: event.asset || 'units'
      })
    }
    
    // Extract other numerical metrics
    for (const [key, value] of Object.entries(event.metrics)) {
      if (typeof value === 'number' && !['priceChange', 'volume', 'walletMovement'].includes(key)) {
        numericalValues.push({
          metric: key,
          value,
          unit: 'units' // Default unit, should be specified in event data
        })
      }
    }
  }
  
  // Extract entity references from event metrics (additional data)
  if (event.metrics) {
    // Look for common entity fields in metrics
    const entityFields = ['symbol', 'currency', 'token', 'coin', 'institution', 'exchange']
    
    for (const field of entityFields) {
      if (event.metrics[field] && typeof event.metrics[field] === 'string') {
        const entity = event.metrics[field].trim()
        if (entity && !entityReferences.includes(entity)) {
          entityReferences.push(entity)
        }
      }
    }
    
    // Extract timestamps from metrics
    const timestampFields = ['time', 'date', 'createdAt', 'updatedAt']
    for (const field of timestampFields) {
      if (event.metrics[field] && typeof event.metrics[field] === 'string') {
        const timestamp = event.metrics[field].trim()
        if (timestamp && !timestamps.includes(timestamp)) {
          timestamps.push(timestamp)
        }
      }
    }
  }
  
  return {
    timestamps,
    numericalValues,
    entityReferences
  }
}

// ============================================================================
// AUDIT TRAIL
// ============================================================================

/**
 * Creates an audit trail entry for source verification
 * 
 * Logs verification timestamp, component, source attribution, and validation result
 * for compliance and debugging purposes.
 * 
 * @param source - Source name
 * @param validationResult - Result of validation (APPROVED/REJECTED/FLAGGED)
 * @param rejectionReason - Optional reason for rejection or flagging
 * @returns Audit entry object
 * 
 * Requirements: 1.5
 */
export async function createAuditTrail(
  source: string,
  validationResult: 'APPROVED' | 'REJECTED' | 'FLAGGED',
  rejectionReason?: string
): Promise<AuditEntry> {
  const auditEntry: AuditEntry = {
    verificationTimestamp: new Date().toISOString(),
    verifiedBy: 'source-verification-system',
    sourceAttribution: source,
    validationResult,
    rejectionReason
  }
  
  // Log audit entry for monitoring
  console.log('[Audit Trail]', {
    source,
    result: validationResult,
    timestamp: auditEntry.verificationTimestamp,
    reason: rejectionReason
  })
  
  // In production, this would also write to audit log database
  // await writeToAuditLog(auditEntry)
  
  return auditEntry
}

// ============================================================================
// CROSS-REFERENCE VALIDATION
// ============================================================================

/**
 * Cross-references data from multiple verified sources
 * 
 * Compares data points from multiple sources to detect discrepancies and
 * flag conflicting information. This ensures data accuracy by identifying
 * inconsistencies that may require manual review or rejection.
 * 
 * @param verifiedDataList - Array of verified data from multiple sources
 * @param discrepancyThreshold - Maximum acceptable discrepancy percentage (default: 10%)
 * @returns Array of cross-reference results with discrepancy flags
 * 
 * Requirements: 1.4
 */
export async function crossReferenceData(
  verifiedDataList: VerifiedData[],
  discrepancyThreshold: number = 10
): Promise<CrossReference[]> {
  const crossReferences: CrossReference[] = []
  
  // Need at least 2 sources to cross-reference
  if (verifiedDataList.length < 2) {
    console.log('[Cross-Reference] Insufficient sources for cross-referencing (need at least 2)')
    return crossReferences
  }
  
  try {
    // Compare each pair of sources
    for (let i = 0; i < verifiedDataList.length; i++) {
      for (let j = i + 1; j < verifiedDataList.length; j++) {
        const primaryData = verifiedDataList[i]
        const secondaryData = verifiedDataList[j]
        
        // Cross-reference numerical values
        const numericalRefs = await crossReferenceNumericalValues(
          primaryData,
          secondaryData,
          discrepancyThreshold
        )
        crossReferences.push(...numericalRefs)
        
        // Cross-reference timestamps
        const timestampRefs = await crossReferenceTimestamps(
          primaryData,
          secondaryData,
          discrepancyThreshold
        )
        crossReferences.push(...timestampRefs)
        
        // Cross-reference entity references
        const entityRefs = await crossReferenceEntities(
          primaryData,
          secondaryData
        )
        crossReferences.push(...entityRefs)
      }
    }
    
    // Log summary of cross-reference results
    const discrepancyCount = crossReferences.filter(ref => ref.discrepancy).length
    console.log(`[Cross-Reference] Completed: ${crossReferences.length} comparisons, ${discrepancyCount} discrepancies found`)
    
    return crossReferences
    
  } catch (error) {
    console.error('[Cross-Reference] Error during cross-referencing:', error)
    throw error
  }
}

/**
 * Cross-references numerical values between two sources
 * 
 * Compares numerical metrics (prices, volumes, percentages) and calculates
 * discrepancy percentages. Flags values that exceed the threshold.
 * 
 * @param primaryData - Primary verified data source
 * @param secondaryData - Secondary verified data source
 * @param threshold - Discrepancy threshold percentage
 * @returns Array of cross-references for numerical values
 */
async function crossReferenceNumericalValues(
  primaryData: VerifiedData,
  secondaryData: VerifiedData,
  threshold: number
): Promise<CrossReference[]> {
  const crossReferences: CrossReference[] = []
  
  const primaryValues = primaryData.extractedData.numericalValues
  const secondaryValues = secondaryData.extractedData.numericalValues
  
  // Compare matching metrics
  for (const primaryValue of primaryValues) {
    const matchingSecondary = secondaryValues.find(
      sv => sv.metric === primaryValue.metric && sv.unit === primaryValue.unit
    )
    
    if (matchingSecondary) {
      const discrepancyResult = calculateDiscrepancy(
        primaryValue.value,
        matchingSecondary.value,
        threshold
      )
      
      const crossRef: CrossReference = {
        primarySource: primaryData.source,
        secondarySource: secondaryData.source,
        dataPoint: `${primaryValue.metric} (${primaryValue.unit})`,
        primaryValue: primaryValue.value,
        secondaryValue: matchingSecondary.value,
        discrepancy: discrepancyResult.hasDiscrepancy,
        discrepancyPercentage: discrepancyResult.percentage
      }
      
      crossReferences.push(crossRef)
      
      // Log discrepancies for monitoring
      if (crossRef.discrepancy) {
        console.warn(
          `[Cross-Reference] Discrepancy detected: ${crossRef.dataPoint} - ` +
          `${primaryData.source}: ${primaryValue.value}, ` +
          `${secondaryData.source}: ${matchingSecondary.value} ` +
          `(${discrepancyResult.percentage.toFixed(2)}% difference)`
        )
      }
    }
  }
  
  return crossReferences
}

/**
 * Cross-references timestamps between two sources
 * 
 * Compares timestamps to detect timing discrepancies that may indicate
 * data synchronization issues or conflicting event timings.
 * 
 * @param primaryData - Primary verified data source
 * @param secondaryData - Secondary verified data source
 * @param threshold - Time difference threshold in seconds (default: 10% of 60 seconds = 6 seconds)
 * @returns Array of cross-references for timestamps
 */
async function crossReferenceTimestamps(
  primaryData: VerifiedData,
  secondaryData: VerifiedData,
  threshold: number
): Promise<CrossReference[]> {
  const crossReferences: CrossReference[] = []
  
  // Compare primary timestamps
  if (primaryData.timestamp && secondaryData.timestamp) {
    const primaryTime = new Date(primaryData.timestamp).getTime()
    const secondaryTime = new Date(secondaryData.timestamp).getTime()
    
    // Calculate time difference in seconds
    const timeDiffSeconds = Math.abs(primaryTime - secondaryTime) / 1000
    
    // Use threshold as seconds (e.g., 10% of 60 seconds = 6 seconds)
    const thresholdSeconds = (threshold / 100) * 60
    const hasDiscrepancy = timeDiffSeconds > thresholdSeconds
    
    const crossRef: CrossReference = {
      primarySource: primaryData.source,
      secondarySource: secondaryData.source,
      dataPoint: 'timestamp',
      primaryValue: primaryData.timestamp,
      secondaryValue: secondaryData.timestamp,
      discrepancy: hasDiscrepancy,
      discrepancyPercentage: hasDiscrepancy ? (timeDiffSeconds / 60) * 100 : 0
    }
    
    crossReferences.push(crossRef)
    
    if (hasDiscrepancy) {
      console.warn(
        `[Cross-Reference] Timestamp discrepancy: ${timeDiffSeconds.toFixed(2)}s difference ` +
        `between ${primaryData.source} and ${secondaryData.source}`
      )
    }
  }
  
  return crossReferences
}

/**
 * Cross-references entity references between two sources
 * 
 * Compares entity references to detect missing or conflicting entity mentions
 * that may indicate incomplete or inconsistent data.
 * 
 * @param primaryData - Primary verified data source
 * @param secondaryData - Secondary verified data source
 * @returns Array of cross-references for entity references
 */
async function crossReferenceEntities(
  primaryData: VerifiedData,
  secondaryData: VerifiedData
): Promise<CrossReference[]> {
  const crossReferences: CrossReference[] = []
  
  const primaryEntities = new Set(primaryData.extractedData.entityReferences)
  const secondaryEntities = new Set(secondaryData.extractedData.entityReferences)
  
  // Find entities in primary but not in secondary
  const missingInSecondary = [...primaryEntities].filter(e => !secondaryEntities.has(e))
  
  // Find entities in secondary but not in primary
  const missingInPrimary = [...secondaryEntities].filter(e => !primaryEntities.has(e))
  
  // Flag as discrepancy if there are missing entities
  const hasDiscrepancy = missingInSecondary.length > 0 || missingInPrimary.length > 0
  
  if (hasDiscrepancy) {
    const crossRef: CrossReference = {
      primarySource: primaryData.source,
      secondarySource: secondaryData.source,
      dataPoint: 'entity_references',
      primaryValue: Array.from(primaryEntities),
      secondaryValue: Array.from(secondaryEntities),
      discrepancy: true,
      discrepancyPercentage: undefined // Not applicable for entity references
    }
    
    crossReferences.push(crossRef)
    
    console.warn(
      `[Cross-Reference] Entity reference discrepancy: ` +
      `Missing in ${secondaryData.source}: [${missingInSecondary.join(', ')}], ` +
      `Missing in ${primaryData.source}: [${missingInPrimary.join(', ')}]`
    )
  }
  
  return crossReferences
}

/**
 * Calculates discrepancy percentage between two numerical values
 * 
 * Uses the formula: |value1 - value2| / value1 * 100
 * Handles edge cases like zero values and missing data.
 * 
 * @param value1 - First value (primary)
 * @param value2 - Second value (secondary)
 * @param threshold - Discrepancy threshold percentage
 * @returns Object with hasDiscrepancy flag and percentage
 */
function calculateDiscrepancy(
  value1: number,
  value2: number,
  threshold: number
): { hasDiscrepancy: boolean; percentage: number } {
  // Handle edge case: both values are zero
  if (value1 === 0 && value2 === 0) {
    return { hasDiscrepancy: false, percentage: 0 }
  }
  
  // Handle edge case: primary value is zero but secondary is not
  if (value1 === 0) {
    return { hasDiscrepancy: true, percentage: 100 }
  }
  
  // Calculate percentage difference: |value1 - value2| / |value1| * 100
  const percentage = Math.abs((value1 - value2) / value1) * 100
  
  // Flag as discrepancy if exceeds threshold
  const hasDiscrepancy = percentage > threshold
  
  return { hasDiscrepancy, percentage }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets the credibility score for a source
 * 
 * @param sourceName - Name of the data source
 * @returns Credibility score (0-100) or 0 if not approved
 */
export function getSourceCredibility(sourceName: string): number {
  const category = getSourceCategory(sourceName)
  if (!category) {
    return 0
  }
  return CATEGORY_CREDIBILITY[category]
}

/**
 * Validates if a source meets minimum credibility threshold
 * 
 * @param sourceName - Name of the data source
 * @param minCredibility - Minimum credibility score required (default: 70)
 * @returns True if source meets threshold, false otherwise
 */
export function meetsCredibilityThreshold(
  sourceName: string,
  minCredibility: number = 70
): boolean {
  const credibility = getSourceCredibility(sourceName)
  return credibility >= minCredibility
}

/**
 * Gets all approved sources for a specific category
 * 
 * @param category - Source category
 * @returns Array of approved source names
 */
export function getApprovedSourcesByCategory(category: SourceCategory): string[] {
  return [...APPROVED_SOURCES[category]]
}

/**
 * Gets statistics about approved sources
 * 
 * @returns Object with source statistics
 */
export function getSourceStatistics(): {
  totalSources: number
  byCategory: Record<SourceCategory, number>
  avgCredibility: number
} {
  const byCategory: Record<SourceCategory, number> = {
    ON_CHAIN: APPROVED_SOURCES.ON_CHAIN.length,
    CENTRAL_BANK: APPROVED_SOURCES.CENTRAL_BANK.length,
    VERIFIED_NEWS_AGENCY: APPROVED_SOURCES.VERIFIED_NEWS_AGENCY.length
  }
  
  const totalSources = Object.values(byCategory).reduce((sum, count) => sum + count, 0)
  
  const avgCredibility = Object.values(CATEGORY_CREDIBILITY).reduce((sum, score) => sum + score, 0) / 
    Object.keys(CATEGORY_CREDIBILITY).length
  
  return {
    totalSources,
    byCategory,
    avgCredibility
  }
}
