/**
 * API: Get Engine Status
 * GET /api/sovereign-core/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEngineStatus, getProcessedIntelligence } from '@/lib/sovereign-core/autonomous-engine';

export async function GET(request: NextRequest) {
  try {
    const status = getEngineStatus();
    const recentIntelligence = getProcessedIntelligence(5);
    
    return NextResponse.json({
      success: true,
      status,
      recentIntelligence: recentIntelligence.map(intel => ({
        id: intel.newsId,
        title: intel.originalTitle,
        processedAt: intel.processedAt,
        languageCount: intel.languages.length,
        totalCPM: intel.totalCPM,
        averageConfidence: intel.averageConfidence
      }))
    });
    
  } catch (error: any) {
    console.error('Get status error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get status',
        details: error.message
      },
      { status: 500 }
    );
  }
}
