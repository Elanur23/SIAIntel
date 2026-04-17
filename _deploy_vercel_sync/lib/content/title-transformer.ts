/**
 * SIA HEADLINE TRANSFORMER v1.0
 * Transforms raw wire headlines into engaging, curiosity-inducing titles
 * Works client-side (no API call needed) for instant feedback
 */

// ─── PATTERN: Remove common wire prefixes ───
function stripWirePrefixes(title: string): string {
  return title
    .replace(/^(BREAKING|FLASH|ALERT|UPDATE|EXCLUSIVE|URGENT|REPORT)\s*[:\-–—|]\s*/i, '')
    .replace(/^(SON DAKİKA|FLAŞ|HABER|GÜNCELLEME|ÖZEL)\s*[:\-–—|]\s*/i, '')
    .trim()
}

// ─── PATTERN: Extract key data points from title ───
function extractDataPoints(title: string): { numbers: string[]; entities: string[]; action: string } {
  const numbers = title.match(/[-+]?\d+[.,]?\d*\s*%|[$€₺£¥]\s*[\d,.]+|[\d,.]+\s*(?:milyar|milyon|trilyon|billion|million|trillion|bps?|TL)/gi) || []
  
  const entityPatterns = /\b(Bitcoin|BTC|Ethereum|ETH|Fed|ECB|TCMB|SEC|S&P|NASDAQ|Dow|BIST|Gold|Oil|Trump|Erdogan|Erdoğan|Powell|Yellen|Lagarde|Apple|Google|Meta|Microsoft|Tesla|Nvidia|Amazon|XRP|Solana|Cardano|OPEC|IMF|NATO|EU|ABD|Türkiye|Turkey|China|Russia|Japan|Dollar|Euro|Sterling|Yen|Yuan)\b/gi
  const entities = [...new Set((title.match(entityPatterns) || []).map(e => e.trim()))]
  
  const actionPatterns = /\b(surge|crash|plunge|soar|spike|drop|fall|rise|jump|sink|rally|collapse|explode|tank|boom|dive|rocket|skyrocket|düşüş|yükseliş|çöküş|patlama|artış|sert|rekor|tarihi|şok|kriz|alarm)\b/gi
  const actions = title.match(actionPatterns) || []
  const action = actions[0]?.toLowerCase() || ''

  return { numbers, entities, action }
}

// ─── TR TEMPLATES ───
const TR_TEMPLATES = [
  (e: string[], n: string[]) => n[0] ? `${e[0] || 'Piyasa'}: ${n[0]} Hareketi Kurumsal Oyuncuları Alarma Geçirdi` : null,
  (e: string[], n: string[]) => e[0] ? `${e[0]} Cephesinden Kritik Sinyal — Piyasalar Ne Beklemeli?` : null,
  (e: string[], n: string[]) => n[0] ? `${n[0]}'lik Sarsıntı: ${e[0] || 'Yatırımcılar'} İçin Ne Anlama Geliyor?` : null,
  (e: string[], n: string[]) => e[0] && e[1] ? `${e[0]}-${e[1]} Hattında Kritik Kırılma — SIA Analizi` : null,
  (e: string[], n: string[]) => e[0] ? `${e[0]}: Herkesin Gözden Kaçırdığı 3 Kritik Detay` : null,
  (e: string[], n: string[]) => n[0] ? `Dikkat: ${n[0]} Eşiği Aşıldı — Domino Etkisi Başlayabilir` : null,
  (e: string[], n: string[]) => e[0] ? `SIA Radarı: ${e[0]} İçin Risk Matrisi Kırmızıya Döndü` : null,
  (e: string[], n: string[]) => e[0] ? `${e[0]} Fırtınası Kapıda — Kurumsal Pozisyonlar Ne Diyor?` : null,
]

// ─── EN TEMPLATES ───
const EN_TEMPLATES = [
  (e: string[], n: string[]) => n[0] ? `${e[0] || 'Market'}: ${n[0]} Move Triggers Institutional Alert` : null,
  (e: string[], n: string[]) => e[0] ? `Critical Signal From ${e[0]} — What Markets Should Expect` : null,
  (e: string[], n: string[]) => n[0] ? `The ${n[0]} Shock: What It Really Means for ${e[0] || 'Investors'}` : null,
  (e: string[], n: string[]) => e[0] && e[1] ? `${e[0]}-${e[1]} Axis: Critical Breakpoint — SIA Analysis` : null,
  (e: string[], n: string[]) => e[0] ? `${e[0]}: 3 Critical Details Everyone Is Missing` : null,
  (e: string[], n: string[]) => n[0] ? `Alert: ${n[0]} Threshold Breached — Domino Effect May Follow` : null,
  (e: string[], n: string[]) => e[0] ? `SIA Radar: ${e[0]} Risk Matrix Turned Red` : null,
  (e: string[], n: string[]) => e[0] ? `The ${e[0]} Storm Is Coming — What Institutional Positions Reveal` : null,
]

// ─── DETERMINISTIC HASH (for consistent template selection) ───
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

/**
 * Transform a raw wire headline into an engaging SIA-branded title
 * Returns the transformed title. If transformation fails, returns cleaned original.
 */
export function transformHeadline(rawTitle: string, lang: 'tr' | 'en' = 'en'): string {
  if (!rawTitle || rawTitle.trim().length < 5) return rawTitle

  const cleaned = stripWirePrefixes(rawTitle)
  const { numbers, entities, action } = extractDataPoints(cleaned)
  const templates = lang === 'tr' ? TR_TEMPLATES : EN_TEMPLATES

  // Try templates with a deterministic seed based on title content
  const seed = simpleHash(cleaned)
  const shuffled = [...templates].sort((a, b) => simpleHash(a.toString()) - simpleHash(b.toString()))

  for (let i = 0; i < shuffled.length; i++) {
    const idx = (seed + i) % shuffled.length
    const result = shuffled[idx](entities, numbers)
    if (result && result.length > 15 && result.length < 120) {
      return result
    }
  }

  // Fallback: Add engaging prefix if no template matched
  const prefixes = lang === 'tr'
    ? ['Kritik Analiz:', 'SIA İstihbarat:', 'Piyasa Radarı:', 'Derinlik Raporu:']
    : ['Critical Analysis:', 'SIA Intelligence:', 'Market Radar:', 'Deep Dive:']
  
  const prefix = prefixes[seed % prefixes.length]
  
  // Limit original title length and add prefix
  const shortTitle = cleaned.length > 80 ? cleaned.substring(0, 77) + '...' : cleaned
  return `${prefix} ${shortTitle}`
}
