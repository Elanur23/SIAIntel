/**
 * SIA GLOBAL SCHEDULER - v2.4 (HUMAN-VERIFIED BROADCAST)
 * STRATEGY: IMMEDIATE PUBLICATION
 * Reason: Content is reviewed and triggered by a human editor.
 * Aligning with Google E-E-A-T: Trust through editorial oversight.
 */

export const REGIONAL_MARKETS: Record<string, { timezone: string }> = {
  en: { timezone: 'America/New_York' },
  tr: { timezone: 'Europe/Istanbul' },
  de: { timezone: 'Europe/Berlin' },
  jp: { timezone: 'Asia/Tokyo' },
  zh: { timezone: 'Asia/Shanghai' },
  ru: { timezone: 'Europe/Moscow' },
  ar: { timezone: 'Asia/Riyadh' },
  fr: { timezone: 'Europe/Paris' },
  es: { timezone: 'Europe/Madrid' }
}

/**
 * Bir haberin yayınlanma zamanını hesaplar.
 * Editör (siz) onay verdiği anda haber anında yayına girer.
 * Bu, Google'ın en sevdiği "Gerçek Zamanlı ve İnsan Denetimli" haber akışını sağlar.
 */
export function calculateReleaseTime(): Date {
  // Gecikme yok, dürüstlük ve hız esas.
  return new Date();
}

/**
 * Tüm diller için anlık yayın takvimi.
 */
export function getGlobalInstantSchedule() {
  const schedule: Record<string, string> = {}
  const now = calculateReleaseTime().toISOString()

  Object.keys(REGIONAL_MARKETS).forEach(lang => {
    schedule[lang] = now
  })

  return schedule
}

// ============================================================================
// DRIP PROTOCOL - Daily Rate Increase Protocol
// ============================================================================

export interface DripConfig {
  baseArticlesPerDay: number
  growthRate: number
  maxArticlesPerDay: number
  startDay: number
}

export const DEFAULT_DRIP_CONFIG: DripConfig = {
  baseArticlesPerDay: 5,
  growthRate: 0.1,
  maxArticlesPerDay: 50,
  startDay: 1,
}

export function calculateDailyLimit(day: number, config: DripConfig = DEFAULT_DRIP_CONFIG): number {
  const articles = Math.floor(config.baseArticlesPerDay * Math.pow(1 + config.growthRate, day - 1))
  return Math.min(articles, config.maxArticlesPerDay)
}

export function calculateGrowthTrajectory(startDay: number = 1, numDays: number = 30, config: DripConfig = DEFAULT_DRIP_CONFIG) {
  return Array.from({ length: numDays }, (_, i) => ({
    day: startDay + i,
    limit: calculateDailyLimit(startDay + i, config),
  }))
}

export function generateDripSchedule(day: number, config: DripConfig = DEFAULT_DRIP_CONFIG) {
  const limit = calculateDailyLimit(day, config)
  const schedule = getGlobalInstantSchedule()
  return { day, limit, schedule }
}

export function getDripStatistics(currentDay: number = 1, config: DripConfig = DEFAULT_DRIP_CONFIG) {
  const todayLimit = calculateDailyLimit(currentDay, config)
  const totalPublished = calculateTotalArticles(currentDay, config)
  return {
    currentDay,
    todayLimit,
    totalPublished,
    growthRate: config.growthRate,
    nextDayLimit: calculateDailyLimit(currentDay + 1, config),
  }
}

export function calculateTotalArticles(upToDay: number, config: DripConfig = DEFAULT_DRIP_CONFIG): number {
  let total = 0
  for (let d = 1; d <= upToDay; d++) {
    total += calculateDailyLimit(d, config)
  }
  return total
}

export class DripScheduler {
  private config: DripConfig
  private currentDay: number
  private running: boolean

  constructor(config: DripConfig = DEFAULT_DRIP_CONFIG) {
    this.config = config
    this.currentDay = config.startDay
    this.running = false
  }

  getStats() {
    return getDripStatistics(this.currentDay, this.config)
  }

  getState() {
    return {
      ...this.getStats(),
      isRunning: this.running,
    }
  }

  getCurrentSchedule() {
    return generateDripSchedule(this.currentDay, this.config)
  }

  getTodayLimit() {
    return calculateDailyLimit(this.currentDay, this.config)
  }

  start(day?: number) {
    if (day) this.currentDay = day
    this.running = true
  }

  stop() {
    this.running = false
  }

  advanceDay() {
    this.currentDay++
    return this.getStats()
  }

  getSchedule() {
    return generateDripSchedule(this.currentDay, this.config)
  }
}
