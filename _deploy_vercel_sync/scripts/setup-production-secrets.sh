#!/bin/bash
# Phase 4A Production Secrets Generator
# Generates cryptographically secure secrets for production deployment

echo "🔐 Phase 4A Security Foundation - Production Secrets Generator"
echo "=============================================================="
echo ""

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
    echo "❌ Error: openssl not found. Please install openssl first."
    exit 1
fi

echo "Generating secure secrets..."
echo ""

# Generate ADMIN_SECRET (32 characters base64)
ADMIN_SECRET=$(openssl rand -base64 32 | tr -d '\n')
echo "✅ ADMIN_SECRET generated (32+ characters)"

# Generate SESSION_SECRET (48 characters base64)
SESSION_SECRET=$(openssl rand -base64 48 | tr -d '\n')
echo "✅ SESSION_SECRET generated (48+ characters)"

echo ""
echo "=============================================================="
echo "📋 Add these to your .env.local file:"
echo "=============================================================="
echo ""
echo "# Phase 4A Security Secrets (Generated: $(date))"
echo "ADMIN_SECRET=$ADMIN_SECRET"
echo "SESSION_SECRET=$SESSION_SECRET"
echo "NODE_ENV=production"
echo ""
echo "=============================================================="
echo "⚠️  SECURITY WARNINGS:"
echo "=============================================================="
echo "1. NEVER commit these secrets to git"
echo "2. Store securely in your deployment platform (Vercel, etc.)"
echo "3. Use different secrets for each environment"
echo "4. Rotate secrets periodically (every 90 days recommended)"
echo "5. Keep a secure backup of production secrets"
echo ""
echo "✅ Secrets generated successfully!"
echo ""
