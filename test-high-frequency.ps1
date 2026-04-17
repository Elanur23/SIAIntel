#!/usr/bin/env pwsh
# High-Frequency Distribution Test Executor
# Tests Distribution Engine with Protocol V4 Final Seals

Write-Host "🚀 SIA_SENTINEL: Initiating High-Frequency Distribution Test" -ForegroundColor Cyan
Write-Host "🛡️  Protocol V4 Final Seals Active:" -ForegroundColor Yellow
Write-Host "   - SEAL 1: Golden Rule Dictionary (17 conversions)" -ForegroundColor Green
Write-Host "   - SEAL 2: Global Context Links (81 links per article)" -ForegroundColor Green
Write-Host "   - SEAL 3: SIA Sentinel Verification Badge" -ForegroundColor Green
Write-Host ""

$url = "http://localhost:3000/api/distribution/high-frequency-test"

Write-Host "📡 Sending test request to: $url" -ForegroundColor White
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "✅ TEST EXECUTION COMPLETE" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 RESULTS:" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    $results = $response.results
    
    Write-Host "Total Articles:              $($results.totalArticles)" -ForegroundColor White
    Write-Host "Successful Distributions:    $($results.successfulDistributions) ✅" -ForegroundColor Green
    Write-Host "Failed Distributions:        $($results.failedDistributions) ❌" -ForegroundColor Red
    Write-Host ""
    Write-Host "Total Backlinks Created:     $($results.totalBacklinks)" -ForegroundColor Yellow
    Write-Host "Total Traffic Estimate:      $($results.totalTraffic.ToString('N0'))" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Avg Protocol Compliance:     $([math]::Round($results.averageProtocolCompliance, 1))/100" -ForegroundColor Cyan
    Write-Host "Golden Rule Success Rate:    $([math]::Round($results.goldenRuleSuccessRate, 1))%" -ForegroundColor Cyan
    Write-Host "Global Links Success Rate:   $([math]::Round($results.globalLinksSuccessRate, 1))%" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Execution Time:              $([math]::Round($results.executionTime / 1000, 2))s" -ForegroundColor Magenta
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    Write-Host ""
    Write-Host "🎯 EXPECTED RESULTS:" -ForegroundColor Yellow
    Write-Host "   - Backlinks: 900-1,350 (10 articles × 9 languages × 10-15 aggregators)" -ForegroundColor White
    Write-Host "   - Traffic: 112,500-168,750 (backlinks × 125 visitors)" -ForegroundColor White
    Write-Host "   - Protocol Compliance: 80-95/100" -ForegroundColor White
    Write-Host "   - Golden Rule Success: 100%" -ForegroundColor White
    Write-Host "   - Global Links Success: 100%" -ForegroundColor White
    Write-Host ""
    Write-Host "📈 Check War Room Dashboard at: http://localhost:3000/admin/warroom" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host "❌ TEST FAILED" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Message -match "Unable to connect") {
        Write-Host "⚠️  Development server is not running!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To run the test:" -ForegroundColor White
        Write-Host "1. Start the dev server: npm run dev" -ForegroundColor Gray
        Write-Host "2. Wait for server to be ready (localhost:3000)" -ForegroundColor Gray
        Write-Host "3. Run this script again: .\test-high-frequency.ps1" -ForegroundColor Gray
    } else {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    exit 1
}
