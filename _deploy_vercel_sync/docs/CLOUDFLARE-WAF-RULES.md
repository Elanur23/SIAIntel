# Cloudflare WAF Rules for SIA Intelligence Terminal

**Phase X-2: WAF Integration**  
**Date**: March 21, 2026  
**Status**: Production-Ready

---

## Overview

This document provides Cloudflare WAF rules optimized for the SIA Intelligence Terminal admin authentication and API routes. These rules work in conjunction with application-level protections.

---

## Environment Configuration

### Required Environment Variables

```bash
# Proxy Configuration
BEHIND_CLOUDFLARE=true
BEHIND_PROXY=true

# CAPTCHA Configuration (Optional)
CAPTCHA_ENABLED=true
CAPTCHA_PROVIDER=hcaptcha  # or recaptcha
CAPTCHA_THRESHOLD=3  # Failed attempts before CAPTCHA required
HCAPTCHA_SECRET=your_hcaptcha_secret
HCAPTCHA_SITEKEY=your_hcaptcha_sitekey
# OR
RECAPTCHA_SECRET=your_recaptcha_secret
RECAPTCHA_SITEKEY=your_recaptcha_sitekey
```

---

## Cloudflare WAF Rules

### Rule 1: Admin Login Protection

**Priority**: 1 (Highest)  
**Action**: Managed Challenge  
**Expression**:

```
(http.request.uri.path eq "/api/admin/login" and http.request.method eq "POST")
and (
  cf.threat_score > 10
  or cf.bot_management.score < 30
  or not cf.bot_management.verified_bot
)
```

**Description**: Challenges suspicious requests to admin login endpoint based on threat score and bot detection.

---

### Rule 2: Admin API Rate Limiting

**Priority**: 2  
**Action**: Block  
**Expression**:

```
(http.request.uri.path contains "/api/admin/")
and (rate(5m) > 100)
```

**Description**: Blocks IPs making more than 100 requests to admin APIs in 5 minutes.

---

### Rule 3: Credential Stuffing Protection

**Priority**: 3  
**Action**: Managed Challenge  
**Expression**:

```
(http.request.uri.path eq "/api/admin/login" and http.request.method eq "POST")
and (
  http.request.headers["user-agent"] contains "curl"
  or http.request.headers["user-agent"] contains "python"
  or http.request.headers["user-agent"] contains "wget"
  or http.request.headers["user-agent"] contains "bot"
  or http.request.headers["user-agent"] eq ""
)
```

**Description**: Challenges requests with automation tool user-agents.

---

### Rule 4: Repeated POST Burst Protection

**Priority**: 4  
**Action**: Block  
**Expression**:

```
(http.request.uri.path eq "/api/admin/login" and http.request.method eq "POST")
and (rate(1m) > 10)
```

**Description**: Blocks IPs making more than 10 login attempts per minute.

---

### Rule 5: Exploit Pattern Detection

**Priority**: 5  
**Action**: Block  
**Expression**:

```
(http.request.uri.path contains "/api/admin/")
and (
  http.request.uri.query contains "../"
  or http.request.uri.query contains "<script"
  or http.request.uri.query contains "union select"
  or http.request.uri.query contains "' or 1=1"
  or http.request.body.raw contains "../"
  or http.request.body.raw contains "<script"
)
```

**Description**: Blocks common exploit patterns (path traversal, XSS, SQL injection).

---

### Rule 6: Geo-Blocking (Optional)

**Priority**: 6  
**Action**: Block  
**Expression**:

```
(http.request.uri.path contains "/api/admin/")
and not (ip.geoip.country in {"US" "TR" "DE" "FR" "ES" "GB" "AE" "JP" "CN"})
```

**Description**: Blocks admin access from countries outside your operational regions. Adjust country codes as needed.

---

### Rule 7: Known Bot Protection

**Priority**: 7  
**Action**: JS Challenge  
**Expression**:

