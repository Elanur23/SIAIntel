import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * SIA NEWS - SMART IMAGE ENGINE v3
 * 1. Pollinations AI denemesi (UP olduğunda AI-generated görsel)
 * 2. Konu bazlı Unsplash havuzundan hash-seçim (her haber farklı görsel)
 * 3. Kategori bazlı genel havuz (eşleşme yoksa)
 */

// ========== KONU BAZLI GÖRSEL HAVUZU ==========
// Her keyword'e birden fazla tematik Unsplash fotoğrafı
const TOPIC_IMAGES: Record<string, string[]> = {
  // --- CRYPTO ---
  'bitcoin': [
    'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1625806786037-2af608423424?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?q=80&w=1200&auto=format&fit=crop',
  ],
  'ethereum': [
    'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200&auto=format&fit=crop',
  ],
  'crypto': [
    'https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1634704784915-aacf363b021f?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200&auto=format&fit=crop',
  ],
  'blockchain': [
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=1200&auto=format&fit=crop',
  ],
  'nft': [
    'https://images.unsplash.com/photo-1644143379190-08a5f055de1d?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1637611331620-51149c7ceb94?q=80&w=1200&auto=format&fit=crop',
  ],
  'defi': [
    'https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1634704784915-aacf363b021f?q=80&w=1200&auto=format&fit=crop',
  ],
  'mining': [
    'https://images.unsplash.com/photo-1516245834210-c4c142787335?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?q=80&w=1200&auto=format&fit=crop',
  ],
  'whale': [
    'https://images.unsplash.com/photo-1634704784915-aacf363b021f?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200&auto=format&fit=crop',
  ],
  'solana': [
    'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=1200&auto=format&fit=crop',
  ],
  'binance': [
    'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1634704784915-aacf363b021f?q=80&w=1200&auto=format&fit=crop',
  ],
  // --- STOCKS ---
  'nasdaq': [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=1200&auto=format&fit=crop',
  ],
  'stock': [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1642790106117-e829e14a795f?q=80&w=1200&auto=format&fit=crop',
  ],
  'nvidia': [
    'https://images.unsplash.com/photo-1621361365424-06f0e1eb5c49?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1555255707-c07966088b7b?q=80&w=1200&auto=format&fit=crop',
  ],
  'tesla': [
    'https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1617704548623-340376564e68?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1562053033-5d4d40df88d0?q=80&w=1200&auto=format&fit=crop',
  ],
  'apple': [
    'https://images.unsplash.com/photo-1491933382434-500287f9b54b?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?q=80&w=1200&auto=format&fit=crop',
  ],
  'amazon': [
    'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=1200&auto=format&fit=crop',
  ],
  'microsoft': [
    'https://images.unsplash.com/photo-1633419461186-7d40a38105ec?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1555255707-c07966088b7b?q=80&w=1200&auto=format&fit=crop',
  ],
  'earnings': [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504607798333-52a30db54a5d?q=80&w=1200&auto=format&fit=crop',
  ],
  'ipo': [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop',
  ],
  'wall street': [
    'https://images.unsplash.com/photo-1468254095679-bbcba94a7066?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop',
  ],
  'trading': [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=1200&auto=format&fit=crop',
  ],
  'rally': [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?q=80&w=1200&auto=format&fit=crop',
  ],
  // --- ECONOMY ---
  'fed': [
    'https://images.unsplash.com/photo-1621981386829-9b458a2cddde?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1200&auto=format&fit=crop',
  ],
  'federal reserve': [
    'https://images.unsplash.com/photo-1621981386829-9b458a2cddde?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1200&auto=format&fit=crop',
  ],
  'inflation': [
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?q=80&w=1200&auto=format&fit=crop',
  ],
  'interest rate': [
    'https://images.unsplash.com/photo-1621981386829-9b458a2cddde?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1200&auto=format&fit=crop',
  ],
  'rate cut': [
    'https://images.unsplash.com/photo-1621981386829-9b458a2cddde?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1200&auto=format&fit=crop',
  ],
  'recession': [
    'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1604594849809-dfedbc827105?q=80&w=1200&auto=format&fit=crop',
  ],
  'gold': [
    'https://images.unsplash.com/photo-1610375461246-83df859d849d?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1624365168968-f283d506c6b6?q=80&w=1200&auto=format&fit=crop',
  ],
  'oil': [
    'https://images.unsplash.com/photo-1513828583688-c52646db42da?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1516728778615-2d590ea1855e?q=80&w=1200&auto=format&fit=crop',
  ],
  'tariff': [
    'https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1494412574643-ff11b0a5eb19?q=80&w=1200&auto=format&fit=crop',
  ],
  'trade war': [
    'https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1494412574643-ff11b0a5eb19?q=80&w=1200&auto=format&fit=crop',
  ],
  'dollar': [
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1200&auto=format&fit=crop',
  ],
  'bank': [
    'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1200&auto=format&fit=crop',
  ],
  'treasury': [
    'https://images.unsplash.com/photo-1621981386829-9b458a2cddde?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1200&auto=format&fit=crop',
  ],
  'gdp': [
    'https://images.unsplash.com/photo-1604594849809-dfedbc827105?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1611324586758-60d56c9b0c8e?q=80&w=1200&auto=format&fit=crop',
  ],
  'enflasyon': [
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?q=80&w=1200&auto=format&fit=crop',
  ],
  'faiz': [
    'https://images.unsplash.com/photo-1621981386829-9b458a2cddde?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1200&auto=format&fit=crop',
  ],
  // --- AI & TECH ---
  'ai': [
    'https://images.unsplash.com/photo-1677447337457-6e6e64e824c2?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1655720828018-edd2daec9349?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1200&auto=format&fit=crop',
  ],
  'openai': [
    'https://images.unsplash.com/photo-1677447337457-6e6e64e824c2?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1676299081847-824916de030a?q=80&w=1200&auto=format&fit=crop',
  ],
  'chatgpt': [
    'https://images.unsplash.com/photo-1677447337457-6e6e64e824c2?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1655720828018-edd2daec9349?q=80&w=1200&auto=format&fit=crop',
  ],
  'robot': [
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?q=80&w=1200&auto=format&fit=crop',
  ],
  'chip': [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1555255707-c07966088b7b?q=80&w=1200&auto=format&fit=crop',
  ],
  'semiconductor': [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1555255707-c07966088b7b?q=80&w=1200&auto=format&fit=crop',
  ],
  'machine learning': [
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1655720828018-edd2daec9349?q=80&w=1200&auto=format&fit=crop',
  ],
  'deepseek': [
    'https://images.unsplash.com/photo-1677447337457-6e6e64e824c2?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200&auto=format&fit=crop',
  ],
  'llm': [
    'https://images.unsplash.com/photo-1677447337457-6e6e64e824c2?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1655720828018-edd2daec9349?q=80&w=1200&auto=format&fit=crop',
  ],
  // --- GEOPOLİTİK ---
  'war': [
    'https://images.unsplash.com/photo-1580752300992-559f8e0734e0?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1569025690405-c765b53e2cf7?q=80&w=1200&auto=format&fit=crop',
  ],
  'sanction': [
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1200&auto=format&fit=crop',
  ],
  'election': [
    'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1494172961521-33799ddd43a5?q=80&w=1200&auto=format&fit=crop',
  ],
  'regulation': [
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=1200&auto=format&fit=crop',
  ],
  'energy': [
    'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=1200&auto=format&fit=crop',
  ],
  'climate': [
    'https://images.unsplash.com/photo-1569163139394-de4e5f43e5ca?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?q=80&w=1200&auto=format&fit=crop',
  ],
}

