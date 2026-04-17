/**
 * WORKSPACE MANAGER
 * 
 * Manages ai_workspace.json with:
 * - Chronological sorting (newest first)
 * - Manual-only mode enforcement
 * - Article lifecycle management
 */

import fs from 'fs/promises'
import path from 'path'
import { isAutoWorkspaceWriteAllowed, enforceManualOnlyMode } from './ingestion-kill-switch'

const WORKSPACE_PATH = path.join(process.cwd(), 'ai_workspace.json')

export interface WorkspaceArticle {
  id: string
  created_at: string
  updated_at?: string
  status: 'draft' | 'auditing' | 'sealed' | 'deployed'
  source: 'manual' | 'automatic'
  languages: string[]
  [key: string]: any // Language-specific content
}

export interface Workspace {
  status: string
  mode: 'MANUAL_ONLY' | 'AUTOMATIC'
  last_cleaned: string
  message: string
  articles: WorkspaceArticle[]
  ingestion_config: {
    MANUAL_ONLY_MODE: boolean
    ALLOW_AUTO_FETCH: boolean
    ALLOW_AUTO_WORKSPACE_WRITE: boolean
    ALLOW_SCHEDULED_CRAWLERS: boolean
    ALLOW_EXTERNAL_SIGNALS: boolean
    REQUIRE_MANUAL_APPROVAL: boolean
  }
}

/**
 * Read workspace with error handling
 */
export async function readWorkspace(): Promise<Workspace> {
  try {
    const data = await fs.readFile(WORKSPACE_PATH, 'utf8')
    // Remove BOM if present
    const cleanData = data.replace(/^\uFEFF/, '')
    return JSON.parse(cleanData)
  } catch (error) {
    console.error('Failed to read workspace:', error)
    // Return clean slate if file doesn't exist or is corrupted
    return {
      status: 'CLEAN_SLATE',
      mode: 'MANUAL_ONLY',
      last_cleaned: new Date().toISOString(),
      message: '🛑 MANUAL_ONLY_MODE ACTIVE: All automatic ingestion disabled.',
      articles: [],
      ingestion_config: {
        MANUAL_ONLY_MODE: true,
        ALLOW_AUTO_FETCH: false,
        ALLOW_AUTO_WORKSPACE_WRITE: false,
        ALLOW_SCHEDULED_CRAWLERS: false,
        ALLOW_EXTERNAL_SIGNALS: false,
        REQUIRE_MANUAL_APPROVAL: true,
      },
    }
  }
}

/**
 * Write workspace with chronological sorting (newest first)
 */
export async function writeWorkspace(workspace: Workspace, source: 'manual' | 'automatic' = 'manual'): Promise<void> {
  // Enforce manual-only mode for automatic writes
  if (source === 'automatic' && !isAutoWorkspaceWriteAllowed()) {
    enforceManualOnlyMode('workspace write')
  }

  // Sort articles by created_at (newest first)
  workspace.articles.sort((a, b) => {
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    return dateB - dateA // Descending order (newest first)
  })

  // Write with pretty formatting
  const json = JSON.stringify(workspace, null, 2)
  await fs.writeFile(WORKSPACE_PATH, json, 'utf8')
}

/**
 * Add article to workspace (manual entry only)
 */
export async function addArticle(
  article: Omit<WorkspaceArticle, 'created_at' | 'source' | 'updated_at'>
): Promise<void> {
  const workspace = await readWorkspace()

  const newArticle: WorkspaceArticle = {
    id: article.id,
    status: article.status,
    languages: article.languages,
    created_at: new Date().toISOString(),
    source: 'manual',
    ...article,
  }

  workspace.articles.push(newArticle)
  await writeWorkspace(workspace, 'manual')
}

/**
 * Update article status
 */
export async function updateArticleStatus(
  articleId: string,
  status: WorkspaceArticle['status']
): Promise<void> {
  const workspace = await readWorkspace()
  const article = workspace.articles.find((a) => a.id === articleId)

  if (!article) {
    throw new Error(`Article ${articleId} not found`)
  }

  article.status = status
  article.updated_at = new Date().toISOString()

  await writeWorkspace(workspace, 'manual')
}

/**
 * Remove article from workspace
 */
export async function removeArticle(articleId: string): Promise<void> {
  const workspace = await readWorkspace()
  workspace.articles = workspace.articles.filter((a) => a.id !== articleId)
  await writeWorkspace(workspace, 'manual')
}

/**
 * Clean workspace (remove all draft articles)
 */
export async function cleanWorkspace(): Promise<{ removed: number }> {
  const workspace = await readWorkspace()
  const initialCount = workspace.articles.length

  // Keep only sealed or deployed articles
  workspace.articles = workspace.articles.filter(
    (a) => a.status === 'sealed' || a.status === 'deployed'
  )

  workspace.last_cleaned = new Date().toISOString()
  await writeWorkspace(workspace, 'manual')

  return { removed: initialCount - workspace.articles.length }
}

/**
 * Get articles sorted chronologically (newest first)
 */
export async function getArticles(filter?: {
  status?: WorkspaceArticle['status']
  source?: 'manual' | 'automatic'
  limit?: number
}): Promise<WorkspaceArticle[]> {
  const workspace = await readWorkspace()
  let articles = workspace.articles

  if (filter?.status) {
    articles = articles.filter((a) => a.status === filter.status)
  }

  if (filter?.source) {
    articles = articles.filter((a) => a.source === filter.source)
  }

  if (filter?.limit) {
    articles = articles.slice(0, filter.limit)
  }

  return articles
}

/**
 * Get workspace statistics
 */
export async function getWorkspaceStats(): Promise<{
  total: number
  byStatus: Record<string, number>
  bySource: Record<string, number>
  mode: string
}> {
  const workspace = await readWorkspace()

  const byStatus: Record<string, number> = {}
  const bySource: Record<string, number> = {}

  workspace.articles.forEach((article) => {
    byStatus[article.status] = (byStatus[article.status] || 0) + 1
    bySource[article.source] = (bySource[article.source] || 0) + 1
  })

  return {
    total: workspace.articles.length,
    byStatus,
    bySource,
    mode: workspace.mode,
  }
}
