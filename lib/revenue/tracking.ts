/**
 * SIA CONVERSION SIGNALS TRACKING
 * Section 4 — Track: follow clicks, return readers, engagement depth
 */

import { sentinel } from '../monitoring';

export interface ConversionSignal {
  article_id: string;
  user_id?: string;
  event_type: 'FOLLOW_CLICK' | 'NEWSLETTER_SIGNUP' | 'READ_DEPTH_80' | 'RETURN_READER';
  timestamp: string;
  metadata?: Record<string, any>;
}

export class ConversionTracker {
  private static instance: ConversionTracker;

  private constructor() {}

  public static getInstance(): ConversionTracker {
    if (!ConversionTracker.instance) {
      ConversionTracker.instance = new ConversionTracker();
    }
    return ConversionTracker.instance;
  }

  /**
   * Logs a conversion signal to the system
   */
  public trackSignal(signal: ConversionSignal): void {
    // In production, this sends to GA4 and internal DB
    console.log('[MONETIZATION_TRACKING]', signal.event_type, signal.article_id);

    // Sentinel logging for audit
    sentinel.log('MONETIZATION', 'SUCCESS', `${signal.event_type} tracked for ${signal.article_id}`);
  }

  /**
   * Tracks "Engagement Depth" (Section 4)
   */
  public trackReadDepth(articleId: string, depthPercent: number): void {
    if (depthPercent >= 80) {
      this.trackSignal({
        article_id: articleId,
        event_type: 'READ_DEPTH_80',
        timestamp: new Date().toISOString()
      });
    }
  }
}

export const conversionTracker = ConversionTracker.getInstance();
