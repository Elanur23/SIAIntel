/**
 * SIA SCALE LAYER V1
 * Intelligence-driven content amplification and cluster management.
 *
 * MISSION: Scale winning content intelligently.
 * RULES:
 * - Trigger Scale if CTR > 4% and Engagement > 3%
 * - Kill Switch if CTR < 1% or Bounce Rate > 80%
 */

import { Language } from '../dispatcher/types';
import { sentinel } from '../monitoring';

export type ScaleStatus = 'IDLE' | 'SCALING' | 'KILLED' | 'WATCH';

export interface ContentBrief {
  type: 'FOLLOW_UP' | 'DEEP_DIVE' | 'COUNTER_THESIS';
  headline_suggestions: string[];
  angle: string;
  target_date: string;
  status: 'PENDING' | 'APPROVED' | 'PUBLISHED';
}

export interface ScaleNode {
  article_id: string;
  language: Language;
  ctr: number;
  engagement: number;
  bounce_rate: number;
  status: ScaleStatus;
  cluster: ContentBrief[];
  last_evaluated: string;
}

export class ScaleEngine {
  private static instance: ScaleEngine;

  private constructor() {}

  public static getInstance(): ScaleEngine {
    if (!ScaleEngine.instance) {
      ScaleEngine.instance = new ScaleEngine();
    }
    return ScaleEngine.instance;
  }

  /**
   * SECTION 1 — TRIGGER & KILL SWITCH
   */
  public evaluatePerformance(node: { article_id: string; language: Language; ctr: number; engagement: number; bounce_rate: number }): ScaleStatus {
    // TRIGGER
    if (node.ctr > 4 && node.engagement > 3) {
      sentinel.log('SCALE_LAYER', 'SUCCESS', `Triggering SCALE MODE for ${node.article_id} [${node.language}]`);
      return 'SCALING';
    }

    // KILL SWITCH (Negative Trigger)
    if (node.ctr < 1 || node.bounce_rate > 80) {
      sentinel.log('SCALE_LAYER', 'CRITICAL', `KILL SIGNAL activated for ${node.article_id} [${node.language}] - Performance sub-standard`);
      return 'KILLED';
    }

    return 'WATCH';
  }

  /**
   * SECTION 2 — CONTENT CLUSTER & SECTION 5 — OUTPUT
   */
  public generateClusterBriefs(articleId: string, topic: string, language: Language): ContentBrief[] {
    const now = new Date();

    return [
      {
        type: 'FOLLOW_UP',
        headline_suggestions: [
          `New Developments: The ${topic} Ripple Effect`,
          `${topic} Update: Institutional Response and Market Shift`
        ],
        angle: 'Same topic, new angle focusing on recent ripple effects.',
        target_date: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'PENDING'
      },
      {
        type: 'DEEP_DIVE',
        headline_suggestions: [
          `Technical Deep Dive: The Mechanics of ${topic}`,
          `Masterclass: Deconstructing ${topic} Architecture`
        ],
        angle: 'Technical expansion for professional investors and tech-sovereign entities.',
        target_date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'PENDING'
      },
      {
        type: 'COUNTER_THESIS',
        headline_suggestions: [
          `The Opposite Scenario: Why ${topic} Could Fail`,
          `Risk Assessment: Counter-Thesis to the ${topic} Consensus`
        ],
        angle: 'Opposite scenario to provide balanced perspective and manage tail risk.',
        target_date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'PENDING'
      }
    ];
  }

  /**
   * CROSS-LANGUAGE PERFORMANCE ARBITRAGE
   * If a topic wins in one language, it scales globally.
   */
  public globalScalingArbitrage(winningNode: ScaleNode): Language[] {
    const allLanguages: Language[] = ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh'];
    return allLanguages.filter(lang => lang !== winningNode.language);
  }
}

export const scaleEngine = ScaleEngine.getInstance();
