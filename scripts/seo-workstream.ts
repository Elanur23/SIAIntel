/**
 * seo-workstream.ts
 *
 * End-to-end SEO workstream over real internal data.
 * Steps: extract → audit → rule-lock → fix-plan → validate → verdict
 *
 * Read-only against the database. No mutations. No external network.
 */

// @ts-ignore — better-sqlite3 has no @types installed in this project; runtime is fine
import Database from 'better-sqlite3'
import path from 'path'
import { generateSlugFromHeadline } from '../lib/seo/NewsArticleSchema'
import { buildArticleSummary, cleanArticleBody } from '../lib/warroom/article-seo'

// ── CONFIG ──────────────────────────────────────────────────────────────────
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'
const DB_PATH = path.resolve(process.cwd(), 'prisma', 'sentinel-x.db')
const LANGS = ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh'] as const
type Lang = typeof LANGS[number]

// ── STOP WORDS for slug rule ────────────────────────────────────────────────
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'of', 'and', 'or', 'to', 'in', 'on', 'for', 'with',
  'is', 'are', 'was', 'were', 'be', 'been', 'by', 'at', 'as', 'this', 'that',
])

// ── TYPES ───────────────────────────────────────────────────────────────────
interface ArticleRecord {
  id: string
  language: Lang
  meta_title: string | null
  meta_description: string | null
  slug: string
  canonical: string
  hreflang: Record<string, string>
  content_length: number
  internal_links: number
  structured_data: { '@type': string; headline: string; inLanguage: string } | null
  target_keyword: string | null
  source_title: string | null
}

type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

interface Issue {
  articleId: string
  language: Lang
  rule: string
  severity: Severity
  detail: string
}

// ============================================================================
// STEP 1 — AUTO DATA EXTRACTION
// ============================================================================

function buildRecord(id: string, lang: Lang, title: string | null, summary: string | null, content: string, hreflang: Record<string, string>): ArticleRecord {
  const cleaned = cleanArticleBody(content || '')
  const slug = title ? (generateSlugFromHeadline(title) || 'intelligence-report') : ''
  const linkRe = new RegExp(`${SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|href="\\/[a-z]{2}\\/`, 'gi')
  const internalLinks = (cleaned.match(linkRe) || []).length
  return {
    id,
    language: lang,
    meta_title: title,
    meta_description: summary || (content ? buildArticleSummary(content, title || '') : null),
    slug,
    canonical: `${SITE_URL}/${lang}/news/${slug || 'intelligence-report'}--${id}`,
    hreflang,
    content_length: cleaned.length,
    internal_links: internalLinks,
    structured_data: title ? { '@type': 'NewsArticle', headline: title, inLanguage: lang } : null,
    target_keyword: title ? deriveTargetKeyword(title) : null,
    source_title: title,
  }
}

function extractFromWarRoomArticle(db: any): ArticleRecord[] {
  let rows: Record<string, any>[] = []
  try {
    rows = db.prepare(`
      SELECT id, status,
        titleEn, titleTr, titleDe, titleFr, titleEs, titleRu, titleAr, titleJp, titleZh,
        summaryEn, summaryTr, summaryDe, summaryFr, summaryEs, summaryRu, summaryAr, summaryJp, summaryZh,
        contentEn, contentTr, contentDe, contentFr, contentEs, contentRu, contentAr, contentJp, contentZh
      FROM WarRoomArticle
      WHERE status = 'published' OR status = 'scheduled' OR status IS NULL
      ORDER BY publishedAt DESC LIMIT 200
    `).all() as Record<string, any>[]
  } catch { return [] }

  const records: ArticleRecord[] = []
  for (const row of rows) {
    const presentLangs: Lang[] = []
    for (const lang of LANGS) {
      const cap = lang.charAt(0).toUpperCase() + lang.slice(1)
      if (typeof row[`content${cap}`] === 'string' && row[`content${cap}`].trim().length > 0) {
        presentLangs.push(lang)
      }
    }
    if (presentLangs.length === 0) continue

    const hreflang: Record<string, string> = {}
    for (const lang of presentLangs) {
      const cap = lang.charAt(0).toUpperCase() + lang.slice(1)
      const t = row[`title${cap}`] || row.titleEn || ''
      hreflang[lang] = `${SITE_URL}/${lang}/news/${(generateSlugFromHeadline(t) || 'intelligence-report')}--${row.id}`
    }
    for (const lang of presentLangs) {
      const cap = lang.charAt(0).toUpperCase() + lang.slice(1)
      records.push(buildRecord(row.id, lang, row[`title${cap}`] ?? null, row[`summary${cap}`] ?? null, row[`content${cap}`] ?? '', hreflang))
    }
  }
  return records
}

