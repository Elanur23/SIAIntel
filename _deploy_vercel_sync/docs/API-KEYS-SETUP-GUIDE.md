# API Keys Setup Guide - SIA Intelligence Terminal

## 🔑 Required API Keys

### ✅ Currently Working (Free)

#### 1. GROQ API (Ultra Fast & Free)
- **Status**: ✅ Active
- **URL**: https://console.groq.com/keys
- **Free Tier**: Unlimited (rate limited)
- **Models**: Llama 3.3 70B, Mixtral 8x7B
- **Speed**: Fastest inference (300+ tokens/sec)
- **Current Key**: `[MASKED_GROQ_KEY]`

#### 2. Gemini API (Google AI)
- **Status**: ✅ Active
- **URL**: https://aistudio.google.com/app/apikey
- **Free Tier**: 60 requests/minute
- **Models**: Gemini 1.5 Pro, Gemini 1.5 Flash
- **Features**: 2M token context, Google Search grounding
- **Current Key**: `AIzaSyADOHwWk7ExOroz5tabEqdClX_i9oGEOi4`

---

### ⚠️ Needs New Keys

#### 3. Together AI (DeepSeek V3)
- **Status**: ❌ Invalid API key
- **URL**: https://api.together.xyz/settings/api-keys
- **Free Tier**: $25 credit on signup
- **Models**: DeepSeek V3, Llama 3.3 70B, Qwen 2.5
- **Why Use**: Cost-effective, good quality
- **Old Key**: `key_CYp6RHnopGPzbji8vdSy3` (invalid)

**How to Get New Key:**
1. Go to https://api.together.xyz/signup
2. Sign up with email
3. Verify email
4. Go to https://api.together.xyz/settings/api-keys
5. Click "Create new API key"
6. Copy key and paste in `.env.local`

#### 4. OpenRouter
- **Status**: ❌ User not found
- **URL**: https://openrouter.ai/keys
- **Free Tier**: Limited free credits
- **Models**: Access to 100+ models (GPT-4, Claude, etc.)
- **Why Use**: Model aggregator, fallback option
- **Old Key**: `sk-or-v1-6fb807ef...` (invalid)

**How to Get New Key:**
1. Go to https://openrouter.ai/
2. Sign in with Google/GitHub
3. Go to https://openrouter.ai/keys
4. Click "Create Key"
5. Copy key and paste in `.env.local`

---

### 🔄 Optional (Not Required)

#### 5. Cerebras (Llama 3.3 70B)
- **Status**: ⚪ Not configured
- **URL**: https://cloud.cerebras.ai/
- **Free Tier**: Limited free inference
- **Models**: Llama 3.3 70B (fastest)
- **Why Use**: Extremely fast inference
- **Current Key**: Empty

**How to Get Key:**
1. Go to https://cloud.cerebras.ai/
2. Sign up
3. Go to API Keys section
4. Generate new key
5. Add to `.env.local`

#### 6. Mistral AI
- **Status**: ⚪ Not configured
- **URL**: https://console.mistral.ai/api-keys
- **Free Tier**: Limited free credits
- **Models**: Mistral Large, Mixtral 8x22B
- **Why Use**: European AI, GDPR compliant
- **Current Key**: Empty

**How to Get Key:**
1. Go to https://console.mistral.ai/
2. Sign up
3. Go to API Keys
4. Create new key
5. Add to `.env.local`

---

## 🚀 Quick Setup Instructions

### Step 1: Update .env.local

Open `.env.local` and replace the invalid keys:

```bash
# Together AI (Get from: https://api.together.xyz/settings/api-keys)
TOGETHER_API_KEY=your_new_together_key_here

# OpenRouter (Get from: https://openrouter.ai/keys)
OPENROUTER_API_KEY=your_new_openrouter_key_here
```

### Step 2: Restart Development Server

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 3: Test API Keys

```bash
# Test Together AI
curl https://api.together.xyz/v1/models \
  -H "Authorization: Bearer YOUR_TOGETHER_KEY"

# Test OpenRouter
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer YOUR_OPENROUTER_KEY"
```

