import type {
  HeadlineEditorActionType,
  HeadlineEditorReviewActionDefinition,
  HeadlineEditorReviewPayloadV1,
  HeadlineEditorTopReason,
  TitleSurfaceName
} from './core-types'

export interface EditorReviewAuditRecordLike {
  audit_id: string
  batch_id: string
  trace_id: string
  overall_decision: string
  timestamp: string
  gate_payload: Record<string, unknown>
}

export interface ResolvedTitleSurfaceItem {
  surface: TitleSurfaceName
  value: string
  source: 'explicit' | 'fallback'
}

export interface EditorReviewSectionVisibility {
  showSuggestedFix: boolean
  showTitleSurface: boolean
  showMultilingual: boolean
  showEscalation: boolean
  showDebug: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function extractEditorReviewPayload(record: EditorReviewAuditRecordLike): HeadlineEditorReviewPayloadV1 | null {
  const candidate = record.gate_payload?.editor_review_payload_v1
  if (!isRecord(candidate)) {
    return null
  }

  const summary = candidate.decisionSummary
  const header = candidate.reviewHeader

  if (!isRecord(summary) || !isRecord(header)) {
    return null
  }

  if (!asString(summary.oneLineRecommendation) || !asString(summary.overallDecision) || !asString(header.batchId)) {
    return null
  }

  return candidate as unknown as HeadlineEditorReviewPayloadV1
}

export function resolvePrimaryReasons(
  payload: HeadlineEditorReviewPayloadV1,
  limit = 3
): HeadlineEditorTopReason[] {
  return [...(payload.topReasons || [])]
    .sort((left, right) => left.rank - right.rank)
    .slice(0, limit)
}

export function resolveEvidenceSummaries(payload: HeadlineEditorReviewPayloadV1): string[] {
  const seen = new Set<string>()
  const summaries: string[] = []

  for (const reason of payload.topReasons || []) {
    for (const item of reason.evidenceSummary || []) {
      const normalized = item.trim()
      if (!normalized || seen.has(normalized)) {
        continue
      }

      seen.add(normalized)
      summaries.push(normalized)

      if (summaries.length >= 8) {
        return summaries
      }
    }
  }

  if (summaries.length === 0) {
    summaries.push('No concise evidence summary available; inspect raw evidence references in debug details.')
  }

  return summaries
}

export function resolveTitleSurfaces(record: EditorReviewAuditRecordLike): ResolvedTitleSurfaceItem[] {
  const gatePayload = record.gate_payload
  const headlineIntelligence = isRecord(gatePayload?.headline_intelligence_v1)
    ? gatePayload.headline_intelligence_v1
    : null

  const titleSurfaceAssessment = isRecord((headlineIntelligence as Record<string, unknown> | null)?.titleSurfaceAssessment)
    ? (headlineIntelligence as Record<string, unknown>).titleSurfaceAssessment
    : null

  const resolvedSurfacesRaw = isRecord(titleSurfaceAssessment)
    ? titleSurfaceAssessment.resolvedSurfaces
    : null

  const resolvedSurfaces: unknown[] = Array.isArray(resolvedSurfacesRaw)
    ? resolvedSurfacesRaw
    : []

  return resolvedSurfaces
    .filter((item: unknown): item is Record<string, unknown> => isRecord(item))
    .map((item: Record<string, unknown>) => {
      const surface = asString(item.surface) as TitleSurfaceName | null
      const value = asString(item.value)
      const source = asString(item.source)

      if (!surface || !value || (source !== 'explicit' && source !== 'fallback')) {
        return null
      }

      return {
        surface,
        value,
        source: source as 'explicit' | 'fallback'
      }
    })
    .filter((item: ResolvedTitleSurfaceItem | null): item is ResolvedTitleSurfaceItem => Boolean(item))
}

export function resolveSectionVisibility(
  payload: HeadlineEditorReviewPayloadV1,
  record: EditorReviewAuditRecordLike
): EditorReviewSectionVisibility {
  const titleSurfaces = resolveTitleSurfaces(record)

  const showTitleSurface =
    payload.titleSurfaceSummary.status === 'DIVERGENT' ||
    payload.titleSurfaceSummary.problematicPairs.length > 0 ||
    titleSurfaces.length > 0

  const showMultilingual =
    payload.multilingualSummary.status === 'DRIFT_DETECTED' ||
    payload.multilingualSummary.driftHighlights.length > 0 ||
    payload.multilingualSummary.impactedLanguages.length > 0

  const showEscalation =
    payload.escalationSummary.escalationRequired ||
    payload.decisionSummary.holdFromPublish ||
    payload.escalationSummary.escalationClass !== 'NONE'

  const showSuggestedFix =
    payload.correctionSuggestions.length > 0 ||
    payload.topReasons.some(reason => (reason.suggestedFix || '').trim().length > 0)

  return {
    showSuggestedFix,
    showTitleSurface,
    showMultilingual,
    showEscalation,
    showDebug: Boolean(payload.internalDebug)
  }
}

export interface EditorActionUiState {
  action: HeadlineEditorActionType
  label: string
  description: string
  minimumFields: string[]
  isRecommended: boolean
}

export function resolveActionUiState(payload: HeadlineEditorReviewPayloadV1): EditorActionUiState[] {
  const recommendedAction = payload.decisionSummary.recommendedAction
  return payload.reviewActionModel.map((action: HeadlineEditorReviewActionDefinition) => ({
    action: action.action,
    label: action.label,
    description: action.description,
    minimumFields: action.minimumFields,
    isRecommended: action.action === recommendedAction
  }))
}

export function formatAuditTimestamp(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
