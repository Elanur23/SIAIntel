import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

/**
 * Serves the ads.txt file from the public directory
 * Essential for Google AdSense verification
 */
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'ads.txt')
    const content = fs.readFileSync(filePath, 'utf8')

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  } catch (error) {
    // Fallback if file doesn't exist
    return new NextResponse('google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}