```
(http.request.uri.path contains "/api/admin/")
and (cf.bot_management.score < 30)
and not (cf.bot_management.verified_bot)
```

**Description**: Challenges unverified bots with low bot management scores.

---

### Rule 8: Headless Browser Detection

**Priority**: 8  
**Action**: Managed Challenge  
**Expression**:

```
(http.request.uri.path eq "/api/admin/login")
and (
  http.request.headers["user-agent"] contains "headless"
  or http.request.headers["user-agent"] contains "phantom"
  or http.request.headers["user-agent"] contains "selenium"
  or http.request.headers["user-agent"] contains "puppeteer"
  or http.request.headers["user-agent"] contains "playwright"
)
```

**Description**: Challenges headless browser automation tools.

---

## Cloudflare Settings

### Security Level
**Recommended**: High  
**Path**: Security > Settings > Security Level

### Bot Fight Mode
**Recommended**: Enabled  
**Path**: Security > Bots > Bot Fight Mode

### Challenge Passage
**Recommended**: 30 minutes  
**Path**: Security > Settings > Challenge Passage

### Browser Integrity Check
**Recommended**: Enabled  
**Path**: Security > Settings > Browser Integrity Check

---

## Rate Limiting Configuration

### Admin Login Rate Limit

**Rule Name**: Admin Login Rate Limit  
**Expression**: `(http.request.uri.path eq "/api/admin/login")`  
**Characteristics**:
- Requests: 5 per 15 minutes
- Action: Block
- Duration: 15 minutes
- Counting: IP Address

### Admin API Rate Limit

**Rule Name**: Admin API Rate Limit  
**Expression**: `(http.request.uri.path contains "/api/admin/")`  
**Characteristics**:
- Requests: 100 per 5 minutes
- Action: Managed Challenge
- Duration: 5 minutes
- Counting: IP Address

---

## Page Rules

### Admin Panel Caching

**URL**: `*siaintel.com/admin*`  
**Settings**:
- Cache Level: Bypass
- Security Level: High
- Browser Integrity Check: On

### API Routes Caching

**URL**: `*siaintel.com/api/admin/*`  
**Settings**:
- Cache Level: Bypass
- Security Level: High
- Browser Integrity Check: On

---

## Firewall Events Monitoring

### Key Metrics to Monitor

1. **Blocked Requests**
   - Monitor for sudden spikes
   - Investigate repeated blocks from same IP
   - Check for false positives

2. **Challenged Requests**
   - Track challenge pass rate
   - Identify legitimate users being challenged
   - Adjust rules if needed

3. **Bot Score Distribution**
   - Monitor bot score trends
   - Identify bot attack patterns
   - Adjust bot management settings

4. **Geographic Distribution**
   - Track request origins
   - Identify unusual geographic patterns
   - Adjust geo-blocking rules

---

## Testing WAF Rules

### Test Procedure

1. **Test Normal Login**
   ```bash
   curl -X POST https://siaintel.com/api/admin/login \
     -H "Content-Type: application/json" \
     -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
     -d '{"password":"test"}'
   ```
   **Expected**: Should pass (may be challenged)

2. **Test Bot User-Agent**
   ```bash
   curl -X POST https://siaintel.com/api/admin/login \
     -H "Content-Type: application/json" \
     -H "User-Agent: curl/7.68.0" \
     -d '{"password":"test"}'
   ```
   **Expected**: Should be challenged or blocked

3. **Test Rate Limit**
   ```bash
   for i in {1..15}; do
     curl -X POST https://siaintel.com/api/admin/login \
       -H "Content-Type: application/json" \
       -d '{"password":"test"}'
   done
   ```
   **Expected**: Should be blocked after 5 attempts

4. **Test Exploit Pattern**
   ```bash
   curl -X POST https://siaintel.com/api/admin/login \
     -H "Content-Type: application/json" \
     -d '{"password":"test","exploit":"<script>alert(1)</script>"}'
   ```
   **Expected**: Should be blocked

---

## Integration with Application

### IP Extraction