function extractFromArticleTranslation(db: any): ArticleRecord[] {
  let trans: Record<string, any>[] = []
  try {
    trans = db.prepare(`
      SELECT t.id AS tid, t.articleId, t.lang, t.title, t.excerpt, t.content, t.slug,
             a.published, a.publishedAt
      FROM ArticleTranslation t
      JOIN Article a ON a.id = t.articleId
      WHERE a.published = 1 OR a.published IS NULL
      ORDER BY a.publishedAt DESC LIMIT 500
    `).all() as Record<string, any>[]
  } catch { return [] }

  const byArticle = new Map<string, Record<string, any>[]>()
  for (const t of trans) {
    if (!byArticle.has(t.articleId)) byArticle.set(t.articleId, [])
    byArticle.get(t.articleId)!.push(t)
  }

  const records: ArticleRecord[] = []
  for (const [articleId, group] of byArticle) {
    const hreflang: Record<string, string> = {}
    for (const t of group) {
      if (!LANGS.includes(t.lang)) continue
      hreflang[t.lang] = `${SITE_URL}/${t.lang}/news/${t.slug || 'intelligence-report'}--${articleId}`
    }
    for (const t of group) {
      if (!LANGS.includes(t.lang)) continue
      records.push(buildRecord(articleId, t.lang as Lang, t.title ?? null, t.excerpt ?? null, t.content ?? '', hreflang))
    }
  }
  return records
}

function extractDataset(): ArticleRecord[] {
  const candidates = [
    path.resolve(process.cwd(), 'prisma', 'dev.db'),
    path.resolve(process.cwd(), 'prisma', 'sentinel-x.db'),
    path.resolve(process.cwd(), 'prisma', 'news.db'),
  ]
  const all: ArticleRecord[] = []
  for (const file of candidates) {
    try {
      const db = new Database(file, { readonly: true, fileMustExist: true })
      const w = extractFromWarRoomArticle(db)
      const a = extractFromArticleTranslation(db)
      console.log(`  source ${path.basename(file)}: WarRoomArticle=${w.length} normalized=${a.length}`)
      all.push(...w, ...a)
      db.close()
    } catch {
      // skip missing/locked DBs silently
    }
  }
  // Dedup by id+language (in case same article exists in both DBs)
  const seen = new Set<string>()
  const out: ArticleRecord[] = []
  for (const r of all) {
    const k = `${r.id}|${r.language}`
    if (seen.has(k)) continue
    seen.add(k)
    out.push(r)
  }
  return out
}

function deriveTargetKeyword(title: string): string {
  const tokens = title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t && !STOP_WORDS.has(t) && t.length > 2)
  return tokens.slice(0, 3).join(' ')
}

// ============================================================================
// STEP 3 — SEO RULE LOCK  (defined BEFORE step 2 so audit & validation share rules)
// ============================================================================

const RULES = Object.freeze({
  slug: {
    pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*(?:--[a-z0-9]+)?$/, // lowercase, hyphens, optional --id suffix
    maxLen: 100,
    forbidStopWords: true,
  },
  meta_title: { min: 50, max: 60 },
  meta_description: { min: 150, max: 160 },
  content_min: 600,           // chars; below = thin content
  internal_links_min: 2,
  hreflang: { bidirectional: true, absoluteHttpsRequired: true },
  canonical: { absoluteHttpsRequired: true, mustMatchHreflangSelf: true },
  target_keyword: { maxDensityPct: 3.0, minOccurrencesInTitle: 0 },
} as const)

// ============================================================================
// STEP 2 — SEO AUDIT
// ============================================================================

