# SIA Agentic Intelligence - Function Calling Specifications

This document defines the official "SIA Multi-Tool" suite available to the Gemini 1.5 Pro and 2.0 Flash models.

## 🛠️ Registered Tools

### 1. `get_market_data`
- **Purpose**: Fetch real-time price and 24h metrics.
- **Symbol Format**: Ticker symbols (e.g., BTC, NVDA).
- **Primary Source**: Binance API (Crypto), Simulated Scan (Stocks).

### 2. `analyze_technical_indicators`
- **Purpose**: Calculate and interpret RSI and SMA20.
- **Uplink**: Fetches 100 hourly candles from Binance.
- **Logic**: Neural interpretation of market momentum.

### 3. `convert_currency`
- **Purpose**: Exchange rate calculations.
- **Support**: Fiat-to-Fiat, Crypto-to-Fiat.

### 4. `generate_intelligence_pdf` [PROPOSED]
- **Purpose**: Trigger the PDF report engine for a specific article ID.

## 🔗 Integration Points

### A. Terminal Chat Interface
- Direct text-based command execution.
- Auto-trigger based on user query intent.

### B. Live AI Analyst (Voice)
- **Official Integration**: The Gemini Live API session will include these tools.
- **User Flow**: User speaks command → AI calls tool → AI receives data → AI speaks the result.

## 🚀 Technical Implementation
- Logic centralized in `lib/ai/market-functions.ts`.
- Loop management in `lib/sia-news/gemini-integration.ts`.
- Client-side event bridge for UI-related functions.
