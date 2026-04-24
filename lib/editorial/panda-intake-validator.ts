import { z } from 'zod';
import { detectForbiddenResidue } from '@/lib/neural-assembly/sia-sentinel-core';

export const PANDA_REQUIRED_LANGS = ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh'] as const;

export type PandaLanguage = (typeof PANDA_REQUIRED_LANGS)[number];

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
  headline: z.string().min(10, "Headline too short"),
  subheadline: z.string().min(20, "Subheadline too short"),
  summary: z.string().min(50, "Summary too short").max(300, "Summary too long"),
  body: z.string().min(200, "Body too short"),
  keyInsights: z.array(z.string()).min(3, "Need at least 3 key insights"),
  riskNote: z.string().min(10, "Risk note too short"),
  seoTitle: z.string().min(10, "SEO title too short"),
  seoDescription: z.string().min(30, "SEO description too short"),
  provenanceNotes: z.string(),
});

const PandaPackageSchema = z.object({
  articleId: z.string().min(1, "articleId missing"),
  sourceSystem: z.literal("PANDA_V1"),
  createdAt: z.string().min(1, "createdAt missing"),
  category: z.string().min(1, "category missing"),
  targetRegion: z.string().min(1, "targetRegion missing"),
  languageCompleteness: z.literal(9),
  provenanceStatus: z.string().optional(),
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
        code: "SCHEMA_VALIDATION_FAILURE",
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
      code: "LANGUAGE_COMPLETENESS_FAILURE",
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

      // RESIDUE DETECTION
      const residueMatch = detectForbiddenResidue(textToAudit);
      if (residueMatch) {
        errors.push({
          lang,
          field,
          code: "RESIDUE_DETECTED",
          message: `Forbidden residue "${residueMatch}" found in ${field}.`,
        });
      }

      // FOOTER INTEGRITY
      if (textToAudit.includes("## ##") || textToAudit.includes("### ###")) {
        errors.push({
          lang,
          field,
          code: "FOOTER_INTEGRITY_FAILURE",
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
            code: "FOOTER_INTEGRITY_FAILURE",
            message: `Duplicated marker "${marker}" found in ${field}.`,
          });
        }
      });

      // LANGUAGE LEAKAGE (for non-latin script langs)
      const leakageError = checkLanguageLeakage(lang, textToAudit);
      if (leakageError) {
        errors.push({
          lang,
          field,
          code: "LANGUAGE_MISMATCH",
          message: leakageError,
        });
      }
    });

    // PROVENANCE CHECK
    if (pkg.provenanceStatus === "VERIFIED" && (!node.provenanceNotes || node.provenanceNotes.trim().length === 0)) {
      errors.push({
        lang,
        field: "provenanceNotes",
        code: "PROVENANCE_FAILURE",
        message: "Provenance status is VERIFIED but provenanceNotes are missing.",
      });
    }
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, data: pkg };
}
