/**
 * SIA Workspace I/O — Safe Read & Write
 *
 * Guarantees:
 *  - BOM (Byte Order Mark) is stripped on every read
 *  - All 9 language keys always exist after read (empty string fallback)
 *  - All writes use UTF-8 without BOM (Node default)
 *  - JSON parse errors are thrown with clear messages
 *  - Windows-1252 Mojibake is auto-detected and reversed on every read
 */

import fs from 'fs/promises'
import path from 'path'

const WORKSPACE_PATH = path.join(process.cwd(), 'ai_workspace.json')

/**
 * Combined reverse byte map covering:
 *  - Windows-1252 specials (0x80–0x9F range, Euro/curly-quote overrides)
 *  - Windows-1254 (Turkish) overrides (0xD0–0xFE range: Ğ, İ, Ş, ğ, ı, ş)
 *
 * Needed because:
 *  - Latin/Turkish content (TR, DE, FR, ES) was mangled through Windows-1252
 *  - Cyrillic content (RU) was mangled through Windows-1254 (ISO-8859-9 base)
 *    where byte 0xD0 maps to Ğ instead of Ð.
 */
const MOJIBAKE_REVERSE: Record<number, number> = {
  // Win-1252 / Win-1254 shared specials (0x80–0x9F)
  0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A,
  0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92,
  0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C,
  0x017E: 0x9E, 0x0178: 0x9F,
  // Win-1254 (Turkish ISO-8859-9) overrides — needed to fix Cyrillic Mojibake
  0x011E: 0xD0, // Ğ → byte 0xD0
  0x0130: 0xDD, // İ → byte 0xDD
  0x015E: 0xDE, // Ş → byte 0xDE
  0x011F: 0xF0, // ğ → byte 0xF0
  0x0131: 0xFD, // ı → byte 0xFD
  0x015F: 0xFE, // ş → byte 0xFE
}

/**
 * Detects and reverses Windows-1252 / Windows-1254 Mojibake.
 *
 * Corruption path: UTF-8 bytes were incorrectly interpreted as Win-1252 or
 * Win-1254 (Turkish), then the resulting code points were stored as UTF-8.
 *
 * Examples:
 *  - "İ" (U+0130) → UTF-8 [0xC4, 0xB0] → Win-1252 "Ä°"    (Turkish/Latin)
 *  - "Г" (U+0413) → UTF-8 [0xD0, 0x93] → Win-1254 "Ğ\u201C" (Cyrillic/Russian)
 */
function fixMojibake(text: string): string {
  if (!text) return text
  // Quick bail: only attempt if typical garble indicators are present
  if (!/[ÃÄÅÆÇĞÑ°¼½¾œžŸ]/.test(text)) return text
  try {
    const bytes: number[] = []
    for (let i = 0; i < text.length; i++) {
      const cp = text.charCodeAt(i)
      if (cp < 0x80) {
        bytes.push(cp)
      } else if (MOJIBAKE_REVERSE[cp] !== undefined) {
        bytes.push(MOJIBAKE_REVERSE[cp])
      } else if (cp >= 0x80 && cp <= 0xFF) {
        bytes.push(cp)
      } else {
        // Genuine Unicode character outside any legacy encoding range → abort
        return text
      }
    }
    const fixed = Buffer.from(bytes).toString('utf8')
    if (fixed.includes('\uFFFD') || fixed === text) return text
    return fixed
  } catch {
    return text
  }
}

function fixMojibakeDeep(obj: unknown): unknown {
  if (typeof obj === 'string') return fixMojibake(obj)
  if (Array.isArray(obj)) return obj.map(fixMojibakeDeep)
  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      result[k] = fixMojibakeDeep(v)
    }
    return result
  }
  return obj
}

const ALL_LANGS = ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh'] as const

export type LangKey = typeof ALL_LANGS[number]

export interface WorkspaceLangNode {
  title:    string
  summary:  string
  content:  string
  imageUrl: string
  insight?: string
  risk?:    string
}

export type Workspace = Record<LangKey, WorkspaceLangNode> & {
  imageUrl?: string
  category?: string
}

const EMPTY_NODE: WorkspaceLangNode = {
  title: '', summary: '', content: '', imageUrl: ''
}

/** Read ai_workspace.json — strips BOM, ensures all 9 lang keys exist */
export async function readWorkspace(): Promise<Workspace> {
  let raw: string
  try {
    raw = await fs.readFile(WORKSPACE_PATH, 'utf8')
  } catch {
    throw new Error('ai_workspace.json not found or not readable')
  }

  // Strip UTF-8 BOM if present (PowerShell adds this)
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1)

  let ws: Record<string, unknown>
  try {
    ws = JSON.parse(raw)
  } catch (e: any) {
    throw new Error(`ai_workspace.json is invalid JSON: ${e.message}`)
  }

  // Auto-fix Windows-1252 Mojibake in all string fields
  ws = fixMojibakeDeep(ws) as Record<string, unknown>

  // Ensure all 9 language keys exist
  for (const lang of ALL_LANGS) {
    if (!ws[lang] || typeof ws[lang] !== 'object') {
      ws[lang] = { ...EMPTY_NODE }
    } else {
      const node = ws[lang] as Record<string, unknown>
      if (typeof node.title   !== 'string') node.title   = ''
      if (typeof node.summary !== 'string') node.summary = ''
      if (typeof node.content !== 'string') node.content = ''
      if (typeof node.imageUrl !== 'string') node.imageUrl = ''
    }
  }

  return ws as Workspace
}

/** Write ai_workspace.json — always UTF-8, no BOM, pretty-printed */
export async function writeWorkspace(ws: Record<string, unknown>): Promise<void> {
  const json = JSON.stringify(ws, null, 2)
  // fs.writeFile with 'utf8' never adds BOM
  await fs.writeFile(WORKSPACE_PATH, json, 'utf8')
}

/** Returns list of language keys that have no content (empty or missing) */
export function getMissingLangs(ws: Workspace): LangKey[] {
  return ALL_LANGS.filter(lang => {
    const content = ws[lang]?.content ?? ''
    return content.trim().length === 0
  })
}

/** Returns word count — CJK aware */
export function countWordsWs(text: string): number {
  if (!text) return 0
  const cjk = (text.match(/[\u3000-\u9fff\uac00-\ud7af\uff00-\uffef]/g) || []).length
  if (cjk > 30) return Math.round(cjk / 2)
  return text.trim().split(/\s+/).filter(Boolean).length
}
