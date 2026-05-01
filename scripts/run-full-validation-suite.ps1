# Full 19-Command Validation Suite for Phase 3C-3C-3B-2B

Write-Host "`n=== FULL 19-COMMAND VALIDATION SUITE ===" -ForegroundColor Cyan
Write-Host "Starting validation...`n" -ForegroundColor Gray

$passCount = 0
$failCount = 0
$failedCommands = @()

function Run-ValidationCommand {
    param($name, $command)
    
    Write-Host "Running: $name" -ForegroundColor Yellow
    Invoke-Expression $command 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [PASS]`n" -ForegroundColor Green
        return $true
    } else {
        Write-Host "  [FAIL] Exit Code: $LASTEXITCODE`n" -ForegroundColor Red
        return $false
    }
}

# Run all 19 commands
if (Run-ValidationCommand "1. TypeScript Type-Check" "npx tsc --noEmit --skipLibCheck") { $passCount++ } else { $failCount++; $failedCommands += "1. TypeScript Type-Check" }
if (Run-ValidationCommand "2. Phase 3B Format Repair Smoke" "npx tsx scripts/verify-phase3b-format-repair-smoke.ts") { $passCount++ } else { $failCount++; $failedCommands += "2. Phase 3B Format Repair Smoke" }
if (Run-ValidationCommand "3. Phase 3B UI Smoke Test" "npx tsx scripts/phase3b-ui-smoke-test.ts") { $passCount++ } else { $failCount++; $failedCommands += "3. Phase 3B UI Smoke Test" }
if (Run-ValidationCommand "4. Phase 3C Apply Protocol" "npx tsx scripts/verify-phase3c-apply-protocol.ts") { $passCount++ } else { $failCount++; $failedCommands += "4. Phase 3C Apply Protocol" }
if (Run-ValidationCommand "5. Phase 3C2 Inert Preview" "npx tsx scripts/verify-phase3c2-inert-preview.ts") { $passCount++ } else { $failCount++; $failedCommands += "5. Phase 3C2 Inert Preview" }
if (Run-ValidationCommand "6. Phase 3C3 Local Draft Scaffold" "npx tsx scripts/verify-phase3c3-local-draft-scaffold.ts") { $passCount++ } else { $failCount++; $failedCommands += "6. Phase 3C3 Local Draft Scaffold" }
if (Run-ValidationCommand "7. Phase 3C3B Local Controller Scaffold" "npx tsx scripts/verify-phase3c3b-local-controller-scaffold.ts") { $passCount++ } else { $failCount++; $failedCommands += "7. Phase 3C3B Local Controller Scaffold" }
if (Run-ValidationCommand "8. Phase 3C3B2 Callback Plumbing" "npx tsx scripts/verify-phase3c3b2-callback-plumbing.ts") { $passCount++ } else { $failCount++; $failedCommands += "8. Phase 3C3B2 Callback Plumbing" }
if (Run-ValidationCommand "9. Phase 3C3C1 UI Safety Scaffold" "npx tsx scripts/verify-phase3c3c1-ui-safety-scaffold.ts") { $passCount++ } else { $failCount++; $failedCommands += "9. Phase 3C3C1 UI Safety Scaffold" }
if (Run-ValidationCommand "10. Phase 3C3C2 Dry-Run Button" "npx tsx scripts/verify-phase3c3c2-dry-run-button.ts") { $passCount++ } else { $failCount++; $failedCommands += "10. Phase 3C3C2 Dry-Run Button" }
if (Run-ValidationCommand "11. Phase 3C3C3A Real Local Apply Contract" "npx tsx scripts/verify-phase3c3c3a-real-local-apply-contract.ts") { $passCount++ } else { $failCount++; $failedCommands += "11. Phase 3C3C3A Real Local Apply Contract" }
if (Run-ValidationCommand "12. Phase 3C3C3B1 Preflight Mapping" "npx tsx scripts/verify-phase3c3c3b1-preflight-mapping.ts") { $passCount++ } else { $failCount++; $failedCommands += "12. Phase 3C3C3B1 Preflight Mapping" }
if (Run-ValidationCommand "13. Phase 3C3C3B2A Adapter Contract Alignment" "npx tsx scripts/verify-phase3c3c3b2a-adapter-contract-alignment.ts") { $passCount++ } else { $failCount++; $failedCommands += "13. Phase 3C3C3B2A Adapter Contract Alignment" }
if (Run-ValidationCommand "14. Phase 3C3C3B2B UI Handler Execution" "npx tsx scripts/verify-phase3c3c3b2b-ui-handler-execution.ts") { $passCount++ } else { $failCount++; $failedCommands += "14. Phase 3C3C3B2B UI Handler Execution" }
if (Run-ValidationCommand "15. Remediation Engine" "npx tsx scripts/verify-remediation-engine.ts") { $passCount++ } else { $failCount++; $failedCommands += "15. Remediation Engine" }
if (Run-ValidationCommand "16. Remediation Generator" "npx tsx scripts/verify-remediation-generator.ts") { $passCount++ } else { $failCount++; $failedCommands += "16. Remediation Generator" }
if (Run-ValidationCommand "17. Remediation Apply Protocol" "npx tsx scripts/verify-remediation-apply-protocol.ts") { $passCount++ } else { $failCount++; $failedCommands += "17. Remediation Apply Protocol" }
if (Run-ValidationCommand "18. Global Audit" "npx tsx scripts/verify-global-audit.ts") { $passCount++ } else { $failCount++; $failedCommands += "18. Global Audit" }
if (Run-ValidationCommand "19. Panda Intake" "npx tsx scripts/verify-panda-intake.ts") { $passCount++ } else { $failCount++; $failedCommands += "19. Panda Intake" }

Write-Host "`n=== VALIDATION SUMMARY ===" -ForegroundColor Cyan
Write-Host "Total Commands: 19" -ForegroundColor White
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red

if ($failCount -eq 0) {
    Write-Host "`n[SUCCESS] ALL VALIDATION CHECKS PASSED`n" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n[FAILURE] VALIDATION FAILED - $failCount command(s) failed`n" -ForegroundColor Red
    Write-Host "Failed Commands:" -ForegroundColor Yellow
    foreach ($cmd in $failedCommands) {
        Write-Host "  - $cmd" -ForegroundColor Red
    }
    Write-Host ""
    exit 1
}
