# Phase 4A Production Secrets Generator (PowerShell)
# Generates cryptographically secure secrets for production deployment

Write-Host "🔐 Phase 4A Security Foundation - Production Secrets Generator" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Generating secure secrets..." -ForegroundColor Yellow
Write-Host ""

# Generate ADMIN_SECRET (32 bytes = 44 characters base64)
$adminSecretBytes = New-Object byte[] 32
[Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($adminSecretBytes)
$ADMIN_SECRET = [Convert]::ToBase64String($adminSecretBytes)
Write-Host "✅ ADMIN_SECRET generated (32+ characters)" -ForegroundColor Green

# Generate SESSION_SECRET (48 bytes = 64 characters base64)
$sessionSecretBytes = New-Object byte[] 48
[Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($sessionSecretBytes)
$SESSION_SECRET = [Convert]::ToBase64String($sessionSecretBytes)
Write-Host "✅ SESSION_SECRET generated (48+ characters)" -ForegroundColor Green

Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "📋 Add these to your .env.local file:" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "# Phase 4A Security Secrets (Generated: $(Get-Date))" -ForegroundColor White
Write-Host "ADMIN_SECRET=$ADMIN_SECRET" -ForegroundColor White
Write-Host "SESSION_SECRET=$SESSION_SECRET" -ForegroundColor White
Write-Host "NODE_ENV=production" -ForegroundColor White
Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "⚠️  SECURITY WARNINGS:" -ForegroundColor Yellow
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "1. NEVER commit these secrets to git" -ForegroundColor Yellow
Write-Host "2. Store securely in your deployment platform (Vercel, etc.)" -ForegroundColor Yellow
Write-Host "3. Use different secrets for each environment" -ForegroundColor Yellow
Write-Host "4. Rotate secrets periodically (every 90 days recommended)" -ForegroundColor Yellow
Write-Host "5. Keep a secure backup of production secrets" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ Secrets generated successfully!" -ForegroundColor Green
Write-Host ""

# Optionally copy to clipboard (Windows only)
$clipboardChoice = Read-Host "Copy secrets to clipboard? (y/n)"
if ($clipboardChoice -eq 'y' -or $clipboardChoice -eq 'Y') {
    $secretsText = @"
# Phase 4A Security Secrets (Generated: $(Get-Date))
ADMIN_SECRET=$ADMIN_SECRET
SESSION_SECRET=$SESSION_SECRET
NODE_ENV=production
"@
    Set-Clipboard -Value $secretsText
    Write-Host "✅ Secrets copied to clipboard!" -ForegroundColor Green
}