function auditDataset(records: ArticleRecord[]): Issue[] {
  const issues: Issue[] = []

  // Build per-article translation set for hreflang bidirectional check
  const byArticle = new Map<string, ArticleRecord[]>()
  for (const r of records) {
    if (!byArticle.has(r.id)) byArticle.set(r.id, [])
    byArticle.get(r.id)!.push(r)
  }

  // Duplicate slug+lang detection
  const slugLangSeen = new Map<string, string>() // key=slug|lang -> articleId
  for (const r of records) {
    const key = `${r.slug}|${r.language}`
    if (r.slug && slugLangSeen.has(key) && slugLangSeen.get(key) !== r.id) {
      issues.push({ articleId: r.id, language: r.language, rule: 'duplicate_slug', severity: 'HIGH',
        detail: `slug "${r.slug}" used by another article (${slugLangSeen.get(key)})` })
    }
    if (r.slug) slugLangSeen.set(key, r.id)
  }

  // Duplicate meta_title within same language
  const titleLangSeen = new Map<string, string>()
  for (const r of records) {
    if (!r.meta_title) continue
    const key = `${r.meta_title.toLowerCase().trim()}|${r.language}`
    if (titleLangSeen.has(key) && titleLangSeen.get(key) !== r.id) {
      issues.push({ articleId: r.id, language: r.language, rule: 'duplicate_meta_title', severity: 'HIGH',
        detail: `meta_title duplicates article ${titleLangSeen.get(key)}` })
    }
    titleLangSeen.set(key, r.id)
  }

  // Per-record checks
  for (const r of records) {
    // Missing fields
    if (!r.meta_title) issues.push({ articleId: r.id, language: r.language, rule: 'missing_meta_title', severity: 'CRITICAL', detail: 'meta_title is null/empty' })
    if (!r.meta_description) issues.push({ articleId: r.id, language: r.language, rule: 'missing_meta_description', severity: 'CRITICAL', detail: 'meta_description is null/empty' })
    if (!r.slug) issues.push({ articleId: r.id, language: r.language, rule: 'missing_slug', severity: 'CRITICAL', detail: 'slug could not be generated' })
    if (!r.structured_data) issues.push({ articleId: r.id, language: r.language, rule: 'missing_structured_data', severity: 'HIGH', detail: 'no structured data emitted' })

    // Slug format
    if (r.slug) {
      const baseSlug = r.slug.split('--')[0] // strip --id suffix
      if (!RULES.slug.pattern.test(r.slug)) {
        issues.push({ articleId: r.id, language: r.language, rule: 'slug_format', severity: 'HIGH',
          detail: `slug "${r.slug}" does not match required format (lowercase, hyphen-separated)` })
      }
      if (r.slug.length > RULES.slug.maxLen) {
        issues.push({ articleId: r.id, language: r.language, rule: 'slug_too_long', severity: 'MEDIUM',
          detail: `slug length ${r.slug.length} > ${RULES.slug.maxLen}` })
      }
      if (RULES.slug.forbidStopWords && r.language === 'en') {
        const stops = baseSlug.split('-').filter(t => STOP_WORDS.has(t))
        if (stops.length > 0) {
          issues.push({ articleId: r.id, language: r.language, rule: 'slug_stop_words', severity: 'LOW',
            detail: `slug contains stop words: ${stops.join(',')}` })
        }
      }
    }

    // Meta title length
    if (r.meta_title) {
      const len = r.meta_title.length
      if (len < RULES.meta_title.min) {
        issues.push({ articleId: r.id, language: r.language, rule: 'meta_title_too_short', severity: 'MEDIUM',
          detail: `${len} < ${RULES.meta_title.min} chars` })
      } else if (len > RULES.meta_title.max) {
        issues.push({ articleId: r.id, language: r.language, rule: 'meta_title_too_long', severity: 'MEDIUM',
          detail: `${len} > ${RULES.meta_title.max} chars` })
      }
    }

    // Meta description length
    if (r.meta_description) {
      const len = r.meta_description.length
      if (len < RULES.meta_description.min) {
        issues.push({ articleId: r.id, language: r.language, rule: 'meta_description_too_short', severity: 'MEDIUM',
          detail: `${len} < ${RULES.meta_description.min} chars` })
      } else if (len > RULES.meta_description.max) {
        issues.push({ articleId: r.id, language: r.language, rule: 'meta_description_too_long', severity: 'MEDIUM',
          detail: `${len} > ${RULES.meta_description.max} chars` })
      }
    }

    // Canonical absolute HTTPS
    if (r.canonical && !/^https:\/\//.test(r.canonical)) {
      issues.push({ articleId: r.id, language: r.language, rule: 'canonical_not_absolute_https', severity: 'CRITICAL',
        detail: `canonical "${r.canonical}" must be absolute HTTPS` })
    }

    // Hreflang absolute HTTPS
    for (const [lang, url] of Object.entries(r.hreflang)) {
      if (!/^https:\/\//.test(url)) {
        issues.push({ articleId: r.id, language: r.language, rule: 'hreflang_not_absolute_https', severity: 'CRITICAL',
          detail: `hreflang.${lang} = "${url}" must be absolute HTTPS` })
      }
    }

    // Hreflang self-reference must equal canonical
    const selfHreflang = r.hreflang[r.language]
    if (selfHreflang && selfHreflang !== r.canonical) {
      issues.push({ articleId: r.id, language: r.language, rule: 'hreflang_canonical_mismatch', severity: 'HIGH',
        detail: `canonical "${r.canonical}" != hreflang.${r.language} "${selfHreflang}"` })
    }

    // Hreflang completeness — must include the record's own language
    if (!r.hreflang[r.language]) {
      issues.push({ articleId: r.id, language: r.language, rule: 'hreflang_missing_self', severity: 'CRITICAL',
        detail: `hreflang map missing entry for "${r.language}"` })
    }

    // Thin content
    if (r.content_length < RULES.content_min) {
      issues.push({ articleId: r.id, language: r.language, rule: 'thin_content', severity: 'HIGH',
        detail: `content_length ${r.content_length} < ${RULES.content_min}` })
    }

    // Internal linking density
    if (r.internal_links < RULES.internal_links_min) {
      issues.push({ articleId: r.id, language: r.language, rule: 'low_internal_links', severity: 'MEDIUM',
        detail: `internal_links ${r.internal_links} < ${RULES.internal_links_min}` })
    }

    // Over-optimization (keyword density)
    if (r.target_keyword && r.meta_title && r.content_length > 0) {
      const keyword = r.target_keyword.toLowerCase()
      const titleLower = r.meta_title.toLowerCase()
      const occurrencesInTitle = (titleLower.match(new RegExp(keyword.split(' ')[0], 'g')) || []).length
      if (occurrencesInTitle > 2) {
        issues.push({ articleId: r.id, language: r.language, rule: 'keyword_stuffing_title', severity: 'MEDIUM',
          detail: `target keyword stem appears ${occurrencesInTitle}× in title` })
      }
    }
  }

  // Hreflang bidirectional integrity within an article group
  for (const [articleId, group] of byArticle) {
    const knownLangs = new Set(group.map(g => g.language))
    for (const r of group) {
      const declaredLangs = Object.keys(r.hreflang)
      for (const declared of declaredLangs) {
        if (!knownLangs.has(declared as Lang)) {
          issues.push({ articleId, language: r.language, rule: 'hreflang_orphan_target', severity: 'HIGH',
            detail: `hreflang declares "${declared}" but no translation exists` })
        }
      }
      for (const known of knownLangs) {
        if (!r.hreflang[known]) {
          issues.push({ articleId, language: r.language, rule: 'hreflang_missing_sibling', severity: 'HIGH',
            detail: `translation "${known}" exists but not declared in hreflang` })
        }
      }
    }
  }

  return issues
}

