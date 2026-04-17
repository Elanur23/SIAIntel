#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Generate secure passwords for admin and secrets
    
.DESCRIPTION
    Generates cryptographically secure passwords for:
    - ADMIN_SECRET
    - SESSION_SECRET
    - CSRF_SECRET
#>

Write-Host "🔐 SECURE PASSWORD GENERATOR" -ForegroundColor Cyan
Write-Host "=" * 60

function Generate-SecurePassword {
    param(
        [int]$Length = 32
    )
    
    $bytes = New-Object Byte[] $Length
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

# Generate passwords
$adminSecret = Generate-SecurePassword -Length 32
$sessionSecret = Generate-SecurePassword -Length 32
$csrfSecret = Generate-SecurePassword -Length 32

Write-Host "`n📝 Generated Secure Passwords:" -ForegroundColor Yellow
Write-Host ""
Write-Host "ADMIN_SECRET=" -NoNewline -ForegroundColor Green
Write-Host $adminSecret -ForegroundColor White
Write-Host ""
Write-Host "SESSION_SECRET=" -NoNewline -ForegroundColor Green
Write-Host $sessionSecret -ForegroundColor White
Write-Host ""
Write-Host "CSRF_SECRET=" -NoNewline -ForegroundColor Green
Write-Host $csrfSecret -ForegroundColor White

Write-Host "`n" -NoNewline
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "📋 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Cyan

Write-Host "`n1️⃣  Add to .env.local:" -ForegroundColor Yellow
Write-Host "   Copy the passwords above to your .env.local file"

Write-Host "`n2️⃣  Add to Vercel:" -ForegroundColor Yellow
Write-Host "   Go to: https://vercel.com/your-project/settings/environment-variables"
Write-Host "   Add these three environment variables"

Write-Host "`n3️⃣  Redeploy:" -ForegroundColor Yellow
Write-Host "   git push (triggers automatic deployment)"

Write-Host "`n⚠️  SECURITY NOTES:" -ForegroundColor Red
Write-Host "   - Never commit these passwords to Git"
Write-Host "   - Store securely (password manager recommended)"
Write-Host "   - Rotate every 90 days"
Write-Host "   - Each environment should have different passwords"

Write-Host "`n✅ Password generation complete!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
