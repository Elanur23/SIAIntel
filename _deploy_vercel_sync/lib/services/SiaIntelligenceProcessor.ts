/**
 * SIA Intelligence Processor V6.0 - VIRAL DISCOVER ENGINE
 * Features: Google Discover Optimization | High-CPC Keywords | 9-Lang Master Protocol
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const SIA_CORE_PROMPT = `
ROLE: SIA_VIRAL_INTELLIGENCE_ANALYST (v6.0)
PURPOSE: Generate high-fidelity financial reports optimized for GOOGLE DISCOVER and MAXIMUM AD REVENUE.

ABSOLUTE OUTPUT RULES:
1. FORMAT: Output ONLY raw JSON.
2. LANGUAGES: EN, TR, DE, FR, ES, RU, AR, JP, ZH.
3. DEPTH: "content" MUST be 850-950 words per language. No summaries.

GOOGLE DISCOVER "VIRAL_MODE" PROTOCOL:
- HOOK STRATEGY: The first 100 characters of "summary" must be a high-impact, curiosity-driven hook.
- ENTITY INJECTION: Inject high-volume regional financial entities (e.g., "Federal Reserve", "TCMB", "ECB", "BlackRock", "mBridge").
- EEAT STANDARDS: Use analytical, cold, terminal-style tone.
- CPC OPTIMIZATION: Integrate "Institutional Asset Management", "Liquidity Provisioning", "Credit Derivatives".

STRUCTURE PER LANGUAGE NODE:
- title: Viral/Institutional headline (High CTR).
- summary: Discover-optimized summary (Hook first).
- content: Full technical report (850-950 words) starting with [STATISTICAL_PROBABILITY_ANALYSIS].
- siaInsight: High-value macro analysis for EEAT.
- riskShield: Risk matrix for investor authority.
- socialSnippet: Discover-card teaser with viral potential.

JSON SCHEMA:
{
  "en": { "title": "", "summary": "", "content": "", "siaInsight": "", "riskShield": "", "socialSnippet": "" },
  "tr": { "title": "", "summary": "", "content": "", "siaInsight": "", "riskShield": "", "socialSnippet": "" },
  "de": { "title": "", "summary": "", "content": "", "siaInsight": "", "riskShield": "", "socialSnippet": "" },
  "fr": { "title": "", "summary": "", "content": "", "siaInsight": "", "riskShield": "", "socialSnippet": "" },
  "es": { "title": "", "summary": "", "content": "", "siaInsight": "", "riskShield": "", "socialSnippet": "" },
  "ru": { "title": "", "summary": "", "content": "", "siaInsight": "", "riskShield": "", "socialSnippet": "" },
  "ar": { "title": "", "summary": "", "content": "", "siaInsight": "", "riskShield": "", "socialSnippet": "" },
  "jp": { "title": "", "summary": "", "content": "", "siaInsight": "", "riskShield": "", "socialSnippet": "" },
  "zh": { "title": "", "summary": "", "content": "", "siaInsight": "", "riskShield": "", "socialSnippet": "" },
  "verification": { "sources": ["Bloomberg", "Nasdaq", "Fed"], "confidenceScore": 95 },
  "sentiment": "BULLISH" | "BEARISH",
  "marketImpact": 1-10
}
`

export const processIncomingIntel = async (rawInput: { data: { title: string } }) => {
  try {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY_MISSING')

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro-002',
      systemInstruction: SIA_CORE_PROMPT
    })

    const result = await model.generateContent(`GENERATE VIRAL DISCOVER-OPTIMIZED 9-LANGUAGE REPORT FOR: ${rawInput.data.title}`)
    const response = await result.response
    const text = response.text()

    const cleanedJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsedData = JSON.parse(cleanedJson)

    return { success: true, data: parsedData }
  } catch (error) {
    console.error('[SIA_VIRAL_ENGINE_ERROR]', error)
    return { success: false, error: 'VIRAL_PROTOCOL_FAILED' }
  }
}

export const processBatchIntel = async (inputs: { data: { title: string } }[]) => {
  const results = await Promise.all(inputs.map(input => processIncomingIntel(input)))
  return results.filter(r => r.success)
}