function classifyAndScore(records: ArticleRecord[], issues: Issue[]) {
  const counts: Record<Severity, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
  for (const i of issues) counts[i.severity]++

  // Health score: start 100, deduct per issue weighted by severity, normalized by record count
  const weights: Record<Severity, number> = { CRITICAL: 10, HIGH: 4, MEDIUM: 1.5, LOW: 0.5 }
  const totalDeduction = issues.reduce((s, i) => s + weights[i.severity], 0)
  const denom = Math.max(1, records.length)
  const score = Math.max(0, Math.round(100 - (totalDeduction / denom)))
  return { counts, score }
}

// ============================================================================
// STEP 4 — FIX PLAN (no guessing)
// ============================================================================

interface FixPlanItem {
  articleId: string
  language: Lang
  rule: string
  severity: Severity
  action: string
  // Concrete corrected value (only when deterministically derivable)
  correctedValue?: string | Record<string, string>
}

function generateFixPlan(records: ArticleRecord[], issues: Issue[]): FixPlanItem[] {
  const plan: FixPlanItem[] = []
  const recIndex = new Map<string, ArticleRecord>()
  for (const r of records) recIndex.set(`${r.id}|${r.language}`, r)

  const order: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
  const sorted = [...issues].sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity))

  for (const i of sorted) {
    const r = recIndex.get(`${i.articleId}|${i.language}`)
    if (!r) continue

    switch (i.rule) {
      case 'missing_meta_title':
        plan.push({ ...i, action: 'derive meta_title from H1/source title; reject if both missing' })
        break
      case 'missing_meta_description':
        if (r.source_title || r.content_length > 0) {
          plan.push({ ...i, action: 'auto-derive via buildArticleSummary(content, title)',
            correctedValue: buildArticleSummary('', r.source_title || '').slice(0, 158) })
        } else {
          plan.push({ ...i, action: 'cannot auto-fix: no source content available' })
        }
        break
      case 'missing_slug':
      case 'slug_format':
      case 'slug_stop_words':
      case 'slug_too_long': {
        if (r.source_title) {
          let s = generateSlugFromHeadline(r.source_title) || 'intelligence-report'
          // strip stop words for English
          if (r.language === 'en') {
            s = s.split('-').filter(t => !STOP_WORDS.has(t)).join('-') || 'intelligence-report'
          }
          s = s.slice(0, RULES.slug.maxLen)
          plan.push({ ...i, action: 'regenerate slug from title with stop-word + length rules',
            correctedValue: s })
        } else {
          plan.push({ ...i, action: 'cannot auto-fix: no title to derive slug' })
        }
        break
      }
      case 'canonical_not_absolute_https':
      case 'hreflang_canonical_mismatch':
      case 'hreflang_not_absolute_https':
      case 'hreflang_missing_self': {
        const newSlug = r.slug || (r.source_title ? generateSlugFromHeadline(r.source_title) : '')
        if (newSlug) {
          plan.push({ ...i, action: 'rebuild canonical/hreflang as absolute HTTPS URLs using SITE_URL + lang + slug + id',
            correctedValue: `${SITE_URL}/${r.language}/news/${newSlug}--${r.id}` })
        } else {
          plan.push({ ...i, action: 'cannot auto-fix without slug' })
        }
        break
      }
      case 'meta_title_too_long':
        plan.push({ ...i, action: `truncate meta_title to ${RULES.meta_title.max} chars at word boundary`,
          correctedValue: r.meta_title ? truncateAtBoundary(r.meta_title, RULES.meta_title.max) : undefined })
        break
      case 'meta_title_too_short':
        plan.push({ ...i, action: `flag for editorial — extend to >= ${RULES.meta_title.min} chars (no auto-fix)` })
        break
      case 'meta_description_too_long':
        plan.push({ ...i, action: `truncate meta_description to ${RULES.meta_description.max} chars at word boundary`,
          correctedValue: r.meta_description ? truncateAtBoundary(r.meta_description, RULES.meta_description.max) : undefined })
        break
      case 'meta_description_too_short':
        plan.push({ ...i, action: `flag for editorial — extend to >= ${RULES.meta_description.min} chars (no auto-fix)` })
        break
      case 'duplicate_slug':
        plan.push({ ...i, action: 'append --{id} disambiguator (already canonical pattern); else flag' })
        break
      case 'duplicate_meta_title':
        plan.push({ ...i, action: 'flag for editorial — title must be rewritten (no auto-fix)' })
        break
      case 'thin_content':
        plan.push({ ...i, action: 'flag for editorial — expand content (no auto-fix)' })
        break
      case 'low_internal_links':
        plan.push({ ...i, action: 'flag for editorial — add at least 2 contextual internal links (no auto-fix)' })
        break
      case 'missing_structured_data':
        if (r.source_title) {
          plan.push({ ...i, action: 'emit minimal NewsArticle structured data',
            correctedValue: JSON.stringify({ '@type': 'NewsArticle', headline: r.source_title, inLanguage: r.language }) })
        } else {
          plan.push({ ...i, action: 'cannot auto-fix without title' })
        }
        break
      case 'hreflang_orphan_target':
        plan.push({ ...i, action: 'remove hreflang entry for missing translation' })
        break
      case 'hreflang_missing_sibling':
        plan.push({ ...i, action: 'add hreflang entry for existing translation using canonical URL pattern' })
        break
      case 'keyword_stuffing_title':
        plan.push({ ...i, action: 'flag for editorial — reduce keyword repetition in title (no auto-fix)' })
        break
      default:
        plan.push({ ...i, action: 'no automated fix available' })
    }
  }
  return plan
}

