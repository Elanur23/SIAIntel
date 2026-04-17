import { NextRequest, NextResponse } from 'next/server'


export const dynamic = 'force-dynamic';

const PYTHON_BACKEND_URL = process.env.SIAINTEL_BACKEND_URL || 'http://localhost:8000'

/**
 * SIAIntel Python Backend Proxy
 * Forwards requests to the Python FastAPI backend
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint') || ''
    
    const response = await fetch(`${PYTHON_BACKEND_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('SIAIntel proxy error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to connect to SIAIntel backend',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint') || ''
    
    let body = null
    try {
      body = await request.json()
    } catch {
      // No body
    }
    
    const response = await fetch(`${PYTHON_BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    
    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('SIAIntel proxy error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to connect to SIAIntel backend',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

