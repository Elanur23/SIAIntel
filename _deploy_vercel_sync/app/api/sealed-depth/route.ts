/**
 * SIA_V4.8 SEALED DEPTH PROTOCOL API
 * POST /api/sealed-depth
 * Body: { signal: string }
 *
 * 9 dilde tam rapor üretir, ai_workspace.json'a yazar.
 */

import { NextRequest, NextResponse } from 'next/server'
import { runSealedDepthProtocol, writeToAiWorkspace } from '@/lib/ai/sealed-depth-protocol'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const { signal } = await request.json()
    if (!signal || typeof signal !== 'string') {
      return NextResponse.json(
        { success: false, error: 'signal (string) required' },
        { status: 400 }
      )
    }

    const output = await runSealedDepthProtocol(signal)
    const writtenPath = writeToAiWorkspace(output)

    return NextResponse.json({
      success: true,
      message: 'SIA_V4.8 Sealed Depth protocol complete. 9 languages written.',
      path: writtenPath,
      languages: Object.keys(output),
      wordCounts: Object.fromEntries(
        Object.entries(output).map(([k, v]) => [k, v.content.split(/\s+/).filter(Boolean).length])
      ),
    })
  } catch (e: any) {
    console.error('[SEALED_DEPTH]', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Protocol failed' },
      { status: 500 }
    )
  }
}
