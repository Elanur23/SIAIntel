#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Fix npm security vulnerabilities
    
.DESCRIPTION
    This script fixes the 18 npm vulnerabilities found in audit:
    - 9 high severity
    - 9 low severity
    
    Main issues:
    1. Next.js DoS vulnerabilities (upgrade to 16.2.1)
    2. serialize-javascript RCE (upgrade via next-pwa)
    3. glob CLI command injection
    4. @tootallnate/once control flow issue
#>

Write-Host "🔒 FIXING NPM SECURITY VULNERABILITIES" -ForegroundColor Red
Write-Host "=" * 60

# Step 1: Backup package.json
Write-Host "`n📝 Step 1: Backing up package.json..." -ForegroundColor Yellow
Copy-Item "package.json" "package.json.backup"
Write-Host "✅ Backup created: package.json.backup" -ForegroundColor Green

# Step 2: Run npm audit fix (non-breaking changes)
Write-Host "`n📝 Step 2: Fixing non-breaking vulnerabilities..." -ForegroundColor Yellow
npm audit fix

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Non-breaking fixes applied" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some fixes require manual intervention" -ForegroundColor Yellow
}

# Step 3: Check remaining vulnerabilities
Write-Host "`n📝 Step 3: Checking remaining vulnerabilities..." -ForegroundColor Yellow
$auditResult = npm audit --json | ConvertFrom-Json
$remaining = $auditResult.metadata.vulnerabilities.total

Write-Host "Remaining vulnerabilities: $remaining" -ForegroundColor Cyan

if ($remaining -gt 0) {
    Write-Host "`n⚠️  Breaking changes required for remaining fixes" -ForegroundColor Yellow
    Write-Host "The following packages need major version upgrades:" -ForegroundColor Yellow
    Write-Host "  - next: 14.0.4 → 16.2.1 (BREAKING)"
    Write-Host "  - @ducanh2912/next-pwa: needs update (BREAKING)"
    Write-Host "  - @google-cloud/storage: needs update (BREAKING)"
    
    $confirm = Read-Host "`nApply breaking changes? (yes/no)"
    
    if ($confirm -eq "yes") {
        Write-Host "`n📝 Step 4: Applying breaking changes..." -ForegroundColor Yellow
        
        # Upgrade Next.js to 16.2.1
        Write-Host "Upgrading Next.js to 16.2.1..."
        npm install next@16.2.1 --save
        
        # Upgrade React (required for Next.js 16)
        Write-Host "Upgrading React to 19.x..."
        npm install react@latest react-dom@latest --save
        
        # Upgrade next-pwa
        Write-Host "Upgrading @ducanh2912/next-pwa..."
        npm install @ducanh2912/next-pwa@latest --save
        
        # Upgrade Google Cloud packages
        Write-Host "Upgrading Google Cloud packages..."
        npm install @google-cloud/storage@latest --save
        npm install @google-cloud/translate@latest --save
        npm install @google-cloud/text-to-speech@latest --save
        
        Write-Host "✅ Breaking changes applied" -ForegroundColor Green
        
        # Run audit again
        Write-Host "`n📝 Step 5: Final vulnerability check..." -ForegroundColor Yellow
        npm audit
        
        Write-Host "`n⚠️  IMPORTANT: Test your application!" -ForegroundColor Red
        Write-Host "Major version upgrades may break functionality" -ForegroundColor Yellow
        Write-Host "Run: npm run dev" -ForegroundColor Cyan
        
    } else {
        Write-Host "`n⚠️  Breaking changes skipped" -ForegroundColor Yellow
        Write-Host "Vulnerabilities remain. Consider upgrading manually." -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ All vulnerabilities fixed!" -ForegroundColor Green
}

Write-Host "`n" -NoNewline
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "📋 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Cyan

Write-Host "`n1️⃣  Test the application:" -ForegroundColor Yellow
Write-Host "   npm run dev"
Write-Host "   npm run build"

Write-Host "`n2️⃣  Check for breaking changes:" -ForegroundColor Yellow
Write-Host "   - Next.js 16 migration guide: https://nextjs.org/docs/upgrading"
Write-Host "   - React 19 changes: https://react.dev/blog/2024/04/25/react-19"

Write-Host "`n3️⃣  Update code if needed:" -ForegroundColor Yellow
Write-Host "   - Check deprecated APIs"
Write-Host "   - Update middleware if using Edge runtime"
Write-Host "   - Test all features"

Write-Host "`n4️⃣  Commit changes:" -ForegroundColor Yellow
Write-Host "   git add package.json package-lock.json"
Write-Host "   git commit -m 'fix: upgrade dependencies to fix security vulnerabilities'"

Write-Host "`n✅ Script completed!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
