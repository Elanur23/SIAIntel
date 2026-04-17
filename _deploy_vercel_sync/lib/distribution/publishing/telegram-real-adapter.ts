/**
 * Telegram Real Publishing Adapter
 * Phase 3C Step 1: SANDBOX MODE ONLY
 * 
 * CRITICAL SAFETY RULES:
 * - All publishing goes to TEST_CHAT_ID only
 * - Production publishing is DISABLED by default
 * - Requires feature flag enabled
 * - Requires manual confirmation
 * - Logs all operations
 * 
 * WARNING: This adapter performs REAL publishing to Telegram.
 * Use with caution. Sandbox mode is enforced by default.
 */

import type { PublishPayload } from '@/lib/distribution/types'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Telegram publish mode
 */
export type TelegramPublishMode = 'sandbox' | 'production'

/**
 * Telegram publish options
 */
export interface TelegramPublishOptions {
  mode: TelegramPublishMode
  disableNotification?: boolean
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'
}

/**
 * Telegram publish result
 */
export interface TelegramPublishResult {
  success: boolean
  mode: TelegramPublishMode
  messageId?: number
  chatId?: string
  timestamp: Date
  error?: {
    code: string
    message: string
    details?: string
  }
}

/**
 * Telegram API response
 */
interface TelegramApiResponse {
  ok: boolean
  result?: {
    message_id: number
    chat: {
      id: number
      title?: string
    }
    date: number
  }
  description?: string
  error_code?: number
}

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================

/**
 * Get Telegram bot token from environment
 */
function getTelegramBotToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN || null
}

/**
 * Get test chat ID from environment
 */
function getTestChatId(): string | null {
  return process.env.TELEGRAM_TEST_CHAT_ID || null
}

/**
 * Get production chat ID from environment
 */
function getProductionChatId(): string | null {
  return process.env.TELEGRAM_PRODUCTION_CHAT_ID || null
}

/**
 * Validate environment configuration
 */
