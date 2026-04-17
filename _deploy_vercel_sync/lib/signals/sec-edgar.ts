/**
 * SIA Intelligence — SEC EDGAR Signal Fetcher
 *
 * Fetches Form 8-K (material corporate events) from SEC EDGAR's public Atom feed.
 * No API key required. Complies with SEC fair-access policy via User-Agent header.
 *
 * High-value 8-K items (market-moving events):
 *  2.01 Acquisition/Disposition · 2.02 Earnings · 1.03 Bankruptcy
 *  5.01 Change of Control · 4.01 Auditor Change · 5.02 Officer Departure
 */

import type { RawSignal } from './types'

const EDGAR_RSS =
  'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K&dateb=&owner=include&count=40&search_text=&output=atom'

// Weight table: 8-K item code → relevance weight added to base score
const ITEM_WEIGHTS: Record<string, { weight: number; label: string }> = {
  '1.01': { weight: 20, label: 'Material Definitive Agreement' },
  '1.02': { weight: 20, label: 'Termination of Material Agreement' },
  '1.03': { weight: 35, label: 'Bankruptcy / Receivership' },
  '2.01': { weight: 35, label: 'Acquisition or Disposition' },
  '2.02': { weight: 30, label: 'Results of Operations (Earnings)' },
  '2.04': { weight: 22, label: 'Triggering Events — Acceleration' },
  '2.05': { weight: 20, label: 'Exit Activities / Restructuring' },
  '2.06': { weight: 20, label: 'Material Impairments' },
  '3.01': { weight: 28, label: 'Notice of Delisting' },
  '3.02': { weight: 18, label: 'Unregistered Sales of Equity' },
  '4.01': { weight: 35, label: 'Auditor Change' },
  '4.02': { weight: 28, label: 'Non-Reliance on Prior Financials' },
  '5.01': { weight: 32, label: 'Change of Control' },
  '5.02': { weight: 25, label: 'Director / Officer Departure or Appointment' },
  '5.06': { weight: 22, label: 'Shell Company Status Change' },
  '7.01': { weight: 18, label: 'Regulation FD Disclosure' },
  '8.01': { weight: 12, label: 'Other Material Event' },
}

// Major companies get a score boost
const MAJOR_COMPANY_TERMS = [
  'Apple', 'Microsoft', 'NVIDIA', 'Amazon', 'Alphabet', 'Google', 'Meta',
  'Tesla', 'Berkshire', 'JPMorgan', 'Goldman', 'Morgan Stanley', 'Netflix',
  'Intel', 'AMD', 'Boeing', 'Disney', 'Walmart', 'Bank of America',
  'Chevron', 'ExxonMobil', 'Salesforce', 'Adobe', 'Oracle', 'Cisco',
  'Qualcomm', 'Broadcom', 'Visa', 'Mastercard', 'UnitedHealth', 'Pfizer',
]

function extractItems(text: string): string[] {
  const items: string[] = []
  const matches = text.matchAll(/Item\s+(\d+\.\d+)/gi)
  for (const m of matches) items.push(m[1])
  return [...new Set(items)]
}

function isMajorCompany(name: string): boolean {
  const lower = name.toLowerCase()
  return MAJOR_COMPANY_TERMS.some(t => lower.includes(t.toLowerCase()))
}

function itemWeight(items: string[]): number {
  if (!items.length) return 10
  return items.reduce((max, item) => Math.max(max, ITEM_WEIGHTS[item]?.weight ?? 10), 10)
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function fetchSecEdgarSignals(): Promise<RawSignal[]> {
  const res = await fetch(EDGAR_RSS, {
    headers: {
      // SEC requires identifying User-Agent — must include name + email
      'User-Agent': 'SIAIntel signal-fetcher contact@siaintel.com',
      'Accept': 'application/atom+xml, application/xml, text/xml',
    },
    next: { revalidate: 300 }, // server-side cache 5 min
  })

  if (!res.ok) throw new Error(`SEC EDGAR responded ${res.status}`)

  const xml = await res.text()
  const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) ?? []
  const signals: RawSignal[] = []

  for (const entry of entries.slice(0, 25)) {
    const get = (tag: string) =>
      entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1]?.trim() ?? ''

    const title   = stripHtml(get('title'))
    const link    = entry.match(/<link[^>]+href="([^"]+)"/)?.[1] ?? ''
    const updated = get('updated')
    const summary = stripHtml(get('summary'))
    const id      = get('id')

    // "8-K - COMPANY NAME (CIK) (Filer)" → extract company name
    const company = title.match(/8-K\s*-\s*([^(]+)/i)?.[1]?.trim() ?? 'Unknown'

    const items      = extractItems(summary || title)
    const weight     = itemWeight(items)
    const isMajor    = isMajorCompany(company)
    const itemLabels = items.map(i => ITEM_WEIGHTS[i]?.label ?? `Item ${i}`).filter(Boolean)

    let rawScore = 40 + weight
    if (isMajor) rawScore += 20
    rawScore = Math.min(rawScore, 95)

    signals.push({
      id: `sec_${id.split('/').pop() ?? Date.now()}`,
      source: 'SEC_8K',
      category: 'STOCKS',
      title: `SEC 8-K ▸ ${company}`,
      summary: itemLabels.length
        ? `${company} reported: ${itemLabels.join(' · ')}.`
        : `${company} filed a material event (Form 8-K) with the SEC.`,
      entities: [company, ...items.map(i => `Item ${i}`)],
      url: link || 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K',
      publishedAt: updated ? new Date(updated).toISOString() : new Date().toISOString(),
      rawScore,
      metadata: {
        items, itemLabels, company, isMajor,
        // Legal attribution
        sourceAttribution: 'U.S. Securities and Exchange Commission — EDGAR public filing database (sec.gov)',
        legalBasis: '17 CFR §240 — Securities Exchange Act of 1934, Section 13 and Section 15(d)',
        dataLicense: 'Public domain — U.S. Government work',
      },
    })
  }

  return signals
}
