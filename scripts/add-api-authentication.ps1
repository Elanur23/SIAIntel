#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Add authentication to unprotected API routes
    
.DESCRIPTION
    This script documents which API routes need authentication
    and provides guidance for adding it manually
#>

Write-Host "🔒 API AUTHENTICATION AUDIT" -ForegroundColor Cyan
Write-Host "=" * 60

Write-Host "`n📊 CRITICAL ENDPOINTS REQUIRING AUTHENTICATION" -ForegroundColor Yellow
Write-Host ""

$criticalEndpoints = @(
    @{
        Path = "app/api/war-room/save/route.ts"
        Permission = "publish_content"
        Status = "✅ FIXED"
        Priority = "CRITICAL"
    },
    @{
        Path = "app/api/war-room/publish-breaking/route.ts"
        Permission = "publish_content"
        Status = "⚠️ NEEDS FIX"
        Priority = "CRITICAL"
    },
    @{
        Path = "app/api/war-room/mark-published/route.ts"
        Permission = "publish_content"
        Status = "⚠️ NEEDS FIX"
        Priority = "CRITICAL"
    },
    @{
        Path = "app/api/war-room/wipe/route.ts"
        Permission = "bulk_delete"
        Status = "⚠️ NEEDS FIX"
        Priority = "CRITICAL"
    },
    @{
        Path = "app/api/upload/route.ts"
        Permission = "edit_content"
        Status = "⚠️ NEEDS FIX"
        Priority = "HIGH"
    },
    @{
        Path = "app/api/sovereign-core/start/route.ts"
        Permission = "manage_security"
        Status = "⚠️ NEEDS FIX"
        Priority = "HIGH"
    },
    @{
        Path = "app/api/sovereign-core/stop/route.ts"
        Permission = "manage_security"
        Status = "⚠️ NEEDS FIX"
        Priority = "HIGH"
    },
    @{
        Path = "app/api/sovereign-core/trigger/route.ts"
        Permission = "manage_security"
        Status = "⚠️ NEEDS FIX"
        Priority = "HIGH"
    },
    @{
        Path = "app/api/sia-news/generate/route.ts"
        Permission = "publish_content"
        Status = "⚠️ NEEDS FIX"
        Priority = "HIGH"
    },
    @{
        Path = "app/api/sia-news/live-blog/route.ts"
        Permission = "publish_content"
        Status = "⚠️ NEEDS FIX"
        Priority = "HIGH"
    },
    @{
        Path = "app/api/sia-news/index-google/route.ts"
        Permission = "manage_integrations"
        Status = "⚠️ NEEDS FIX"
        Priority = "HIGH"
    },
    @{
        Path = "app/api/seo-intelligence/route.ts"
        Permission = "view_analytics"
        Status = "⚠️ NEEDS FIX"
        Priority = "MEDIUM"
    },
    @{
        Path = "app/api/seo-architect/route.ts"
        Permission = "edit_content"
        Status = "⚠️ NEEDS FIX"
        Priority = "MEDIUM"
    },
    @{
        Path = "app/api/whale-alert/route.ts"
        Permission = "manage_security"
        Status = "⚠️ NEEDS FIX"
        Priority = "HIGH"
    },
    @{
        Path = "app/api/whale-autopilot/route.ts"
        Permission = "manage_security"
        Status = "⚠️ NEEDS FIX"
        Priority = "HIGH"
    }
)

# Display table
Write-Host "Priority | Status | Endpoint | Permission" -ForegroundColor Cyan
Write-Host "-" * 60

foreach ($endpoint in $criticalEndpoints) {
    $color = switch ($endpoint.Status) {
        "✅ FIXED" { "Green" }
        "⚠️ NEEDS FIX" { "Yellow" }
        default { "White" }
    }
    
    Write-Host "$($endpoint.Priority.PadRight(8)) | " -NoNewline
    Write-Host "$($endpoint.Status) | " -NoNewline -ForegroundColor $color
    Write-Host "$($endpoint.Path.PadRight(40)) | " -NoNewline
    Write-Host "$($endpoint.Permission)" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan

# Statistics
$total = $criticalEndpoints.Count
$fixed = ($criticalEndpoints | Where-Object { $_.Status -eq "✅ FIXED" }).Count
$needsFix = $total - $fixed

Write-Host "`n📊 STATISTICS:" -ForegroundColor Yellow
Write-Host "Total Endpoints: $total"
Write-Host "Fixed: $fixed" -ForegroundColor Green
Write-Host "Needs Fix: $needsFix" -ForegroundColor Yellow
Write-Host "Progress: $([math]::Round(($fixed / $total) * 100, 1))%"

Write-Host "`n📝 HOW TO ADD AUTHENTICATION:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Import the middleware:" -ForegroundColor Cyan
Write-Host "   import { requireApiPermission } from '@/lib/security/api-auth-middleware'"
Write-Host ""
Write-Host "2. Add at the start of your POST/PUT/DELETE handler:" -ForegroundColor Cyan
Write-Host "   const authResult = await requireApiPermission(request, 'permission_name')"
Write-Host "   if ('status' in authResult) {"
Write-Host "     return authResult // Return error response"
Write-Host "   }"
Write-Host ""
Write-Host "3. Example:" -ForegroundColor Cyan
Write-Host @"
   export async function POST(request: NextRequest) {
     // SECURITY: Require authentication
     const authResult = await requireApiPermission(request, 'publish_content')
     if ('status' in authResult) {
       return authResult
     }
     
     // Your existing code here...
   }
"@

Write-Host "`n🔑 AVAILABLE PERMISSIONS:" -ForegroundColor Yellow
Write-Host "  - access_admin_panel"
Write-Host "  - publish_content"
Write-Host "  - delete_content"
Write-Host "  - bulk_delete"
Write-Host "  - edit_content"
Write-Host "  - view_content"
Write-Host "  - update_settings"
Write-Host "  - manage_security"
Write-Host "  - manage_integrations"
Write-Host "  - manage_users"
Write-Host "  - manage_roles"
Write-Host "  - view_users"
Write-Host "  - view_audit_logs"
Write-Host "  - view_analytics"
Write-Host "  - export_data"
Write-Host "  - manage_distribution"
Write-Host "  - view_distribution"

Write-Host "`n⚠️  IMPORTANT NOTES:" -ForegroundColor Red
Write-Host "  - Public endpoints (GET /api/comments, etc.) don't need auth"
Write-Host "  - Only protect write operations (POST, PUT, DELETE)"
Write-Host "  - Test each endpoint after adding auth"
Write-Host "  - Update API documentation with auth requirements"

Write-Host "`n✅ Script completed!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