// Kategori bazlı genel havuz
const CATEGORY_IMAGES: Record<string, string[]> = {
  CRYPTO: [
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1634704784915-aacf363b021f?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=1200&auto=format&fit=crop',
  ],
  STOCKS: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504607798333-52a30db54a5d?q=80&w=1200&auto=format&fit=crop',
  ],
  ECONOMY: [
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1604594849809-dfedbc827105?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1621981386829-9b458a2cddde?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?q=80&w=1200&auto=format&fit=crop',
  ],
  AI: [
    'https://images.unsplash.com/photo-1677447337457-6e6e64e824c2?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1655720828018-edd2daec9349?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1555255707-c07966088b7b?q=80&w=1200&auto=format&fit=crop',
  ],
}

// ========== YARDIMCI FONKSİYONLAR ==========

// Hash fonksiyonu (deterministic seçim için)
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

// Konu bazlı veya kategori bazlı görsel seç
function selectImage(headline: string, summary: string, category: string): string {
  const text = `${(headline || '').toLowerCase()} ${(summary || '').toLowerCase()}`
  const hash = hashString(headline)

  // Keywords'ü uzunluktan kısaya sırala (en spesifik match önce)
  const sortedTopics = Object.entries(TOPIC_IMAGES)
    .sort((a, b) => b[0].length - a[0].length)

  // 1. Konu bazlı eşleşme — en ilgili (spesifik keyword önce)
  for (const [keyword, urls] of sortedTopics) {
    if (text.includes(keyword)) {
      return urls[hash % urls.length]
    }
  }

  // 2. Kategori havuzundan
  const pool = CATEGORY_IMAGES[category] || CATEGORY_IMAGES.CRYPTO
  return pool[hash % pool.length]
}

