import { z } from 'zod';
import { detectForbiddenResidue } from '@/lib/neural-assembly/sia-sentinel-core';
import {
  PANDA_REQUIRED_LANGS,
  PandaLanguage,
  PANDA_SOURCE_SYSTEM,
  PANDA_FORBIDDEN_RESIDUE,
  PANDA_FAIL_CLOSED_CODES,
  PANDA_WRITING_RULES
} from '@/lib/content/sia-panda-writing-protocol';

export { PANDA_REQUIRED_LANGS };
export type { PandaLanguage };

export interface PandaLanguageNode {
  headline: string;
  subheadline: string;
  summary: string;
  body: string;
  keyInsights: string[];
  riskNote: string;
  seoTitle: string;
  seoDescription: string;
  provenanceNotes: string;
}

export interface PandaPackage {
  articleId: string;
  sourceSystem: "PANDA_V1";
  createdAt: string;
  category: string;
  targetRegion: string;
  languageCompleteness: 9;
  provenanceStatus?: string;
  globalRiskLevel?: string;
  languages: Record<PandaLanguage, PandaLanguageNode>;
}

export interface PandaValidationError {
  lang?: string;
  field?: string;
  code: string;
  message: string;
}

export type PandaValidationResult =
  | { ok: true; data: PandaPackage }
  | { ok: false; errors: PandaValidationError[] };

const PandaLanguageNodeSchema = z.object({
  headline: z.string().min(PANDA_WRITING_RULES.HEADLINE.minChars, "Headline too short"),
  subheadline: z.string().min(PANDA_WRITING_RULES.SUBHEADLINE.minChars, "Subheadline too short"),
  summary: z.string().min(PANDA_WRITING_RULES.SUMMARY.minChars, "Summary too short").max(PANDA_WRITING_RULES.SUMMARY.maxChars, "Summary too long"),
  body: z.string().min(PANDA_WRITING_RULES.BODY.minChars, "Body too short"),
  keyInsights: z.array(z.string()).min(PANDA_WRITING_RULES.KEY_INSIGHTS.minItems, `Need at least ${PANDA_WRITING_RULES.KEY_INSIGHTS.minItems} key insights`),
  riskNote: z.string().min(PANDA_WRITING_RULES.RISK_NOTE.minChars, "Risk note too short"),
  seoTitle: z.string().min(10, "SEO title too short"),
  seoDescription: z.string().min(30, "SEO description too short"),
  provenanceNotes: z.string(),
});

const PandaPackageSchema = z.object({
  articleId: z.string().min(1, "articleId missing"),
  sourceSystem: z.literal(PANDA_SOURCE_SYSTEM),
  createdAt: z.string().min(1, "createdAt missing"),
  category: z.string().min(1, "category missing"),
  targetRegion: z.string().min(1, "targetRegion missing"),
  languageCompleteness: z.literal(9),
  provenanceStatus: z.string().optional(),
  globalRiskLevel: z.string().optional(),
  languages: z.record(z.string(), PandaLanguageNodeSchema),
});

/**
 * Checks for English leakage in non-Latin script languages (RU, AR, JP, ZH)
 */
function checkLanguageLeakage(lang: string, text: string): string | null {
  if (!['ru', 'ar', 'jp', 'zh'].includes(lang)) return null;

  // Count Latin characters (excluding basic punctuation/numbers)
  const latinChars = text.match(/[a-zA-Z]/g) || [];
  const totalChars = text.replace(/[\s\d\p{P}]/gu, '').length; // Alphanumeric characters only

  if (totalChars === 0) return null;

  const latinRatio = latinChars.length / totalChars;

  // If more than 60% of meaningful chars are Latin in a non-Latin language node, it's leakage
  if (latinRatio > 0.6) {
    return `Language mismatch detected for ${lang.toUpperCase()}. Content appears to be mostly English.`;
  }

  return null;
}

/**
 * Validates a Panda 9-language intake package
 */
