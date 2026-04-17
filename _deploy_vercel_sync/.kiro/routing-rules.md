# Routing Rules - DO NOT VIOLATE

## Critical Rule: Dynamic Route Conflicts

Next.js DOES NOT allow multiple dynamic routes with different parameter names at the same level.

### ❌ FORBIDDEN (Will cause build errors):
```
app/news/[id]/page.tsx
app/news/[slug]/page.tsx  ← CONFLICT! Cannot coexist with [id]
```

### ✅ ALLOWED Routes in This Project:

1. **News Detail (ID-based)**:
   - `app/news/[id]/page.tsx` ✅ KEEP THIS
   - Uses numeric IDs (1, 2, 3, etc.)

2. **Localized News (Slug-based)**:
   - `app/[lang]/news/[slug]/page.tsx` ✅ KEEP THIS
   - Different path level, no conflict

3. **Category Pages**:
   - `app/category/[slug]/page.tsx` ✅ KEEP THIS
   - Different path, no conflict

## If You See This Error Again:

```
Error: You cannot use different slug names for the same dynamic path ('slug' !== 'id')
```

**Solution:**
1. Stop the dev server
2. Delete `app/news/[slug]/` folder (if it exists)
3. Clear `.next` cache: `rmdir /s /q .next`
4. Restart server: `npm run dev`

## Prevention:

- Never create `app/news/[slug]/` 
- Never create `app/news/[anything-except-id]/`
- If you need slug-based routing, use the localized version: `app/[lang]/news/[slug]/`

---
Last Updated: 2026-02-16
