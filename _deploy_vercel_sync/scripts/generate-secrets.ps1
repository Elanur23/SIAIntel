# Production Secrets Generator
# Run this script to generate all required secrets for Vercel deployment

Write-Host "🔐 Generating Production Secrets..." -ForegroundColor Cyan
Write-Host ""

# NEXTAUTH_SECRET (48 bytes)
$nextAuthSecret = [Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
Write-Host "NEXTAUTH_SECRET:" -ForegroundColor Yellow
Write-Host $nextAuthSecret
Write-Host ""

# SESSION_SECRET (48 bytes)
$sessionSecret = [Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
Write-Host "SESSION_SECRET:" -ForegroundColor Yellow
Write-Host $sessionSecret
Write-Host ""

# ADMIN_SECRET (32 bytes)
$adminSecret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
Write-Host "ADMIN_SECRET:" -ForegroundColor Yellow
Write-Host $adminSecret
Write-Host ""

# CRON_SECRET (32 bytes)
$cronSecret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
Write-Host "CRON_SECRET:" -ForegroundColor Yellow
Write-Host $cronSecret
Write-Host ""

Write-Host "✅ Secrets generated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Copy these values to Vercel Dashboard" -ForegroundColor Red
Write-Host "   Never commit these secrets to Git!" -ForegroundColor Red
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Go to Vercel Dashboard → Environment Variables"
Write-Host "   2. Add each secret above"
Write-Host "   3. Set environment to 'Production'"
Write-Host "   4. Click 'Deploy'"
