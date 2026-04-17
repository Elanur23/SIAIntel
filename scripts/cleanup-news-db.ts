import Database from 'better-sqlite3';
const db = new Database('C:/SIAIntel/news.db');
const slugs = ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh'];
const result = db.prepare(`DELETE FROM news WHERE slug IN (${slugs.map(s => `'${s}'`).join(',')})`).run();
console.log(`Deleted ${result.changes} rows`);
