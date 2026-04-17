/**
 * Radardaki bir haberi "yayınlandı" işaretle → feed'de artık listelenmez
 */

import { NextRequest, NextResponse } from 'next/server';
import { markBufferAsPublished } from '@/lib/content/content-buffer-system';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    if (!id) {
      return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
    }
    const ok = markBufferAsPublished(id);
    return NextResponse.json({ success: true, marked: ok });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