export function validatePandaPackage(input: unknown): PandaValidationResult {
  const errors: PandaValidationError[] = [];

  // 1. ZOD SCHEMA VALIDATION
  const zodResult = PandaPackageSchema.safeParse(input);
  if (!zodResult.success) {
    zodResult.error.errors.forEach((err) => {
      errors.push({
        field: err.path.join('.'),
        code: PANDA_FAIL_CLOSED_CODES.MALFORMED_JSON,
        message: err.message,
      });
    });
    return { ok: false, errors };
  }

  const pkg = zodResult.data as PandaPackage;

  // 2. LANGUAGE COMPLETENESS CHECK
  const langKeys = Object.keys(pkg.languages);
  const missingLangs = PANDA_REQUIRED_LANGS.filter(l => !langKeys.includes(l));
  const extraLangs = langKeys.filter(l => !(PANDA_REQUIRED_LANGS as unknown as string[]).includes(l));

  if (missingLangs.length > 0 || extraLangs.length > 0 || pkg.languageCompleteness !== 9 || langKeys.length !== 9) {
    errors.push({
      code: PANDA_FAIL_CLOSED_CODES.LANGUAGE_MISSING,
      message: `Expected exactly 9 languages (${PANDA_REQUIRED_LANGS.join(', ')}). Missing: ${missingLangs.join(', ')}. Extra: ${extraLangs.join(', ')}.`,
    });
    return { ok: false, errors };
  }

  // 3. DEEP CONTENT VALIDATION PER LANGUAGE
  PANDA_REQUIRED_LANGS.forEach((lang) => {
    const node = pkg.languages[lang];

    // Check fields for residue and integrity
    const fieldMap: Record<keyof PandaLanguageNode, string | string[]> = {
      headline: node.headline,
      subheadline: node.subheadline,
      summary: node.summary,
      body: node.body,
      keyInsights: node.keyInsights,
      riskNote: node.riskNote,
      seoTitle: node.seoTitle,
      seoDescription: node.seoDescription,
      provenanceNotes: node.provenanceNotes,
    };

    Object.entries(fieldMap).forEach(([field, value]) => {
      const textToAudit = Array.isArray(value) ? value.join(' ') : value;

      // RESIDUE DETECTION (Combined List)
      const residueMatch = detectForbiddenResidue(textToAudit);
      if (residueMatch) {
        errors.push({
          lang,
          field,
          code: PANDA_FAIL_CLOSED_CODES.RESIDUE_DETECTED,
          message: `Forbidden residue "${residueMatch}" found in ${field}.`,
        });
      }

      // Protocol Pack Expanded Residue Check (Direct String Match)
      for (const res of PANDA_FORBIDDEN_RESIDUE) {
        if (textToAudit.toLowerCase().includes(res.toLowerCase())) {
          errors.push({
            lang,
            field,
            code: PANDA_FAIL_CLOSED_CODES.RESIDUE_DETECTED,
            message: `Forbidden protocol residue "${res}" detected in ${field}.`,
          });
          break;
        }
      }

      // FOOTER INTEGRITY
      if (textToAudit.includes("## ##") || textToAudit.includes("### ###")) {
        errors.push({
          lang,
          field,
          code: PANDA_FAIL_CLOSED_CODES.FOOTER_INTEGRITY_FAILURE,
          message: `Malformed markdown prefixes ("## ##") found in ${field}.`,
        });
      }

      const markers = ["SIA-V4-EEAT-SOURCE-VERIFICATION", "Verification Metadata"];
      markers.forEach(marker => {
        const count = (textToAudit.match(new RegExp(marker, 'g')) || []).length;
        if (count > 1) {
          errors.push({
            lang,
            field,
            code: PANDA_FAIL_CLOSED_CODES.FOOTER_INTEGRITY_FAILURE,
            message: `Duplicated marker "${marker}" found in ${field}.`,
          });
        }
      });

      // LANGUAGE LEAKAGE (for non-latin script langs)
      // EXEMPT: provenanceNotes are allowed to be English protocol disclaimers
      if (field !== "provenanceNotes") {
        const leakageError = checkLanguageLeakage(lang, textToAudit);
        if (leakageError) {
          errors.push({
            lang,
            field,
            code: PANDA_FAIL_CLOSED_CODES.LANGUAGE_MISMATCH,
            message: leakageError,
          });
        }
      }

      // DETERMINISTIC LANGUAGE CHECK (Financial)
      if (textToAudit.toLowerCase().includes("guaranteed returns") || textToAudit.toLowerCase().includes("will rise")) {
          errors.push({
            lang,
            field,
            code: PANDA_FAIL_CLOSED_CODES.FAKE_VERIFICATION,
            message: `Unsupported deterministic financial language found in ${field}.`,
          });
      }

      // CONFIDENCE SCORE CHECK
      if (textToAudit.toLowerCase().includes("confidence score")) {
          errors.push({
            lang,
            field,
            code: PANDA_FAIL_CLOSED_CODES.UNSUPPORTED_SCORE,
            message: `Unsupported confidence score claim found in ${field}.`,
          });
      }
    });

    // PROVENANCE CHECK
    if (pkg.provenanceStatus === "VERIFIED" && (!node.provenanceNotes || node.provenanceNotes.trim().length === 0)) {
      errors.push({
        lang,
        field: "provenanceNotes",
        code: PANDA_FAIL_CLOSED_CODES.PROVENANCE_FAILURE,
        message: "Provenance status is VERIFIED but provenanceNotes are missing.",
      });
    }

    // Fake parity check
    if (node.provenanceNotes.toLowerCase().includes("multilingual parity verified")) {
        errors.push({
            lang,
            field: "provenanceNotes",
            code: PANDA_FAIL_CLOSED_CODES.FAKE_VERIFICATION,
            message: "Unsupported 'multilingual parity verified' claim in provenance notes.",
        });
    }
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, data: pkg };
}
