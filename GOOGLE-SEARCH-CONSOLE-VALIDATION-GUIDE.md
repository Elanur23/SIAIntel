# Google Search Console Validation Guide

## Overview
This guide provides step-by-step instructions for validating indexing and canonical signals in Google Search Console after implementing strict canonical URL alignment.

## Prerequisites
- Access to Google Search Console for siaintel.com
- At least one published article with canonical slug format
- Recent deployment of canonical URL fixes

---

## VALIDATION CHECKLIST

### 1. Google-Selected Canonical ✅

**Steps:**
1. Open [Google Search Console](https://search.google.com/search-console)
2. Select property: `siaintel.com`
3. Go to **URL Inspection** tool (left sidebar)
4. Enter test URL: `https://siaintel.com/en/news/<canonical-slug>`
   - Example: `https://siaintel.com/en/news/market-analysis--cm5abc123`
5. Click **"Test Live URL"** button
6. Wait for crawl to complete
7. Check **"Coverage"** section

**Expected Results:**
```
✅ User-declared canonical: https://siaintel.com/en/news/<canonical-slug>
✅ Google-selected canonical: https://siaintel.com/en/news/<canonical-slug>
✅ Status: Both URLs MUST match exactly
```

**PASS Criteria:**
- User-declared canonical = Google-selected canonical
- No transformation (e.g., 'pt-br' stays 'pt-br', not 'pt-BR')
- Exact character-by-character match

**FAIL Indicators:**
- ❌ Google-selected canonical differs from user-declared
- ❌ Google chose a different URL as canonical
- ❌ Canonical points to a different locale or slug

---

### 2. Index Status ✅

**Steps:**
1. In the same URL Inspection result
2. Look for **"Coverage"** or **"Index Status"** section
3. Check the indexing status

**Expected Results:**
```
✅ URL is on Google
✅ Indexing allowed
✅ Page is indexed
```

**PASS Criteria:**
- Status shows "URL is on Google" or "Page is indexed"
- No "Excluded" status
- No "Crawled - currently not indexed"

**FAIL Indicators:**
- ❌ URL is not on Google
- ❌ Discovered - currently not indexed
- ❌ Crawled - currently not indexed
- ❌ Excluded by 'noindex' tag
- ❌ Blocked by robots.txt

---

### 3. Duplicate Status ✅

**Steps:**
1. In URL Inspection, check for duplicate warnings
2. Look for messages like:
   - "Duplicate, Google chose different canonical"
   - "Alternate page with proper canonical tag"
3. Check **"Coverage"** report for duplicate issues

**Expected Results:**
```
✅ No duplicate warnings
✅ No "Google chose different canonical" message
✅ No "Alternate page" designation
```

**PASS Criteria:**
- No duplicate-related warnings or errors
- URL is recognized as the canonical version
- No alternate page designation

**FAIL Indicators:**
- ❌ "Duplicate, Google chose different canonical"
- ❌ "Alternate page with proper canonical tag"
- ❌ "Duplicate without user-selected canonical"
- ❌ Multiple URLs competing for same content

---

### 4. Live Test ✅

**Steps:**
1. In URL Inspection tool
2. Click **"Test Live URL"** button
3. Wait for real-time crawl (30-60 seconds)
4. Review the results

**Expected Results:**
```
✅ Page fetch: Successful
✅ Indexing: Allowed
✅ Canonical: Matches user-declared
✅ Mobile usability: No issues
```

**PASS Criteria:**
- Page fetch successful (HTTP 200)
- Indexing allowed (no robots meta tag blocking)
- Canonical tag detected and matches expected URL
- No critical errors

**FAIL Indicators:**
- ❌ Page fetch failed (4xx or 5xx error)
- ❌ Indexing not allowed
- ❌ Canonical tag missing or incorrect
- ❌ Redirect detected (should be direct access)

---

### 5. Sitemap Validation ✅

**Steps:**
1. Open: `https://siaintel.com/sitemap.xml`
2. Search for your test article URL
3. Verify exact match with canonical URL
4. Check in Google Search Console:
   - Go to **Sitemaps** (left sidebar)
   - Check sitemap status
   - Verify submitted URLs

**Expected Results:**
```
✅ URL exists in sitemap
✅ URL matches canonical exactly
✅ Format: https://siaintel.com/{locale}/news/{canonical-slug}
✅ No URL variations (no trailing slashes, no query params)
```

**PASS Criteria:**
- Article URL present in sitemap.xml
- URL format matches canonical exactly
- Sitemap successfully submitted to GSC
- No errors in sitemap processing

**FAIL Indicators:**
- ❌ URL missing from sitemap
- ❌ URL format differs from canonical
- ❌ Sitemap has errors or warnings
- ❌ URL includes query parameters or fragments

---

## TESTING PROCEDURE

### Step-by-Step Validation

1. **Select Test Article**
   ```
   Choose a recently published article with canonical slug format:
   Example: https://siaintel.com/en/news/ai-market-trends--cm5xyz789
   ```

2. **Run URL Inspection**
   ```
   Google Search Console → URL Inspection → Enter URL → Test Live URL
   ```

3. **Document Results**
   ```
   Record:
   - User-declared canonical: _________________
   - Google-selected canonical: _________________
   - Index status: _________________
   - Duplicate status: _________________
   - Live test result: _________________
   ```

4. **Verify Sitemap**
   ```
   Open: https://siaintel.com/sitemap.xml
   Search for: <canonical-slug>
   Confirm: URL matches exactly
   ```

5. **Check Multiple Locales** (if applicable)
   ```
   Test same article in different locales:
   - https://siaintel.com/en/news/<slug>
   - https://siaintel.com/tr/news/<slug>
   - https://siaintel.com/de/news/<slug>
   
   Each should have its own canonical pointing to itself
   ```

---

## COMMON ISSUES & FIXES

### Issue 1: Google Chose Different Canonical

**Symptoms:**
- User-declared: `https://siaintel.com/en/news/article-slug--id`
- Google-selected: `https://siaintel.com/en/news/article-slug` (without ID)

**Cause:**
- Old URLs still indexed
- Redirect chain issues
- Inconsistent internal linking

**Fix:**
1. Ensure all internal links use canonical format
2. Submit URL for re-indexing
3. Wait 1-2 weeks for Google to re-crawl

### Issue 2: Duplicate Content

**Symptoms:**
- "Alternate page with proper canonical tag"
- Multiple URLs for same content

**Cause:**
- URL variations (with/without trailing slash)
- Query parameters
- Different slug formats

**Fix:**
1. Implement strict canonical URL format
2. Add redirects from old formats to canonical
3. Update sitemap to only include canonical URLs

### Issue 3: Not Indexed

**Symptoms:**
- "Discovered - currently not indexed"
- "Crawled - currently not indexed"

**Cause:**
- Low page quality signals
- Duplicate content
- Crawl budget issues

**Fix:**
1. Improve content quality and uniqueness
2. Build internal links to the page
3. Request indexing via URL Inspection tool

---

## VALIDATION REPORT TEMPLATE

```
=== GOOGLE SEARCH CONSOLE VALIDATION REPORT ===

Date: _______________
Tested By: _______________
Test URL: https://siaintel.com/en/news/<canonical-slug>

1. CANONICAL ALIGNMENT
   User-declared canonical: _______________
   Google-selected canonical: _______________
   Match: [ ] YES  [ ] NO
   
2. INDEX STATUS
   Status: _______________
   Indexed: [ ] YES  [ ] NO
   
3. DUPLICATE STATUS
   Duplicates found: [ ] YES  [ ] NO
   Google chose different: [ ] YES  [ ] NO
   
4. LIVE TEST
   Page fetch: [ ] SUCCESS  [ ] FAIL
   Indexing allowed: [ ] YES  [ ] NO
   
5. SITEMAP
   URL in sitemap: [ ] YES  [ ] NO
   URL matches canonical: [ ] YES  [ ] NO

OVERALL RESULT: [ ] PASS  [ ] FAIL

Notes:
_______________________________________________
_______________________________________________
_______________________________________________
```

---

## AUTOMATED CHECKS (Run These First)

Before manual GSC validation, run these automated checks:

### 1. Check Sitemap Generation
```bash
curl https://siaintel.com/sitemap.xml | grep "news"
```

### 2. Verify Canonical Tag
```bash
curl -s https://siaintel.com/en/news/<slug> | grep "canonical"
```

### 3. Check Structured Data
```bash
curl -s https://siaintel.com/en/news/<slug> | grep "application/ld+json" -A 20
```

### 4. Validate Hreflang
```bash
curl -s https://siaintel.com/en/news/<slug> | grep "hreflang"
```

---

## SUCCESS CRITERIA

**PASS** = All checks green ✅
- Google-selected canonical matches user-declared
- URL is indexed
- No duplicate warnings
- Live test successful
- URL in sitemap matches canonical

**FAIL** = Any check red ❌
- Canonical mismatch
- Not indexed
- Duplicate issues
- Live test failed
- Sitemap mismatch

---

## NEXT STEPS AFTER VALIDATION

### If PASS (tamam ✅)
1. Monitor for 1-2 weeks
2. Check indexing status regularly
3. Verify search appearance
4. Monitor click-through rates

### If FAIL ❌
1. Identify specific failure point
2. Review implementation
3. Fix identified issues
4. Re-test after fixes
5. Request re-indexing in GSC

---

## CONTACT & SUPPORT

If validation fails:
1. Document exact error messages
2. Take screenshots of GSC results
3. Check recent code changes
4. Review deployment logs
5. Consult SEO team if issues persist