// Pollinations AI URL & prompt
function buildImagePrompt(headline: string, summary: string): string {
  const text = `${(headline || '').toLowerCase()} ${(summary || '').toLowerCase()}`

  const VISUAL_CONCEPTS: Record<string, string> = {
    'bitcoin': 'golden Bitcoin coin glowing on dark digital background',
    'ethereum': 'Ethereum crystal logo floating above circuit board, purple neon',
    'crypto': 'cryptocurrency digital coins floating in cyberspace',
    'nft': 'digital art gallery with glowing NFT frames',
    'nasdaq': 'NASDAQ stock exchange with electronic ticker displays',
    'stock': 'stock market trading floor with green and red candlestick charts',
    'nvidia': 'NVIDIA GPU chip on circuit board with green glow, AI computing',
    'tesla': 'sleek electric car in futuristic factory, robotic arms',
    'apple': 'minimalist tech workspace with premium devices',
    'fed': 'Federal Reserve building in Washington DC, marble columns',
    'inflation': 'shopping cart with rising price tags, economic pressure',
    'recession': 'dark stormy sky over empty business district',
    'gold': 'stack of gold bars in secure vault with dramatic lighting',
    'oil': 'oil refinery at sunset with golden pipeline',
    'tariff': 'shipping containers at port with trade barriers',
    'ai': 'artificial intelligence neural network with glowing synapses',
    'openai': 'AI laboratory with holographic interfaces',
    'robot': 'humanoid robot in modern laboratory',
    'chip': 'semiconductor chip on circuit board, extreme close-up',
    'war': 'geopolitical world map with highlighted conflict zones',
    'election': 'democratic voting process with ballot box',
    'energy': 'renewable energy sources, solar panels and wind turbines',
  }

  for (const [keyword, concept] of Object.entries(VISUAL_CONCEPTS)) {
    if (text.includes(keyword)) return concept
  }

  return headline.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
}

function buildPollinationsUrl(prompt: string, seed: number): string {
  const styledPrompt = `Professional editorial news photograph, ${prompt}, photorealistic, cinematic lighting, 4k, no text, no watermark`
  const params = new URLSearchParams({ width: '1200', height: '675', nologo: 'true', seed: String(seed) })
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(styledPrompt)}?${params}`
}

// Pollinations health check (hızlı, sadece HEAD)
async function isPollinationsUp(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 5000)
    const r = await fetch('https://image.pollinations.ai/prompt/test?width=64&height=64&nologo=true', {
      method: 'HEAD', signal: controller.signal
    })
    clearTimeout(t)
    return r.ok
  } catch { return false }
}

// Pollinations görseli server-side pre-warm
async function preWarmImage(url: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 50000)
    const r = await fetch(url, { method: 'GET', signal: controller.signal, headers: { Accept: 'image/*' } })
    clearTimeout(t)
    return r.ok && (r.headers.get('content-type') || '').includes('image')
  } catch { return false }
}

// Kategori algılama
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  CRYPTO: ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'blockchain', 'defi', 'nft', 'solana', 'altcoin', 'whale', 'mining', 'token', 'coin', 'binance'],
  STOCKS: ['nasdaq', 'stock', 'share', 's&p', 'dow', 'trading', 'nvidia', 'tesla', 'amazon', 'earnings', 'market cap', 'equity', 'ipo', 'wall street'],
  ECONOMY: ['fed', 'federal reserve', 'inflation', 'interest rate', 'ecb', 'central bank', 'gdp', 'recession', 'cpi', 'monetary', 'rate cut', 'tariff', 'treasury', 'faiz', 'enflasyon'],
  AI: ['ai', 'artificial intelligence', 'machine learning', 'openai', 'chatgpt', 'llm', 'robot', 'neural', 'deepseek', 'gemini', 'claude', 'gpt']
}

function detectCategory(headline: string, summary: string): string {
  const text = `${(headline || '').toLowerCase()} ${(summary || '').toLowerCase()}`
  let best = 'CRYPTO'; let max = 0
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const count = keywords.filter(kw => text.includes(kw)).length
    if (count > max) { max = count; best = cat }
  }
  return best
}

// ========== ANA ENDPOINT ==========

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const headline = typeof body.headline === 'string' ? body.headline.trim() : ''
    const summary = typeof body.summary === 'string' ? body.summary.trim().slice(0, 300) : ''
    if (!headline) {
      return NextResponse.json({ success: false, error: 'Headline missing' }, { status: 400 })
    }

    const category = detectCategory(headline, summary)
    const seed = hashString(headline)

    // Konu bazlı Unsplash görseli (anında, güvenilir)
    const unsplashUrl = selectImage(headline, summary, category)

    // Pollinations AI denemesi (arka planda) — UP olduğunda AI-generated
    let pollinationsUrl: string | null = null
    const pollUp = await isPollinationsUp()
    if (pollUp) {
      const prompt = buildImagePrompt(headline, summary)
      pollinationsUrl = buildPollinationsUrl(prompt, seed)
      const warmed = await preWarmImage(pollinationsUrl)
      if (!warmed) pollinationsUrl = null
    }

    const imageUrl = pollinationsUrl || unsplashUrl

    return NextResponse.json({
      success: true,
      imageUrl,
      fallbackUrl: unsplashUrl,
      pollinationsUrl,
      category,
      metadata: {
        engine: pollinationsUrl ? 'POLLINATIONS_AI' : 'UNSPLASH_CURATED',
        type: pollinationsUrl ? 'AI_GENERATED' : 'CURATED',
        category,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error: unknown) {
    console.error('Image generation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Image generation failed'
    }, { status: 500 })
  }
}
