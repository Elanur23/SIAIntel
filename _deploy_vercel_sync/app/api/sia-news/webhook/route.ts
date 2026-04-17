/**
 * POST /api/sia-news/webhook
 * 
 * Register webhooks for article publication events
 * 
 * Requirements: 20.3
 */

import { NextRequest, NextResponse } from 'next/server'
import { registerWebhook, getWebhooks, unregisterWebhook } from '@/lib/sia-news/publishing-pipeline'
import type { WebhookRequest, WebhookResponse } from '@/lib/sia-news/types'


export const dynamic = 'force-dynamic';

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

function validateWebhookRequest(body: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!body.url || typeof body.url !== 'string') {
    errors.push('url is required and must be a string')
  }
  
  // Validate URL format
  if (body.url) {
    try {
      const url = new URL(body.url)
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.push('url must use http or https protocol')
      }
    } catch (e) {
      errors.push('url must be a valid URL')
    }
  }
  
  if (!body.events || !Array.isArray(body.events) || body.events.length === 0) {
    errors.push('events is required and must be a non-empty array')
  }
  
  if (body.events) {
    const validEvents = ['ARTICLE_PUBLISHED', 'ARTICLE_UPDATED', 'ARTICLE_REJECTED']
    const invalidEvents = body.events.filter((e: string) => !validEvents.includes(e))
    if (invalidEvents.length > 0) {
      errors.push(`Invalid events: ${invalidEvents.join(', ')}. Valid events are: ${validEvents.join(', ')}`)
    }
  }
  
  if (!body.secret || typeof body.secret !== 'string') {
    errors.push('secret is required and must be a string')
  }
  
  if (body.secret && body.secret.length < 16) {
    errors.push('secret must be at least 16 characters long')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// ============================================================================
// MAIN HANDLERS
// ============================================================================

/**
 * POST - Register a new webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: WebhookRequest = await request.json()
    
    // Validate request
    const validation = validateWebhookRequest(body)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid webhook registration',
          details: validation.errors
        },
        { status: 400 }
      )
    }
    
    // Register webhook
    const webhookId = registerWebhook(body.url, body.events, body.secret)
    
    // Format response
    const response: WebhookResponse = {
      success: true,
      webhookId
    }
    
    return NextResponse.json({
      success: true,
      data: response,
      metadata: {
        timestamp: new Date().toISOString(),
        url: body.url,
        events: body.events
      }
    })
    
  } catch (error) {
    console.error('[SIA News] Webhook registration error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to register webhook',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * GET - List all registered webhooks
 */
export async function GET(request: NextRequest) {
  try {
    // Get all webhooks
    const webhooks = getWebhooks()
    
    // Return list (without secrets for security)
    const sanitizedWebhooks = webhooks.map(webhook => ({
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      active: webhook.active,
      createdAt: webhook.createdAt
    }))
    
    return NextResponse.json({
      success: true,
      data: {
        webhooks: sanitizedWebhooks,
        count: sanitizedWebhooks.length
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('[SIA News] Webhook list error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list webhooks',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Unregister a webhook
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get webhook ID from query params
    const searchParams = request.nextUrl.searchParams
    const webhookId = searchParams.get('id')
    
    if (!webhookId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Webhook ID is required',
          details: 'Provide webhook ID in query parameter: ?id=<webhook-id>'
        },
        { status: 400 }
      )
    }
    
    // Unregister webhook
    unregisterWebhook(webhookId)
    
    return NextResponse.json({
      success: true,
      data: {
        webhookId,
        message: 'Webhook unregistered successfully'
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('[SIA News] Webhook deletion error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to unregister webhook',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}
