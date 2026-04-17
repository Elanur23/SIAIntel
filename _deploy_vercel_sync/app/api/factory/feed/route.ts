import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

/**
 * Factory Feed API
 * Reads data/feed.json from sovereign-core
 */
export async function GET() {
  try {
    const feedPath = join(process.cwd(), 'sovereign-core', 'data', 'feed.json')
    
    try {
      const fileContent = await readFile(feedPath, 'utf-8')
      const feedData = JSON.parse(fileContent)
      
      return NextResponse.json({
        success: true,
        articles: feedData.articles || [],
        last_updated: feedData.last_updated,
        timestamp: new Date().toISOString()
      })
    } catch (fileError) {
      // File doesn't exist yet or is empty
      return NextResponse.json({
        success: true,
        articles: [],
        last_updated: null,
        message: 'Feed file not found - Factory may not have run yet',
        timestamp: new Date().toISOString()
      })
    }
    
  } catch (error) {
    console.error('Factory feed error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to read factory feed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
