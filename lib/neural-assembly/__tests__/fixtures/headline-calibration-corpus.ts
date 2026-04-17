import type {
  HeadlineCalibrationBand,
  HeadlineOverallDecision,
  HeadlineRuleFamily,
  Language
} from '../../core-types'

export interface HeadlineCalibrationCorpusCase {
  id: string
  title: string
  category: string
  urgency: 'breaking' | 'standard' | 'evergreen'
  sourceLanguage: Language
  sourceTitle: string
  sourceLead: string
  sourceBodySummary: string
  sourceBodyFull: string
  sourceSchema?: Record<string, unknown>
  localizedTitles?: Partial<Record<Language, string>>
  localizedEntities?: Partial<Record<Language, string[]>>
  expected: {
    calibrationBand: HeadlineCalibrationBand
    overallDecision?: HeadlineOverallDecision
    calibrationProfileId: string
    mustIncludeRules?: HeadlineRuleFamily[]
  }
}

export const HEADLINE_CALIBRATION_CORPUS: ReadonlyArray<HeadlineCalibrationCorpusCase> = [
  {
    id: 'red_market_deterministic_claims',
    title: 'Red: deterministic market-moving claim with unsupported certainty',
    category: 'macro markets',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceTitle: 'Bitcoin Will Certainly Surge 300% Today After Regulator Approved Secret Plan',
    sourceLead: 'Analysts say market conditions remain uncertain as liquidity stays uneven.',
    sourceBodySummary: 'No official regulator filing confirms an approval and no evidence supports a 300% move today.',
    sourceBodyFull: 'Market participants remain split on direction. Filings reviewed by analysts show no confirmed approval decision and no deterministic one-day return expectation.',
    localizedTitles: {
      tr: 'Bitcoin kesin garanti 300% yukselecek ve gizli plan onaylandi',
      de: 'Bitcoin wird heute sicher um 300% steigen nach geheimer Genehmigung'
    },
    localizedEntities: {
      tr: ['Bitcoin'],
      de: ['Bitcoin']
    },
    expected: {
      calibrationBand: 'RED',
      overallDecision: 'HEADLINE_BLOCK',
      calibrationProfileId: 'market_regulatory_strict',
      mustIncludeRules: [
        'UNSUPPORTED_CERTAINTY',
        'CLICKBAIT_TEMPLATE'
      ]
    }
  },
  {
    id: 'red_legal_defamation_risk',
    title: 'Red: legal-risk language without adjudicated basis',
    category: 'legal enforcement',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceTitle: 'Court Confirms CEO Guilty of Massive Fraud Scheme',
    sourceLead: 'The hearing remains active and no final verdict was issued in open court.',
    sourceBodySummary: 'Court records show proceedings are ongoing and allegations are disputed by defense counsel.',
    sourceBodyFull: 'Legal filings reviewed today indicate the case is still pending. Prosecutors and defense presented arguments, but no final ruling has been published.',
    expected: {
      calibrationBand: 'RED',
      calibrationProfileId: 'market_regulatory_strict',
      mustIncludeRules: ['LEGAL_RISK_LANGUAGE']
    }
  },
  {
    id: 'amber_surface_divergence',
    title: 'Amber: title-surface inconsistency with conflicting SEO/social packaging',
    category: 'analysis',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceTitle: 'Fed Holds Rates Steady as Inflation Eases',
    sourceLead: 'The central bank held rates steady as inflation eased in the latest policy statement.',
    sourceBodySummary: 'Officials held benchmark rates steady and highlighted gradual inflation easing with data-dependent guidance.',
    sourceBodyFull: 'The committee statement kept policy rates steady as inflation eased. Officials highlighted gradual moderation and did not announce any abrupt policy shift.',
    sourceSchema: {
      '@type': 'NewsArticle',
      headline: 'Fed Holds Rates Steady as Inflation Eases',
      seoTitle: 'Fed Slashes Rates 50% in Emergency Move',
      openGraph: {
        title: 'Fed Holds Rates in Calm Session'
      },
      social: {
        title: 'Markets Panic After Emergency Fed Cut'
      }
    },
    expected: {
      calibrationBand: 'AMBER',
      calibrationProfileId: 'market_regulatory_strict',
      mustIncludeRules: ['TITLE_SURFACE_INCONSISTENCY']
    }
  },
  {
    id: 'amber_breaking_multilingual_drift',
    title: 'Amber: breaking headline drift in localized variants',
    category: 'breaking',
    urgency: 'breaking',
    sourceLanguage: 'en',
    sourceTitle: 'Central Bank Holds Special Meeting as Markets Stay Volatile',
    sourceLead: 'Officials convened a special meeting and published no policy decision yet.',
    sourceBodySummary: 'The central bank confirmed the meeting but withheld any final decision pending additional data.',
    sourceBodyFull: 'Minutes indicate that policymakers discussed contingency scenarios. No immediate policy action or guaranteed market outcome was announced.',
    localizedTitles: {
      tr: 'Merkez bankasi kesin olarak cokusu durdurdu ve tum risk bitti',
      ru: 'Regulyator garantiroval nemedlennyi rost bez riska'
    },
    localizedEntities: {
      tr: ['Merkez bankasi'],
      ru: ['Regulyator']
    },
    expected: {
      calibrationBand: 'AMBER',
      calibrationProfileId: 'breaking_sensitive',
      mustIncludeRules: ['MULTILINGUAL_DRIFT', 'LOCAL_LANGUAGE_EXAGGERATION']
    }
  },
  {
    id: 'green_policy_measured',
    title: 'Green: policy headline aligned to measured evidence',
    category: 'policy regulation',
    urgency: 'standard',
    sourceLanguage: 'en',
    sourceTitle: 'Senate Committee Releases Draft Climate Disclosure Framework',
    sourceLead: 'Lawmakers released a draft framework and opened a 30-day public comment period.',
    sourceBodySummary: 'The draft climate disclosure framework defines reporting timelines and remains in consultation.',
    sourceBodyFull: 'Committee materials show the draft climate disclosure framework entering consultation with a 30-day comment window. Agencies noted that formal adoption requires additional procedural steps.',
    localizedTitles: {
      tr: 'Senato komitesi iklim aciklama taslagini yayinladi',
      de: 'Senatsausschuss veroffentlicht entwurf fur klimaoffenlegung'
    },
    expected: {
      calibrationBand: 'GREEN',
      overallDecision: 'HEADLINE_PASS',
      calibrationProfileId: 'market_regulatory_strict'
    }
  }
]
