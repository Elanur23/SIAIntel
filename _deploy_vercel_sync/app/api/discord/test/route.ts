import { NextResponse } from 'next/server'
import { sendDiscordTest } from '@/lib/discord/webhook'

export async function POST() {
  const ok = await sendDiscordTest()
  if (ok) {
    return NextResponse.json({ success: true, message: 'Test message sent to Discord.' })
  }
  return NextResponse.json(
    { success: false, error: 'DISCORD_WEBHOOK_URL not configured or request failed.' },
    { status: 400 }
  )
}
