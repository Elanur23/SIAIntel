/**
 * FIELD_DEPENDENCY_ENGINE.TS
 * Granular Field-Level Dependency Mapping & Smart Re-execution Controller
 * 
 * This engine tracks which specific fields trigger which cells, enabling
 * surgical re-execution instead of full regeneration (90% cost reduction).
 * 
 * @version 1.0.0
 * @author SIA Intelligence Systems - Cellular Editorial OS
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type CellType =
  | 'title_cell'
  | 'body_cell'
  | 'seo_cell'
  | 'schema_cell'
  | 'meta_cell'
  | 'fact_check_cell'
  | 'policy_cell'
  | 'tone_cell'
  | 'readability_cell'
  | 'link_cell'
  | 'sovereign_cell'
  | 'visual_cell'
  | 'discover_cell'
  | 'cross_lang_cell'

export type FieldPath =
  | 'content.title'
  | 'content.lead'
  | 'content.body.summary'
  | 'content.body.full'
  | 'content.schema_jsonld'
  | 'content.internal_links'
  | 'content.hreflang_tags'
  | 'entities[]'
  | 'truth_nucleus.facts[]'
  | 'truth_nucleus.claims[]'
  | 'metadata.keywords[]'
  | 'metadata.category'
  | 'metadata.region'
  | 'metadata.language'

export type ExecutionTier = 0 | 1 | 2 | 3

export type ReExecutionStrategy =
  | 'MAP_ONLY'       // Just update references, no AI call ($0.00)
  | 'PARTIAL'        // Re-run 1-2 cells ($0.05)
  | 'SHALLOW'        // Re-run Tier 1 cells ($0.15)
  | 'DEEP'           // Re-run Tier 1 + Tier 2 ($0.45)
  | 'FULL'           // Re-run all cells except MIC ($0.80)
  | 'NUCLEAR'        // Full regeneration from MIC ($1.50)

export interface FieldDependency {
  field: FieldPath
  tier: ExecutionTier
  triggeredCells: CellType[]
  description: string
}

export interface ModificationEvent {
  field: FieldPath
  oldValue: any
  newValue: any
  timestamp: number
  modifiedBy: 'user' | 'ai' | 'healing' | 'chief_editor'
}

export interface ReExecutionPlan {
  strategy: ReExecutionStrategy
  affectedCells: CellType[]
  executionOrder: CellType[][]  // Grouped by tier for parallel execution
  estimatedCost: number
  estimatedTime: number  // milliseconds
  reason: string
}

// ============================================================================
// FIELD-LEVEL DEPENDENCY MATRIX
// ============================================================================

export const FIELD_DEPENDENCY_MATRIX: FieldDependency[] = [
  // ========== TIER 0: FOUNDATION FIELDS ==========
  {
    field: 'content.title',
    tier: 0,
    triggeredCells: ['seo_cell', 'schema_cell', 'meta_cell', 'discover_cell'],
    description: 'Title change affects SEO, schema markup, meta tags, and Google Discover'
  },
  {
    field: 'content.lead',
    tier: 0,
    triggeredCells: ['fact_check_cell', 'policy_cell', 'tone_cell'],
    description: 'Lead paragraph change requires fact-check, policy review, and tone analysis'
  },
  {
    field: 'content.body.summary',
    tier: 0,
    triggeredCells: ['readability_cell', 'seo_cell', 'meta_cell'],
    description: 'Summary change affects readability score, SEO, and meta descriptions'
  },
  {
    field: 'content.body.full',
    tier: 0,
    triggeredCells: [
      'fact_check_cell',
      'policy_cell',
      'tone_cell',
      'readability_cell',
      'link_cell',
      'seo_cell'
    ],
    description: 'Full body change triggers comprehensive re-audit (most expensive)'
  },

  // ========== TIER 1: CONTEXTUAL FIELDS ==========
  {
    field: 'entities[]',
    tier: 1,
    triggeredCells: ['link_cell', 'schema_cell', 'sovereign_cell'],
    description: 'Entity list change affects internal linking, schema entities, and sovereign context'
  },
  {
    field: 'truth_nucleus.facts[]',
    tier: 1,
    triggeredCells: [
      'title_cell',
      'body_cell',
      'seo_cell',
      'schema_cell',
      'meta_cell',
      'fact_check_cell',
      'policy_cell',
      'tone_cell',
      'readability_cell',
      'link_cell',
      'sovereign_cell',
      'visual_cell'
    ],
    description: 'MIC fact change triggers FULL REGENERATION (nuclear option)'
  },
  {
    field: 'truth_nucleus.claims[]',
    tier: 1,
    triggeredCells: ['fact_check_cell', 'policy_cell', 'tone_cell'],
    description: 'Claim modification requires fact verification and policy compliance check'
  },

  // ========== TIER 2: METADATA FIELDS ==========
  {
    field: 'metadata.keywords[]',
    tier: 2,
    triggeredCells: ['seo_cell', 'meta_cell'],
    description: 'Keyword change affects SEO optimization and meta tags'
  },
  {
    field: 'metadata.category',
    tier: 2,
    triggeredCells: ['link_cell', 'schema_cell'],
    description: 'Category change affects internal linking strategy and schema categorization'
  },
  {
    field: 'metadata.region',
    tier: 2,
    triggeredCells: ['sovereign_cell', 'tone_cell'],
    description: 'Region change requires sovereign context adjustment and tone localization'
  },
  {
    field: 'metadata.language',
    tier: 2,
    triggeredCells: ['tone_cell', 'readability_cell', 'seo_cell'],
    description: 'Language change triggers tone, readability, and SEO re-optimization'
  },

  // ========== TIER 3: EDITORIAL SPECIALTY FIELDS ==========
  {
    field: 'content.schema_jsonld',
    tier: 3,
    triggeredCells: ['schema_cell'],
    description: 'Direct schema JSON-LD changes only trigger SchemaCell'
  },
  {
    field: 'content.internal_links',
    tier: 3,
    triggeredCells: ['link_cell'],
    description: 'Internal links manual changes only trigger LinkCell'
  },
  {
    field: 'content.hreflang_tags',
    tier: 3,
    triggeredCells: ['cross_lang_cell'],
    description: 'Hreflang tag changes only trigger CrossLangCell'
  }
]

// ============================================================================
// CELL EXECUTION TIER HIERARCHY
// ============================================================================

export const CELL_TIER_MAP: Record<CellType, ExecutionTier> = {
  // Tier 0: Foundation (must complete before Tier 1)
  title_cell: 0,
  body_cell: 0,

  // Tier 1: Contextual (depends on Tier 0)
  fact_check_cell: 1,
  tone_cell: 1,
  policy_cell: 1,

  // Tier 2: Optimizers (depends on Tier 0 + Tier 1)
  seo_cell: 2,
  readability_cell: 2,
  link_cell: 2,
  discover_cell: 2,

  // Tier 3: Validators (depends on all previous tiers)
  schema_cell: 3,
  meta_cell: 3,
  sovereign_cell: 3,
  visual_cell: 3,
  cross_lang_cell: 3
}

// ============================================================================
// COST ESTIMATION (based on Gemini 1.5 Pro pricing)
// ============================================================================

const CELL_COST_MAP: Record<CellType, number> = {
  title_cell: 0.02,
  body_cell: 0.15,
  seo_cell: 0.05,
  schema_cell: 0.03,
  meta_cell: 0.02,
  fact_check_cell: 0.20,  // Most expensive (requires search grounding)
  policy_cell: 0.10,
  tone_cell: 0.08,
  readability_cell: 0.04,
  link_cell: 0.06,
  sovereign_cell: 0.12,
  visual_cell: 0.10,
  discover_cell: 0.07,
  cross_lang_cell: 0.09
}

const MIC_REGENERATION_COST = 0.50  // Master Intelligence Core regeneration

// ============================================================================
// SMART RE-EXECUTION ENGINE
// ============================================================================

export class FieldDependencyEngine {
  /**
   * Analyzes a field modification and determines optimal re-execution strategy
   */
  static analyzeModification(event: ModificationEvent): ReExecutionPlan {
    const dependency = FIELD_DEPENDENCY_MATRIX.find(d => d.field === event.field)

    if (!dependency) {
      // Unknown field - default to MAP_ONLY (safest, cheapest)
      return {
        strategy: 'MAP_ONLY',
        affectedCells: [],
        executionOrder: [],
        estimatedCost: 0.00,
        estimatedTime: 50,
        reason: `Unknown field "${event.field}" - no re-execution needed`
      }
    }

    // Special case: MIC modification = NUCLEAR option
    if (event.field.startsWith('truth_nucleus.facts')) {
      return this.createNuclearPlan(dependency)
    }

    // Special case: Full body modification = DEEP re-run
    if (event.field === 'content.body.full') {
      return this.createDeepPlan(dependency)
    }

    // Special case: Title or lead = SHALLOW re-run
    if (event.field === 'content.title' || event.field === 'content.lead') {
      return this.createShallowPlan(dependency)
    }

    // Default: PARTIAL re-run (surgical)
    return this.createPartialPlan(dependency)
  }

  /**
   * MAP_ONLY: Just update references, no AI calls
   */
  private static createMapOnlyPlan(): ReExecutionPlan {
    return {
      strategy: 'MAP_ONLY',
      affectedCells: [],
      executionOrder: [],
      estimatedCost: 0.00,
      estimatedTime: 50,
      reason: 'Metadata-only change - no content regeneration needed'
    }
  }

  /**
   * PARTIAL: Re-run 1-2 specific cells
   */
  private static createPartialPlan(dependency: FieldDependency): ReExecutionPlan {
    const affectedCells = dependency.triggeredCells.slice(0, 2)  // Limit to 2 cells
    const executionOrder = this.groupCellsByTier(affectedCells)
    const estimatedCost = this.calculateCost(affectedCells)

    return {
      strategy: 'PARTIAL',
      affectedCells,
      executionOrder,
      estimatedCost,
      estimatedTime: 2000,  // ~2 seconds
      reason: `Field "${dependency.field}" modified - re-running ${affectedCells.length} cells`
    }
  }

  /**
   * SHALLOW: Re-run Tier 0 + Tier 1 cells
   */
  private static createShallowPlan(dependency: FieldDependency): ReExecutionPlan {
    const affectedCells = dependency.triggeredCells
    const executionOrder = this.groupCellsByTier(affectedCells)
    const estimatedCost = this.calculateCost(affectedCells)

    return {
      strategy: 'SHALLOW',
      affectedCells,
      executionOrder,
      estimatedCost,
      estimatedTime: 5000,  // ~5 seconds
      reason: `Critical field "${dependency.field}" modified - shallow re-execution`
    }
  }

  /**
   * DEEP: Re-run Tier 0 + Tier 1 + Tier 2 cells
   */
  private static createDeepPlan(dependency: FieldDependency): ReExecutionPlan {
    const affectedCells = dependency.triggeredCells
    const executionOrder = this.groupCellsByTier(affectedCells)
    const estimatedCost = this.calculateCost(affectedCells)

    return {
      strategy: 'DEEP',
      affectedCells,
      executionOrder,
      estimatedCost,
      estimatedTime: 12000,  // ~12 seconds
      reason: `Major content change in "${dependency.field}" - deep re-execution required`
    }
  }

  /**
   * FULL: Re-run all cells except MIC
   */
  private static createFullPlan(): ReExecutionPlan {
    const allCells: CellType[] = Object.keys(CELL_TIER_MAP) as CellType[]
    const executionOrder = this.groupCellsByTier(allCells)
    const estimatedCost = this.calculateCost(allCells)

    return {
      strategy: 'FULL',
      affectedCells: allCells,
      executionOrder,
      estimatedCost,
      estimatedTime: 25000,  // ~25 seconds
      reason: 'Comprehensive content modification - full cell re-execution'
    }
  }

  /**
   * NUCLEAR: Full regeneration from MIC (most expensive)
   */
  private static createNuclearPlan(dependency: FieldDependency): ReExecutionPlan {
    const allCells: CellType[] = Object.keys(CELL_TIER_MAP) as CellType[]
    const executionOrder = this.groupCellsByTier(allCells)
    const estimatedCost = MIC_REGENERATION_COST + this.calculateCost(allCells)

    return {
      strategy: 'NUCLEAR',
      affectedCells: allCells,
      executionOrder,
      estimatedCost,
      estimatedTime: 45000,  // ~45 seconds
      reason: 'MIC truth nucleus modified - complete regeneration required'
    }
  }

  /**
   * Groups cells by execution tier for parallel processing
   */
  private static groupCellsByTier(cells: CellType[]): CellType[][] {
    const tiers: Map<ExecutionTier, CellType[]> = new Map()

    cells.forEach(cell => {
      const tier = CELL_TIER_MAP[cell]
      if (!tiers.has(tier)) {
        tiers.set(tier, [])
      }
      tiers.get(tier)!.push(cell)
    })

    // Convert to array sorted by tier
    return Array.from(tiers.entries())
      .sort(([tierA], [tierB]) => tierA - tierB)
      .map(([_, cells]) => cells)
  }

  /**
   * Calculates total cost for executing given cells
   */
  private static calculateCost(cells: CellType[]): number {
    return cells.reduce((total, cell) => total + CELL_COST_MAP[cell], 0)
  }

  /**
   * Validates if a re-execution plan is within budget
   */
  static validateBudget(plan: ReExecutionPlan, maxBudget: number): boolean {
    return plan.estimatedCost <= maxBudget
  }

  /**
   * Detects differences between two versions of content/metadata
   * and identifies all modified fields.
   */
  static detectDiff(oldState: any, newState: any): FieldPath[] {
    const changedFields: FieldPath[] = []

    const paths: FieldPath[] = [
      'content.title',
      'content.lead',
      'content.body.summary',
      'content.body.full',
      'content.schema_jsonld',
      'content.internal_links',
      'content.hreflang_tags',
      'entities[]',
      'truth_nucleus.facts[]',
      'truth_nucleus.claims[]',
      'metadata.keywords[]',
      'metadata.category',
      'metadata.region',
      'metadata.language'
    ]

    for (const path of paths) {
      const oldValue = this.getValueByPath(oldState, path)
      const newValue = this.getValueByPath(newState, path)

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changedFields.push(path)
      }
    }

    return changedFields
  }

  /**
   * Helper to get value from nested object by path
   */
  private static getValueByPath(obj: any, path: string): any {
    if (!obj) return undefined

    // Handle array suffix
    const cleanPath = path.replace('[]', '')
    const parts = cleanPath.split('.')

    let current = obj
    for (const part of parts) {
      if (current === undefined || current === null) return undefined
      current = current[part]
    }

    return current
  }

  /**
   * Creates a surgical re-execution plan based on multiple field changes
   */
  static createSurgicalPlan(changedFields: FieldPath[]): ReExecutionPlan {
    const affectedCells: Set<CellType> = new Set()
    let highestTier: ExecutionTier = 0

    for (const field of changedFields) {
      const dependency = FIELD_DEPENDENCY_MATRIX.find(d => d.field === field)
      if (dependency) {
        dependency.triggeredCells.forEach(cell => affectedCells.add(cell))
        if (dependency.tier > highestTier) highestTier = dependency.tier
      }
    }

    const cellsArray = Array.from(affectedCells)
    const executionOrder = this.groupCellsByTier(cellsArray)
    const estimatedCost = this.calculateCost(cellsArray)

    let strategy: ReExecutionStrategy = 'PARTIAL'
    if (changedFields.includes('truth_nucleus.facts[]')) {
      strategy = 'NUCLEAR'
    } else if (changedFields.includes('content.body.full')) {
      strategy = 'DEEP'
    } else if (cellsArray.length > 5) {
      strategy = 'FULL'
    }

    return {
      strategy,
      affectedCells: cellsArray,
      executionOrder,
      estimatedCost,
      estimatedTime: cellsArray.length * 1500, // Roughly 1.5s per cell
      reason: `Surgical re-execution for changed fields: ${changedFields.join(', ')}`
    }
  }

  /**
   * Generates human-readable execution summary
   */
  static generateExecutionSummary(plan: ReExecutionPlan): string {
    let summary = `RE-EXECUTION PLAN\n`
    summary += `Strategy: ${plan.strategy}\n`
    summary += `Affected Cells: ${plan.affectedCells.length}\n`
    summary += `Estimated Cost: $${plan.estimatedCost.toFixed(2)}\n`
    summary += `Estimated Time: ${(plan.estimatedTime / 1000).toFixed(1)}s\n`
    summary += `Reason: ${plan.reason}\n\n`

    if (plan.executionOrder.length > 0) {
      summary += `EXECUTION ORDER (by tier):\n`
      plan.executionOrder.forEach((tierCells, index) => {
        summary += `Tier ${index}: ${tierCells.join(', ')}\n`
      })
    }

    return summary
  }
}

