# 🛑 MANUAL_ONLY_MODE - Quick Start Guide

## Status: EMERGENCY STOP ACTIVE

All automatic content ingestion has been **DEACTIVATED**. Only manual War Room entries are allowed.

---

## ✅ What You Can Do

### 1. Create Manual Entry
**Location**: War Room → Manual Entry Editor

**Steps**:
1. Navigate to `/admin/warroom`
2. Click "Manual Entry" tab
3. Write your content
4. Save as draft

### 2. Trigger Audit
**When**: After creating manual entry

**Steps**:
1. Find your article in the list
2. Click "Audit Başlat" button
3. Wait for Neural Cell Audit to complete
4. Review scores in the audit panel

### 3. Seal Article
**When**: After audit passes (score ≥ 9.0)

**Steps**:
1. Review audit results
2. Click "Seal" button
3. Article is now ready for deployment

### 4. Deploy to Production
**When**: After sealing

**Steps**:
1. Click "SPEEDCELL Deploy" button
2. Confirm deployment
3. Article goes live on production

---

## ❌ What You CANNOT Do

### Blocked Operations
- ❌ Automatic news fetching
- ❌ External signal scanning
- ❌ Scheduled crawlers
- ❌ Auto-write to workspace
- ❌ Batch content generation

### Blocked API Endpoints
- ❌ `POST /api/sealed-depth` (auto-write)
- ❌ `GET /api/google/fetch-signals` (external fetch)
- ❌ Any automatic ingestion endpoint

---

## 🔍 Check System Status

### API Endpoint
```bash
GET /api/neural-assembly/ingestion-status
```

### Expected Response
```json
{
  "success": true,
  "ingestion": {
    "mode": "MANUAL_ONLY",
    "message": "🛑 MANUAL_ONLY_MODE: All automatic ingestion is disabled."
  },
  "workspace": {
    "total": 0,
    "byStatus": {},
    "bySource": {},
    "mode": "MANUAL_ONLY"
  }
}
```

---

## 📋 Workspace Structure

### Clean Slate
```json
{
  "status": "CLEAN_SLATE",
  "mode": "MANUAL_ONLY",
  "articles": [],
  "ingestion_config": {
    "MANUAL_ONLY_MODE": true,
    "ALLOW_AUTO_FETCH": false,
    "ALLOW_AUTO_WORKSPACE_WRITE": false
  }
}
```

### After Manual Entry
```json
{
  "status": "ACTIVE",
  "mode": "MANUAL_ONLY",
  "articles": [
    {
      "id": "SIA_20260325_001",
      "created_at": "2026-03-25T10:30:00Z",
      "status": "draft",
      "source": "manual",
      "languages": ["en", "tr"]
    }
  ]
}
```

**Note**: Articles are sorted **newest first** by `created_at`.

---

## 🚨 If You See Errors

### Error: "MANUAL_ONLY_MODE: Automatic workspace writes are disabled"
**Cause**: Trying to use automatic ingestion  
**Solution**: Use War Room Manual Entry instead

### Error: "External signal fetching is disabled"
**Cause**: Trying to fetch external signals  
**Solution**: Write content manually in War Room

### Error: "Scheduled crawlers are disabled"
**Cause**: Cron job or scheduler trying to run  
**Solution**: This is expected, ignore the error

---

## 🔧 Re-enable Automatic Mode (If Needed)

**File**: `lib/neural-assembly/ingestion-kill-switch.ts`

**Change**:
```typescript
export const INGESTION_CONFIG: IngestionConfig = {
  MANUAL_ONLY_MODE: false,  // Change to false
  // ... rest of config
}
```

**Then**: Restart the application

---

## 📞 Quick Commands

### Check Status
```bash
curl http://localhost:3000/api/neural-assembly/ingestion-status
```

### View Workspace
```bash
cat ai_workspace.json
```

### Check Logs
Look for:
```
🛑 [INGESTION_KILL_SWITCH] Blocked automatic operation: ...
```

---

## 🎯 Summary

- **Mode**: MANUAL_ONLY
- **Auto Ingestion**: DISABLED
- **Manual Entry**: ENABLED
- **Workspace**: CLEAN SLATE
- **Sorting**: Newest First

**Last Updated**: March 25, 2026
