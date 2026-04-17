import { NextRequest, NextResponse } from 'next/server';
import { processIntelligenceLeak } from '@/lib/sovereign-core/news-processor';
import { monitorLazarusXNodes } from '@/lib/google/custom-search-osint';
import { analyzeLeakedVideo } from '@/lib/google/video-service';
import { sentinel } from '@/lib/monitoring';

/**
 * SIA INTEGRATION TEST API
 * Tests Google Indexing, TTS, Vision, Sentiment, OSINT, and Video Intelligence.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, content, language, evidenceUrl, videoUrl, runOsint } = body;

    sentinel.log('TEST_API', 'INFO', `Manually triggering Google Integration Test for: ${title}`);

    // 1. Process via Sovereign Core (TTS, Sentiment, Vision, Indexing)
    const processedResult = await processIntelligenceLeak({
      id: id || 'test-node-' + Date.now(),
      title: title || 'TEST: Project Lazarus-X Leak',
      content: content || 'BNY Mellon and State Street are reported to be testing quantum computing nodes in Zurich to recover 3.7 million dormant Bitcoins.',
      language: language || 'en',
      evidenceUrl: evidenceUrl
    });

    // 2. Video Intelligence (Optional)
    let videoAnalysis = null;
    if (videoUrl) {
      // For testing, assuming it's a GCS URI if it starts with gs://
      const isGcsUri = videoUrl.startsWith('gs://');
      videoAnalysis = await analyzeLeakedVideo(videoUrl, isGcsUri);
    }

    // 3. Run OSINT Scan (Optional)
    let osintLeads: any[] = [];
    if (runOsint) {
      osintLeads = await monitorLazarusXNodes();
    }

    return NextResponse.json({
      success: true,
      message: 'SIA Sovereign Core Processed Successfully',
      processedResult,
      videoAnalysis,
      osintLeads,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    sentinel.log('TEST_API', 'ERROR', `Integration test failed: ${error.message}`);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