// ============================================================================
// STATE INVALIDATION PROTOCOL
// ============================================================================

export interface InvalidationEvent {
  triggerCell: CellType
  invalidatedCells: CellType[]
  reason: string
  autoRetrigger: boolean
}

export class StateInvalidationController {
  /**
   * Determines which cells must be invalidated when a healing patch is applied
   */
  static computeInvalidation(
    healedCell: CellType,
    patchType: 'content' | 'metadata' | 'structure'
  ): InvalidationEvent {
    const tier = CELL_TIER_MAP[healedCell]
    const invalidatedCells: CellType[] = []

    // Invalidate all cells in higher tiers
    Object.entries(CELL_TIER_MAP).forEach(([cell, cellTier]) => {
      if (cellTier > tier) {
        invalidatedCells.push(cell as CellType)
      }
    })

    return {
      triggerCell: healedCell,
      invalidatedCells,
      reason: `Healing patch applied to ${healedCell} (Tier ${tier}) - invalidating downstream cells`,
      autoRetrigger: patchType === 'content'  // Auto-retrigger for content changes
    }
  }

  /**
   * Checks if a cell's dependencies are satisfied
   */
  static areDependenciesSatisfied(
    cell: CellType,
    completedCells: Set<CellType>
  ): boolean {
    const cellTier = CELL_TIER_MAP[cell]

    // Tier 0 cells have no dependencies
    if (cellTier === 0) {
      return true
    }

    // Check if all cells in lower tiers are completed
    for (const [otherCell, otherTier] of Object.entries(CELL_TIER_MAP)) {
      if (otherTier < cellTier && !completedCells.has(otherCell as CellType)) {
        return false
      }
    }

    return true
  }
}

