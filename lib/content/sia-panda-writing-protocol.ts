/**
 * SIA-Panda Writing Protocol Pack
 * The canonical writing contract for Panda-generated 9-language article packages.
 */

export const PANDA_PROTOCOL_VERSION = "1.0.0";
export const PANDA_SOURCE_SYSTEM = "PANDA_V1";

export const PANDA_REQUIRED_LANGS = [
  'en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh'
] as const;

export type PandaLanguage = (typeof PANDA_REQUIRED_LANGS)[number];

export const PANDA_FORBIDDEN_RESIDUE = [
  'Option 1', 'Option 2', 'Option 3',
  'Great for Google News', 'Viral Potential', 'Headline Ideas',
  'Why it will go viral', 'Since you are looking',
  'should be reviewed before publication',
  'AI strategy notes', 'prompt notes', 'editorial planning notes',
  'note to editor', 'draft recommendation', 'confidence score',
  'As an AI', 'Here is the article', 'I hope this helps', 'Certainly',
  'SEO Strategy', 'fake verified E-E-A-T', 'unsupported authority claims',
  'multilingual parity verified'
];

export const PANDA_SAFE_PROVENANCE_WORDING = [
  "Generated under SIA Protocol; pending Warroom validation.",
  "Source attribution limited to provided input.",
  "No independent verification claimed."
];

/**
 * FAIL-CLOSED CONDITIONS
 */
export const PANDA_FAIL_CLOSED_CODES = {
  LANGUAGE_MISSING: "LANGUAGE_MISSING",
  FIELD_MISSING: "FIELD_MISSING",
  SYSTEM_MISMATCH: "SYSTEM_MISMATCH",
  INVALID_LANGUAGE: "INVALID_LANGUAGE",
  RESIDUE_DETECTED: "RESIDUE_DETECTED",
  FAKE_VERIFICATION: "FAKE_VERIFICATION",
  UNSUPPORTED_SCORE: "UNSUPPORTED_SCORE",
  LANGUAGE_MISMATCH: "LANGUAGE_MISMATCH",
  RISK_NOTE_MISSING: "RISK_NOTE_MISSING",
  MALFORMED_JSON: "MALFORMED_JSON",
  EMPTY_BODY: "EMPTY_BODY",
  FOOTER_INTEGRITY_FAILURE: "FOOTER_INTEGRITY_FAILURE",
  PROMPT_META_DETECTED: "PROMPT_META_DETECTED",
  PROVENANCE_FAILURE: "PROVENANCE_FAILURE"
};

export const PANDA_WRITING_RULES = {
  HEADLINE: {
    minChars: 10,
    maxWords: 14,
    prohibited: ["clickbait", "sensational", "misleading", "over-certain", "SEO strategy"]
  },
  SUBHEADLINE: {
    minChars: 20,
    required: true
  },
  SUMMARY: {
    minChars: 50,
    maxChars: 300,
    prohibited: ["investment advice", "promotional framing", "fake verification"]
  },
  BODY: {
    minChars: 200,
    prohibited: ["notes to editor", "AI commentary", "prompt commentary", "made-up citations"]
  },
  KEY_INSIGHTS: {
    minItems: 3,
    prohibited: ["hype", "strategy notes", "unsupported certainty"]
  },
  RISK_NOTE: {
    minChars: 10,
    required: true,
    prohibited: ["deterministic outcomes", "guaranteed returns", "invented confidence"]
  }
};