Application uses `cf-connecting-ip` header when `BEHIND_CLOUDFLARE=true`:

```typescript
// lib/security/client-ip-extractor.ts
const cfIP = headers.get('cf-connecting-ip')
```

### Bot Detection

Application-level bot detection complements WAF:

```typescript
// lib/security/bot-detector.ts
const botDetection = await detectBot(clientIp, userAgent, route)
if (botDetection.isBot && botDetection.confidence >= 80) {
  // Block at application level
}
```

### CAPTCHA Integration

Application triggers CAPTCHA after failed attempts:

```typescript
const captchaRequired = await requiresCaptcha(clientIp, userAgent)
if (captchaRequired && !captchaToken) {
  return { requiresCaptcha: true }
}
```

---

## Monitoring & Alerts

### Cloudflare Analytics

Monitor these metrics:
- Total requests to `/api/admin/*`
- Blocked requests percentage
- Challenge solve rate
- Bot score distribution
- Geographic distribution

### Application Audit Logs

Monitor these events:
- `bot_detected` - Bot behavior detected
- `captcha_required` - CAPTCHA challenge triggered
- `captcha_failed` - CAPTCHA verification failed
- `waf_block_suspected` - Request blocked by WAF
- `rate_limit_triggered` - Rate limit exceeded

### Telegram Alerts

Configure alerts for:
- High bot detection rate (>10/hour)
- CAPTCHA failure rate (>50%)
- WAF block rate (>100/hour)
- Geographic anomalies

---

## Troubleshooting

### False Positives

**Symptom**: Legitimate users being blocked  
**Solution**:
1. Check Cloudflare Firewall Events
2. Identify blocking rule
3. Add IP to allowlist or adjust rule
4. Monitor for 24 hours

### High Challenge Rate

**Symptom**: Too many users seeing challenges  
**Solution**:
1. Review bot management score thresholds
2. Adjust challenge rules to be less aggressive
3. Consider using JS Challenge instead of Managed Challenge

### CAPTCHA Not Triggering

**Symptom**: CAPTCHA not showing after failed attempts  
**Solution**:
1. Verify `CAPTCHA_ENABLED=true`
2. Check `CAPTCHA_THRESHOLD` setting
3. Verify CAPTCHA provider credentials
4. Check application logs for errors

---

## Deployment Checklist

- [ ] Set `BEHIND_CLOUDFLARE=true` in production
- [ ] Configure CAPTCHA provider (hCaptcha or reCAPTCHA)
- [ ] Add all 8 WAF rules in Cloudflare dashboard
- [ ] Configure rate limiting rules
- [ ] Set security level to High
- [ ] Enable Bot Fight Mode
- [ ] Configure page rules for admin routes
- [ ] Test all rules with curl commands
- [ ] Monitor Firewall Events for 24 hours
- [ ] Configure Telegram alerts for bot detection
- [ ] Document any custom rules or exceptions

---

## Security Considerations

### Defense in Depth

WAF rules provide perimeter protection, but application-level security is still required:
- ✅ WAF blocks obvious attacks
- ✅ Application validates all inputs
- ✅ Application enforces authentication
- ✅ Application logs all security events
- ✅ Application triggers CAPTCHA adaptively

### Fail-Safe Design

If WAF fails or is bypassed:
- Application-level bot detection still works
- Rate limiting still enforced
- CAPTCHA still triggered
- Audit logging still active
- Telegram alerts still sent

### Regular Review

- Review WAF rules monthly
- Analyze blocked request patterns
- Update rules based on new threats
- Test rules after any changes
- Monitor false positive rate

---

## Support & Escalation

**WAF Issues**: Check Cloudflare Firewall Events  
**Application Issues**: Check audit logs in database  
**Bot Detection Issues**: Review `lib/security/bot-detector.ts` logs  
**CAPTCHA Issues**: Verify provider credentials and test endpoint

---

**Last Updated**: March 21, 2026  
**Version**: 1.0.0  
**Status**: Production-Ready