// ============================================================================
// COST CONTROLLER & BUDGET TRACKING
// ============================================================================

export interface BudgetTracker {
  articleId: string
  totalBudget: number
  spentSoFar: number
  operations: Array<{
    timestamp: number
    operation: string
    cost: number
    strategy: ReExecutionStrategy
  }>
}

export class CostController {
  private budgets: Map<string, BudgetTracker> = new Map()

  /**
   * Initializes budget for an article
   */
  initializeBudget(articleId: string, budget: number): void {
    this.budgets.set(articleId, {
      articleId,
      totalBudget: budget,
      spentSoFar: 0,
      operations: []
    })
  }

  /**
   * Records an operation and deducts from budget
   */
  recordOperation(
    articleId: string,
    operation: string,
    plan: ReExecutionPlan
  ): boolean {
    const tracker = this.budgets.get(articleId)
    if (!tracker) {
      console.error(`No budget tracker found for article ${articleId}`)
      return false
    }

    // Check if operation would exceed budget
    if (tracker.spentSoFar + plan.estimatedCost > tracker.totalBudget) {
      console.warn(
        `Budget exceeded for ${articleId}: ` +
        `$${tracker.spentSoFar.toFixed(2)} + $${plan.estimatedCost.toFixed(2)} > ` +
        `$${tracker.totalBudget.toFixed(2)}`
      )
      return false
    }

    // Record operation
    tracker.spentSoFar += plan.estimatedCost
    tracker.operations.push({
      timestamp: Date.now(),
      operation,
      cost: plan.estimatedCost,
      strategy: plan.strategy
    })

    return true
  }

  /**
   * Gets remaining budget for an article
   */
  getRemainingBudget(articleId: string): number {
    const tracker = this.budgets.get(articleId)
    if (!tracker) return 0
    return tracker.totalBudget - tracker.spentSoFar
  }

  /**
   * Generates budget report
   */
  generateBudgetReport(articleId: string): string {
    const tracker = this.budgets.get(articleId)
    if (!tracker) return 'No budget tracker found'

    let report = `BUDGET REPORT: ${articleId}\n`
    report += `Total Budget: $${tracker.totalBudget.toFixed(2)}\n`
    report += `Spent: $${tracker.spentSoFar.toFixed(2)}\n`
    report += `Remaining: $${(tracker.totalBudget - tracker.spentSoFar).toFixed(2)}\n`
    report += `Operations: ${tracker.operations.length}\n\n`

    if (tracker.operations.length > 0) {
      report += `OPERATION HISTORY:\n`
      tracker.operations.forEach((op, index) => {
        const date = new Date(op.timestamp).toISOString()
        report += `${index + 1}. [${date}] ${op.operation} - $${op.cost.toFixed(2)} (${op.strategy})\n`
      })
    }

    return report
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default FieldDependencyEngine
