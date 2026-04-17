/**
 * API: Get Processed Intelligence
 * GET /api/sovereign-core/intelligence?limit=10
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProcessedIntelligence, getIntelligenceById } from '@/lib/sovereign-core/autonomous-engine';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const id = searchParams.get('id');
    
    if (id) {
      // Get specific intelligence by ID
      const intelligence = getIntelligenceById(id);
      
      if (!intelligence) {
        return NextResponse.json(
          { error: 'Intelligence not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        intelligence
      });
    }
    
    // Get recent intelligence
    const intelligence = getProcessedIntelligence(limit);
    
    return NextResponse.json({
      success: true,
      count: intelligence.length,
      intelligence
    });
    
  } catch (error: any) {
    console.error('Get intelligence error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get intelligence',
        details: error.message
      },
      { status: 500 }
    );
  }
}
