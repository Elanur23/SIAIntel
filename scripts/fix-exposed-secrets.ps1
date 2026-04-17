#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Fix exposed API keys and secrets in Git history
    
.DESCRIPTION
    This script:
    1. Removes .env files from Git history
    2. Creates template files
    3. Generates secure passwords
    4. Provides instructions for API key rotation
    
.NOTES
    Run this script BEFORE committing any fixes
#>

Write-Host "🔒 FIXING EXPOSED SECRETS - CRITICAL SECURITY FIX" -ForegroundColor Red
Write-Host "=" * 60

# Step 1: Remove .env files from Git history
Write-Host "`n📝 Step 1: Removing .env files from Git history..." -ForegroundColor Yellow
Write-Host "This will rewrite Git history. Make sure you have a backup!" -ForegroundColor Red

$confirm = Read-Host "Continue? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Aborted." -ForegroundColor Red
    exit 1
}

# Remove .env files from Git history
Write-Host "Removing .env and .env.local from Git history..."
git filter-branch --force --index-filter `
    "git rm --cached --ignore-unmatch .env .env.local .env.production" `
    --prune-empty --tag-name-filter cat -- --all

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ .env files removed from Git history" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: Git filter-branch failed. Files may already be removed." -ForegroundColor Yellow
}

# Step 2: Generate secure admin password
Write-Host "`n📝 Step 2: Generating secure admin password..." -ForegroundColor Yellow

# Generate 32-character secure password
$bytes = New-Object Byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$securePassword = [Convert]::ToBase64String($bytes)

Write-Host "✅ Generated secure admin password (32+ characters)" -ForegroundColor Green
Write-Host "New ADMIN_SECRET: $securePassword" -ForegroundColor Cyan

# Step 3: Create .env.example template
Write-Host "`n📝 Step 3: Creating .env.example template..." -ForegroundColor Yellow

$envExample = @"
# ============================================
# SIA INTELLIGENCE TERMINAL - Environment Variables
# ============================================
# SECURITY: Never commit this file with real values!
# Copy to .env.local and fill in your actual values
# ============================================

# ============================================
# ADMIN AUTHENTICATION
# ============================================
# Generate with: openssl rand -base64 32
ADMIN_SECRET=your-secure-password-here-32-plus-characters

# ============================================
# AI PROVIDERS
# ============================================
# Gemini API (Google AI Studio)
# Get from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your-gemini-api-key-here

# Groq API (Fast LLM Inference)
# Get from: https://console.groq.com/keys
GROQ_API_KEY=your-groq-api-key-here
GROQ_API_KEY_CONSOLE=your-groq-console-api-key-here

# OpenAI API (GPT-4)
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=your-openai-api-key-here

# ============================================
# DATABASE
# ============================================
# Turso (LibSQL Cloud)
# Get from: https://turso.tech/
TURSO_DATABASE_URL=your-turso-database-url-here
TURSO_AUTH_TOKEN=your-turso-auth-token-here

# Upstash Redis (Caching)
# Get from: https://console.upstash.com/
UPSTASH_REDIS_REST_URL=your-upstash-redis-url-here
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token-here

# ============================================
# SECURITY
# ============================================
# Telegram Bot (Security Alerts)
# Get from: https://t.me/BotFather
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here
TELEGRAM_CHAT_ID=your-telegram-chat-id-here

# Session Secret (Generate with: openssl rand -base64 32)
SESSION_SECRET=your-session-secret-here-32-plus-characters

# CSRF Secret (Generate with: openssl rand -base64 32)
CSRF_SECRET=your-csrf-secret-here-32-plus-characters

# ============================================
# GOOGLE SERVICES
# ============================================
# Google Analytics 4
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_PROPERTY_ID=properties/XXXXXXXXX

# Google Search Console & Indexing API
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR-PRIVATE-KEY-HERE\n-----END PRIVATE KEY-----\n"

# Google AdSense
GOOGLE_ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXXX

# ============================================
# SITE CONFIGURATION
# ============================================
SITE_URL=https://siaintel.com
SITE_NAME=SIA Intelligence Terminal
NODE_ENV=production

# ============================================
# OPTIONAL SERVICES
# ============================================
# Twitter/X API (Optional)
TWITTER_API_KEY=your-twitter-api-key-here
TWITTER_API_SECRET=your-twitter-api-secret-here
TWITTER_ACCESS_TOKEN=your-twitter-access-token-here
TWITTER_ACCESS_SECRET=your-twitter-access-secret-here

# Telegram Publishing (Optional)
TELEGRAM_CHANNEL_ID=@your-channel-here

# Discord Webhooks (Optional)
DISCORD_WEBHOOK_URL=your-discord-webhook-url-here
"@

Set-Content -Path ".env.example" -Value $envExample
Write-Host "✅ Created .env.example template" -ForegroundColor Green

# Step 4: Create .env.local template for development
Write-Host "`n📝 Step 4: Creating .env.local template..." -ForegroundColor Yellow

$envLocal = @"
# ============================================
# DEVELOPMENT ENVIRONMENT
# ============================================
# Copy from .env.example and fill in your values
# This file is ignored by Git
# ============================================

ADMIN_SECRET=$securePassword

# Add your development API keys here
# NEVER commit this file!

NODE_ENV=development
SITE_URL=http://localhost:3003
"@

Set-Content -Path ".env.local" -Value $envLocal
Write-Host "✅ Created .env.local with secure password" -ForegroundColor Green

# Step 5: Instructions
Write-Host "`n" -NoNewline
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "🚨 CRITICAL: NEXT STEPS" -ForegroundColor Red
Write-Host "=" * 60 -ForegroundColor Cyan

Write-Host "`n1️⃣  REVOKE ALL EXPOSED API KEYS IMMEDIATELY:" -ForegroundColor Yellow
Write-Host "   - Gemini API: https://makersuite.google.com/app/apikey"
Write-Host "   - Groq API: https://console.groq.com/keys"
Write-Host "   - Upstash Redis: https://console.upstash.com/"
Write-Host "   - OpenAI API: https://platform.openai.com/api-keys"

Write-Host "`n2️⃣  GENERATE NEW API KEYS:" -ForegroundColor Yellow
Write-Host "   - Create new keys from the dashboards above"
Write-Host "   - Add them to .env.local (NOT .env)"

Write-Host "`n3️⃣  UPDATE VERCEL ENVIRONMENT VARIABLES:" -ForegroundColor Yellow
Write-Host "   - Go to: https://vercel.com/your-project/settings/environment-variables"
Write-Host "   - Add all production keys"
Write-Host "   - Use the new ADMIN_SECRET: $securePassword"

Write-Host "`n4️⃣  FORCE PUSH TO REMOTE (REWRITES HISTORY):" -ForegroundColor Yellow
Write-Host "   git push origin --force --all"
Write-Host "   git push origin --force --tags"

Write-Host "`n5️⃣  NOTIFY TEAM MEMBERS:" -ForegroundColor Yellow
Write-Host "   - All team members must re-clone the repository"
Write-Host "   - Old clones will have conflicts"

Write-Host "`n⚠️  WARNING: This rewrites Git history!" -ForegroundColor Red
Write-Host "   - All collaborators must re-clone"
Write-Host "   - Backup before proceeding"

Write-Host "`n✅ Script completed successfully!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