function truncateAtBoundary(s: string, max: number): string {
  if (s.length <= max) return s
  const slice = s.slice(0, max)
  const lastSpace = slice.lastIndexOf(' ')
  return (lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice).trim()
}

// ============================================================================
// STEP 4b — APPLY VIRTUAL PATCH (in memory)
// ============================================================================

function applyVirtualPatch(records: ArticleRecord[], plan: FixPlanItem[]): ArticleRecord[] {
  const patched = records.map(r => ({ ...r, hreflang: { ...r.hreflang } }))
  const idx = new Map<string, ArticleRecord>()
  for (const r of patched) idx.set(`${r.id}|${r.language}`, r)

  // Group plan items per article for hreflang rebuild
  const articleGroups = new Map<string, ArticleRecord[]>()
  for (const r of patched) {
    if (!articleGroups.has(r.id)) articleGroups.set(r.id, [])
    articleGroups.get(r.id)!.push(r)
  }

  for (const item of plan) {
    const r = idx.get(`${item.articleId}|${item.language}`)
    if (!r || item.correctedValue === undefined) continue

    const v = item.correctedValue
    switch (item.rule) {
      case 'missing_slug':
      case 'slug_format':
      case 'slug_stop_words':
      case 'slug_too_long':
        if (typeof v === 'string') r.slug = v
        break
      case 'meta_title_too_long':
        if (typeof v === 'string') r.meta_title = v
        break
      case 'meta_description_too_long':
      case 'missing_meta_description':
        if (typeof v === 'string') r.meta_description = v
        break
      case 'missing_structured_data':
        if (typeof v === 'string') {
          try { r.structured_data = JSON.parse(v) } catch { /* ignore */ }
        }
        break
    }
  }

  // Rebuild canonical + hreflang deterministically post-patch
  for (const [articleId, group] of articleGroups) {
    const knownLangs = group.map(g => g.language)
    for (const r of group) {
      r.canonical = `${SITE_URL}/${r.language}/news/${r.slug || 'intelligence-report'}--${r.id}`
      const newHreflang: Record<string, string> = {}
      for (const lang of knownLangs) {
        const sibling = group.find(g => g.language === lang)!
        newHreflang[lang] = `${SITE_URL}/${lang}/news/${sibling.slug || 'intelligence-report'}--${articleId}`
      }
      r.hreflang = newHreflang
    }
  }

  return patched
}