---

## 📊 API Key Priority System

SIA uses a fallback system for AI generation:

1. **Primary**: GROQ (fastest, free)
2. **Secondary**: Gemini (high quality, free)
3. **Tertiary**: Together AI (cost-effective)
4. **Fallback**: OpenRouter (model variety)

If one fails, the system automatically tries the next.

---

## 🔒 Security Best Practices

### DO:
✅ Keep API keys in `.env.local` (gitignored)
✅ Never commit keys to GitHub
✅ Rotate keys every 90 days
✅ Use environment-specific keys (dev/prod)
✅ Monitor usage in provider dashboards

### DON'T:
❌ Share keys publicly
❌ Commit `.env.local` to git
❌ Use production keys in development
❌ Hardcode keys in source code
❌ Expose keys in client-side code

---

## 💰 Cost Comparison

| Provider | Free Tier | Cost After Free | Speed | Quality |
|----------|-----------|-----------------|-------|---------|
| GROQ | Unlimited* | N/A | ⚡⚡⚡⚡⚡ | ⭐⭐⭐⭐ |
| Gemini | 60 req/min | $0.35/1M tokens | ⚡⚡⚡⚡ | ⭐⭐⭐⭐⭐ |
| Together AI | $25 credit | $0.20/1M tokens | ⚡⚡⚡ | ⭐⭐⭐⭐ |
| OpenRouter | Limited | Varies by model | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ |
| Cerebras | Limited | $0.60/1M tokens | ⚡⚡⚡⚡⚡ | ⭐⭐⭐⭐ |
| Mistral | Limited | $2.00/1M tokens | ⚡⚡⚡ | ⭐⭐⭐⭐ |

*Rate limited but no hard cap

---

## 🐛 Troubleshooting

### "Invalid API key" Error

**Problem**: API key is invalid or expired

**Solution**:
1. Check key format (no extra spaces)
2. Verify key is active in provider dashboard
3. Generate new key if expired
4. Restart dev server after updating

### "Rate limit exceeded" Error

**Problem**: Too many requests

**Solution**:
1. Wait 60 seconds
2. System will auto-fallback to next provider
3. Consider upgrading to paid tier
4. Implement request caching

### "Model not found" Error

**Problem**: Requested model not available

**Solution**:
1. Check model name spelling
2. Verify model is available in your region
3. Use alternative model
4. Check provider documentation

---

## 📞 Support

### Provider Support
- **GROQ**: https://console.groq.com/docs
- **Gemini**: https://ai.google.dev/docs
- **Together AI**: https://docs.together.ai/
- **OpenRouter**: https://openrouter.ai/docs

### SIA Support
- **Documentation**: `/docs` folder
- **Issues**: Check console logs
- **Email**: dev@siaintel.com

---

## 🔄 Auto-Update Script

Create a script to check key validity:

```bash
# scripts/check-api-keys.sh
#!/bin/bash

echo "Checking API keys..."

# Check GROQ
if [ -n "$GROQ_API_KEY" ]; then
  echo "✅ GROQ key found"
else
  echo "❌ GROQ key missing"
fi

# Check Gemini
if [ -n "$GEMINI_API_KEY" ]; then
  echo "✅ Gemini key found"
else
  echo "❌ Gemini key missing"
fi

# Check Together AI
if [ -n "$TOGETHER_API_KEY" ]; then
  echo "✅ Together AI key found"
else
  echo "⚠️  Together AI key missing (optional)"
fi

# Check OpenRouter
if [ -n "$OPENROUTER_API_KEY" ]; then
  echo "✅ OpenRouter key found"
else
  echo "⚠️  OpenRouter key missing (optional)"
fi
```

Run with:
```bash
chmod +x scripts/check-api-keys.sh
./scripts/check-api-keys.sh
```

---

**Last Updated**: March 7, 2026  
**Version**: 1.0.0  
**Status**: Active
