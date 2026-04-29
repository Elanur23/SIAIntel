/**
 * SESSION DRAFT PANDA ADAPTER
 *
 * Pure read-only adapter that maps session-scoped draft state into
 * the input shape expected by Panda validation (PandaPackage).
 *
 * CRITICAL SAFETY RULES:
 * - Pure and side-effect free.
 * - Never mutates inputs.
 * - Never mutates canonical vault.
 * - Never writes to backend/database/storage.
 * - Hard-codes safety invariants for session-memory execution.
 */

import { PANDA_REQUIRED_LANGS, PandaLanguage } from '@/lib/content/sia-panda-writing-protocol';
import {
  PandaPackage,
  PandaLanguageNode
} from './panda-intake-validator';
import { LocalDraft } from './remediation-local-draft';
import { SnapshotIdentity } from './remediation-apply-types';

/**
 * Result of the session draft Panda adapter mapping.
 */
export interface SessionDraftPandaAdapterResult {
  ok: boolean;
  package?: PandaPackage;
  error?: string;
  errorType?: "PANDA_PACKAGE_STRUCTURE_ERROR" | "LOCAL_DRAFT_COPY_MISSING";
  snapshotIdentity?: SnapshotIdentity;

  // Hard-coded Safety Invariants
  memoryOnly: true;
  deployUnlockAllowed: false;
  canonicalAuditOverwriteAllowed: false;
  vaultMutationAllowed: false;
}

/**
 * Pure helper to extract a section from the composed description string.
 */
function extractSection(desc: string, marker: string, nextMarkers: string[]): string {
  const startIndex = desc.indexOf(marker);
  if (startIndex === -1) return '';

  const contentStart = startIndex + marker.length;
  let endIndex = desc.length;

  for (const nextMarker of nextMarkers) {
    const mIndex = desc.indexOf(nextMarker, contentStart);
    if (mIndex !== -1 && mIndex < endIndex) {
      endIndex = mIndex;
    }
  }

  return desc.substring(contentStart, endIndex).trim();
}

/**
 * Pure helper to map a LocalDraft node to a PandaLanguageNode.
 */
function mapNodeToPandaLanguageNode(title: string, desc: string): PandaLanguageNode {
  const markers = [
    '[SUBHEADLINE]',
    '[SUMMARY]',
    '[BODY]',
    '[KEY_INSIGHTS]',
    '[RISK_NOTE]',
    '[SEO_TITLE]',
    '[SEO_DESCRIPTION]',
    '[PROVENANCE]'
  ];

  const subheadline = extractSection(desc, '[SUBHEADLINE]', markers.filter(m => m !== '[SUBHEADLINE]'));
  const summary = extractSection(desc, '[SUMMARY]', markers.filter(m => m !== '[SUMMARY]'));
  const body = extractSection(desc, '[BODY]', markers.filter(m => m !== '[BODY]'));
  const riskNote = extractSection(desc, '[RISK_NOTE]', markers.filter(m => m !== '[RISK_NOTE]'));
  const seoTitle = extractSection(desc, '[SEO_TITLE]', markers.filter(m => m !== '[SEO_TITLE]'));
  const seoDescription = extractSection(desc, '[SEO_DESCRIPTION]', markers.filter(m => m !== '[SEO_DESCRIPTION]'));
  const provenanceNotes = extractSection(desc, '[PROVENANCE]', markers.filter(m => m !== '[PROVENANCE]'));

  // Key insights are stored as bullet points
  const keyInsightsText = extractSection(desc, '[KEY_INSIGHTS]', markers.filter(m => m !== '[KEY_INSIGHTS]'));
  const keyInsights = keyInsightsText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('•'))
    .map(line => line.substring(1).trim())
    .filter(Boolean);

  return {
    headline: title,
    subheadline,
    summary,
    body,
    keyInsights: keyInsights.length > 0 ? keyInsights : ['No insights provided'],
    riskNote,
    seoTitle,
    seoDescription,
    provenanceNotes
  };
}

/**
 * Pure adapter that maps localDraftCopy into a PandaPackage structure.
 */
export function mapLocalDraftToPandaPackage(
  articleId: string,
  localDraftCopy: LocalDraft
): PandaPackage {
  const languages: Record<string, PandaLanguageNode> = {};

  PANDA_REQUIRED_LANGS.forEach((lang) => {
    const node = localDraftCopy[lang];
    if (!node) {
      throw new Error(`Missing language node: ${lang}`);
    }
    languages[lang] = mapNodeToPandaLanguageNode(node.title, node.desc);
  });

  return {
    articleId,
    sourceSystem: "PANDA_V1",
    createdAt: new Date().toISOString(),
    category: "MARKET", // Default category for session audits
    targetRegion: "GLOBAL",
    languageCompleteness: 9,
    languages: languages as Record<PandaLanguage, PandaLanguageNode>
  };
}

/**
 * Main adapter function that assembles the session draft Panda package.
 *
 * CRITICAL SAFETY CONSTRAINTS:
 * - Does NOT call validatePandaPackage yet.
 * - Does NOT mutate any state.
 */
export function buildSessionDraftPandaPackage(
  articleId: string,
  localDraftCopy: LocalDraft | null,
  snapshotIdentity: SnapshotIdentity | null
): SessionDraftPandaAdapterResult {
  // Safe error handling for missing input
  if (!localDraftCopy) {
    return {
      ok: false,
      error: 'LOCAL_DRAFT_COPY_MISSING',
      errorType: 'LOCAL_DRAFT_COPY_MISSING',
      memoryOnly: true,
      deployUnlockAllowed: false,
      canonicalAuditOverwriteAllowed: false,
      vaultMutationAllowed: false
    };
  }

  try {
    const pkg = mapLocalDraftToPandaPackage(articleId, localDraftCopy);

    return {
      ok: true,
      package: pkg,
      snapshotIdentity: snapshotIdentity || undefined,
      memoryOnly: true,
      deployUnlockAllowed: false,
      canonicalAuditOverwriteAllowed: false,
      vaultMutationAllowed: false
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'ADAPTER_MAPPING_ERROR',
      errorType: "PANDA_PACKAGE_STRUCTURE_ERROR",
      memoryOnly: true,
      deployUnlockAllowed: false,
      canonicalAuditOverwriteAllowed: false,
      vaultMutationAllowed: false
    };
  }
}