export function validateTelegramConfig(mode: TelegramPublishMode): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  const botToken = getTelegramBotToken()
  if (!botToken) {
    errors.push('TELEGRAM_BOT_TOKEN is not configured')
  }
  
  if (mode === 'sandbox') {
    const testChatId = getTestChatId()
    if (!testChatId) {
      errors.push('TELEGRAM_TEST_CHAT_ID is not configured')
    }
  }
  
  if (mode === 'production') {
    const prodChatId = getProductionChatId()
    if (!prodChatId) {
      errors.push('TELEGRAM_PRODUCTION_CHAT_ID is not configured')
    }
    
    // CRITICAL: Prevent accidental production publish if IDs are the same
    const testChatId = getTestChatId()
    if (prodChatId === testChatId) {
      errors.push('CRITICAL: TELEGRAM_PRODUCTION_CHAT_ID must be different from TELEGRAM_TEST_CHAT_ID')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * Format content for Telegram
 */
function formatTelegramMessage(payload: PublishPayload): string {
  const { title, body, hashtags } = payload.content
  
  let message = ''
  
  // Add title as bold header
  if (title) {
    message += `<b>${escapeHtml(title)}</b>\n\n`
  }
  
  // Add body
  message += escapeHtml(body)
  
  // Add hashtags
  if (hashtags.length > 0) {
    const hashtagString = hashtags
      .slice(0, 30) // Limit to 30 hashtags
      .map(tag => `#${tag.replace(/[^a-zA-Z0-9_]/g, '')}`) // Clean hashtags
      .join(' ')
    message += `\n\n${hashtagString}`
  }
  
  // Truncate if needed (Telegram limit: 4096 characters)
  if (message.length > 4096) {
    message = message.substring(0, 4093) + '...'
  }
  
  return message
}

/**
 * Escape HTML for Telegram
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// ============================================================================
// PUBLISHING
// ============================================================================

/**
 * Publish to Telegram (REAL)
 * 
 * CRITICAL: This performs REAL publishing.
 * Mode determines which chat ID is used.
 */
export async function publishToTelegram(
  payload: PublishPayload,
  options: TelegramPublishOptions
): Promise<TelegramPublishResult> {
  const { mode, disableNotification = false, parseMode = 'HTML' } = options
  
  console.log('[TELEGRAM_REAL] Publishing in', mode, 'mode')
  
  // Validate configuration
  const validation = validateTelegramConfig(mode)
  if (!validation.isValid) {
    return {
      success: false,
      mode,
      timestamp: new Date(),
      error: {
        code: 'CONFIGURATION_ERROR',
        message: 'Telegram configuration is invalid',
        details: validation.errors.join('; ')
      }
    }
  }
  
  // Get credentials
  const botToken = getTelegramBotToken()!
  const chatId = mode === 'sandbox' ? getTestChatId()! : getProductionChatId()!
  
  // Format message
  const message = formatTelegramMessage(payload)
  
  // Prepare API request
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`
  const requestBody = {
    chat_id: chatId,
    text: message,
    parse_mode: parseMode,
    disable_notification: disableNotification
  }
  
  try {
    console.log('[TELEGRAM_REAL] Sending message to chat:', chatId)
    
    // Make API request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    
    const data: TelegramApiResponse = await response.json()
    
    // Check if successful
    if (data.ok && data.result) {
      console.log('[TELEGRAM_REAL] Message sent successfully:', data.result.message_id)
      
      return {
        success: true,
        mode,
        messageId: data.result.message_id,
        chatId: chatId,
        timestamp: new Date()
      }
    } else {
      // API returned error
      console.error('[TELEGRAM_REAL] API error:', data.description)
      
      return {
        success: false,
        mode,
        timestamp: new Date(),
        error: {
          code: `TELEGRAM_API_ERROR_${data.error_code || 'UNKNOWN'}`,
          message: data.description || 'Unknown Telegram API error',
          details: JSON.stringify(data)
        }
      }
    }
  } catch (error) {
    // Network or other error
    console.error('[TELEGRAM_REAL] Publish error:', error)
    
    return {
      success: false,
      mode,
      timestamp: new Date(),
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to connect to Telegram API',
        details: error instanceof Error ? error.message : String(error)
      }
    }
  }
}

/**
 * Test Telegram connection
 * Sends a simple test message to verify configuration
 */
export async function testTelegramConnection(
  mode: TelegramPublishMode
): Promise<TelegramPublishResult> {
  console.log('[TELEGRAM_REAL] Testing connection in', mode, 'mode')
  
  // Create test payload
  const testPayload: PublishPayload = {
    platform: 'telegram',
    content: {
      title: 'SIA Distribution OS - Connection Test',
      body: `This is a test message from SIA Distribution OS.\n\nMode: ${mode.toUpperCase()}\nTimestamp: ${new Date().toISOString()}`,
      hashtags: ['SIA', 'Test'],
      mentions: [],
      mediaUrls: []
    },
    metadata: {
      language: 'en',
      priority: 'normal'
    },
    formatting: {
      characterCount: 100,
      characterLimit: 4096,
      hasMedia: false,
      hasLinks: false,
      hasHashtags: true
    }
  }
  
  return publishToTelegram(testPayload, { mode })
}

// ============================================================================
// SAFETY CHECKS
// ============================================================================

/**
 * Check if sandbox mode is properly configured
 */
export function isSandboxConfigured(): boolean {
  const validation = validateTelegramConfig('sandbox')
  return validation.isValid
}

/**
 * Check if production mode is properly configured
 */
export function isProductionConfigured(): boolean {
  const validation = validateTelegramConfig('production')
  return validation.isValid
}

/**
 * Get configuration status
 */
export function getTelegramConfigStatus(): {
  sandboxConfigured: boolean
  productionConfigured: boolean
  hasBotToken: boolean
  hasTestChatId: boolean
  hasProductionChatId: boolean
  chatIdsAreDifferent: boolean
} {
  const botToken = getTelegramBotToken()
  const testChatId = getTestChatId()
  const prodChatId = getProductionChatId()
  
  return {
    sandboxConfigured: isSandboxConfigured(),
    productionConfigured: isProductionConfigured(),
    hasBotToken: !!botToken,
    hasTestChatId: !!testChatId,
    hasProductionChatId: !!prodChatId,
    chatIdsAreDifferent: testChatId !== prodChatId
  }
}