// ============================================================================
// STEP 5 — VALIDATION
// ============================================================================

function validatePatched(records: ArticleRecord[]): { ok: boolean; issues: Issue[] } {
  const issues = auditDataset(records)
  // Only CRITICAL/HIGH issues block; MEDIUM/LOW are surfaced but non-blocking
  const blocking = issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH')
  return { ok: blocking.length === 0, issues }
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log('═══ STEP 1 — AUTO DATA EXTRACTION ═══')
  const records = extractDataset()
  if (records.length === 0) {
    console.error('FAIL: system has zero articles')
    process.exit(1)
  }
  const articleCount = new Set(records.map(r => r.id)).size
  console.log(`  extracted: ${records.length} translation records across ${articleCount} articles`)
  const langDist: Record<string, number> = {}
  for (const r of records) langDist[r.language] = (langDist[r.language] || 0) + 1
  console.log(`  language distribution: ${Object.entries(langDist).map(([k, v]) => `${k}=${v}`).join(', ')}`)

  console.log('\n═══ STEP 2 — SEO AUDIT ═══')
  const issues = auditDataset(records)
  const { counts, score } = classifyAndScore(records, issues)
  console.log(`  health score: ${score}/100`)
  console.log(`  issues: CRITICAL=${counts.CRITICAL} HIGH=${counts.HIGH} MEDIUM=${counts.MEDIUM} LOW=${counts.LOW}`)

  // Top 5 critical fixes (rule-grouped)
  const ruleAgg = new Map<string, { severity: Severity; count: number; example: string }>()
  for (const i of issues) {
    const k = i.rule
    if (!ruleAgg.has(k)) ruleAgg.set(k, { severity: i.severity, count: 0, example: i.detail })
    ruleAgg.get(k)!.count++
  }
  const aggSorted = [...ruleAgg.entries()].sort((a, b) => {
    const o: Record<Severity, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
    const sevDiff = o[a[1].severity] - o[b[1].severity]
    return sevDiff !== 0 ? sevDiff : b[1].count - a[1].count
  })
  console.log('\n  TOP CRITICAL FIXES:')
  aggSorted.filter(([_, v]) => v.severity === 'CRITICAL').slice(0, 5).forEach(([rule, v], idx) => {
    console.log(`    ${idx + 1}. [${v.severity}] ${rule} (${v.count}×) e.g. ${v.example}`)
  })
  console.log('\n  QUICK WINS (HIGH/MEDIUM by frequency):')
  aggSorted.filter(([_, v]) => v.severity === 'HIGH' || v.severity === 'MEDIUM').slice(0, 5).forEach(([rule, v]) => {
    console.log(`    - [${v.severity}] ${rule} (${v.count}×)`)
  })

  console.log('\n═══ STEP 3 — SEO RULE LOCK ═══')
  console.log(`  slug:             pattern=${RULES.slug.pattern}  maxLen=${RULES.slug.maxLen}  forbidStopWords=${RULES.slug.forbidStopWords}`)
  console.log(`  meta_title:       ${RULES.meta_title.min}-${RULES.meta_title.max} chars`)
  console.log(`  meta_description: ${RULES.meta_description.min}-${RULES.meta_description.max} chars`)
  console.log(`  content_min:      ${RULES.content_min} chars`)
  console.log(`  internal_links:   >= ${RULES.internal_links_min}`)
  console.log(`  hreflang:         bidirectional + absolute HTTPS required`)
  console.log(`  canonical:        absolute HTTPS + must equal hreflang[self]`)

  console.log('\n═══ STEP 4 — FIX PLAN ═══')
  const plan = generateFixPlan(records, issues)
  const planAgg = new Map<string, number>()
  for (const p of plan) planAgg.set(p.rule, (planAgg.get(p.rule) || 0) + 1)
  console.log(`  total fix items: ${plan.length}`)
  ;[...planAgg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([rule, count]) => {
    const sample = plan.find(p => p.rule === rule)!
    console.log(`    [${sample.severity}] ${rule} (${count}×) → ${sample.action}`)
  })

  console.log('\n═══ STEP 4b — VIRTUAL PATCH (in-memory) ═══')
  const patched = applyVirtualPatch(records, plan)
  console.log(`  patched ${patched.length} records (no DB writes)`)

  console.log('\n═══ STEP 5 — VALIDATION ═══')
  const validation = validatePatched(patched)
  const post = classifyAndScore(patched, validation.issues)
  console.log(`  post-patch health score: ${post.score}/100`)
  console.log(`  remaining issues: CRITICAL=${post.counts.CRITICAL} HIGH=${post.counts.HIGH} MEDIUM=${post.counts.MEDIUM} LOW=${post.counts.LOW}`)

  console.log('\n═══ STEP 6 — FINAL VERDICT ═══')
  if (validation.ok) {
    console.log('PASS — SEO ready for publish')
    console.log(`\n  pre-patch score:  ${score}/100`)
    console.log(`  post-patch score: ${post.score}/100`)
    process.exit(0)
  } else {
    const blocking = validation.issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH')
    const blockingAgg = new Map<string, { severity: Severity; count: number; example: string }>()
    for (const i of blocking) {
      if (!blockingAgg.has(i.rule)) blockingAgg.set(i.rule, { severity: i.severity, count: 0, example: i.detail })
      blockingAgg.get(i.rule)!.count++
    }
    console.log('FAIL — unresolved blocking issues:')
    ;[...blockingAgg.entries()]
      .sort((a, b) => (a[1].severity === 'CRITICAL' ? -1 : 1))
      .forEach(([rule, v]) => {
        console.log(`  - [${v.severity}] ${rule} (${v.count}×) e.g. ${v.example}`)
      })
    process.exit(1)
  }
}

main()
