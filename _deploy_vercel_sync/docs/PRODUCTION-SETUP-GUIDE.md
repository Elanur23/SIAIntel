# 🚀 SIAINTEL - Production Setup Guide

This guide outlines the steps to deploy the SIAINTEL terminal to a production environment.

## 📋 Prerequisites
- ✅ A domain name (e.g., siaintel.com)
- ✅ Google Gemini API Key
- ✅ Google Indexing API Credentials
- ✅ Node.js 18+ environment

## 🔧 Environment Configuration
Set the following variables in your production environment:
```bash
SITE_NAME=SIAINTEL
NEXT_PUBLIC_SITE_URL=https://siaintel.com
# AI Keys
GEMINI_API_KEY=your_key
SAMBANOVA_API_KEY=your_key
```

## 🚀 Deployment
1. Connect your repository to Vercel.
2. Configure the environment variables.
3. Run `npm run build`.
4. Deploy to production.

Your site is now live at `https://siaintel.com`! 🎉
