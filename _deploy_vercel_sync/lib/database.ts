// @ts-nocheck - TODO: Install @types/better-sqlite3 (Phase 4C - deferred to strict mode phase)
import Database from 'better-sqlite3'
import path from 'path'

// Database path
const dbPath = path.join(process.cwd(), 'news.db')

// Initialize database
let db: Database.Database | null = null

export function getDatabase() {
  if (!db) {
    db = new Database(dbPath)
    initializeDatabase()
  }
  return db
}

function initializeDatabase() {
  if (!db) return

  // Create news table
  db.exec(`
    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT,
      language TEXT NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT,
      author TEXT,
      status TEXT DEFAULT 'draft',
      views INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      published_at DATETIME
    )
  `)

  // Create categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      language TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Insert default categories
  const categories = [
    { name: 'Stock Market', slug: 'stock-market', language: 'en' },
    { name: 'Economy', slug: 'economy', language: 'en' },
    { name: 'Cryptocurrency', slug: 'cryptocurrency', language: 'en' },
    { name: 'Artificial Intelligence', slug: 'artificial-intelligence', language: 'en' },
    { name: 'Borsa', slug: 'borsa', language: 'tr' },
    { name: 'Ekonomi', slug: 'ekonomi', language: 'tr' },
    { name: 'Kripto Para', slug: 'kripto-para', language: 'tr' },
    { name: 'Yapay Zeka', slug: 'yapay-zeka', language: 'tr' },
  ]

  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (name, slug, language) 
    VALUES (?, ?, ?)
  `)

  categories.forEach(cat => {
    insertCategory.run(cat.name, cat.slug, cat.language)
  })
}

// News CRUD operations
export interface News {
  id?: number
  title: string
  slug: string
  content: string
  excerpt?: string
  language: string
  category: string
  image_url?: string
  author?: string
  status?: 'draft' | 'published'
  views?: number
  created_at?: string
  updated_at?: string
  published_at?: string
}

export function createNews(news: News) {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO news (title, slug, content, excerpt, language, category, image_url, author, status, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  
  const result = stmt.run(
    news.title,
    news.slug,
    news.content,
    news.excerpt || '',
    news.language,
    news.category,
    news.image_url || '',
    news.author || 'Admin',
    news.status || 'draft',
    news.status === 'published' ? new Date().toISOString() : null
  )
  
  return result.lastInsertRowid
}

export function getNewsBySlug(slug: string, language: string): News | null {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM news WHERE slug = ? AND language = ? AND status = ?')
  return stmt.get(slug, language, 'published') as News | null
}

export function getAllNews(language?: string, limit = 50): News[] {
  const db = getDatabase()
  let query = 'SELECT * FROM news WHERE status = ? ORDER BY created_at DESC LIMIT ?'
  let params: any[] = ['published', limit]
  
  if (language) {
    query = 'SELECT * FROM news WHERE language = ? AND status = ? ORDER BY created_at DESC LIMIT ?'
    params = [language, 'published', limit]
  }
  
  const stmt = db.prepare(query)
  return stmt.all(...params) as News[]
}

export function updateNews(id: number, news: Partial<News>) {
  const db = getDatabase()
  const fields = Object.keys(news).map(key => `${key} = ?`).join(', ')
  const values = Object.values(news)
  
  const stmt = db.prepare(`
    UPDATE news 
    SET ${fields}, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `)
  
  return stmt.run(...values, id)
}

export function deleteNews(id: number) {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM news WHERE id = ?')
  return stmt.run(id)
}

export function incrementViews(id: number) {
  const db = getDatabase()
  const stmt = db.prepare('UPDATE news SET views = views + 1 WHERE id = ?')
  return stmt.run(id)
}

// Helper function to generate slug
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
