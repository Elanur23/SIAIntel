# Gemini Nano Integration (On-Device AI)

SIAIntel Sovereign V14 now includes experimental support for **Gemini Nano**, Chrome's built-in large language model. This integration provides a "Last Line of Defense" for intelligence analysis when all cloud and local servers are unavailable.

## Architecture

The system uses a multi-layered AI fallback chain:
1.  **Cloud Primary**: Gemini 1.5 Pro / Groq Llama 3.3
2.  **Local Server**: Ollama (Llama 3 / Mistral)
3.  **On-Device (NEW)**: Gemini Nano (via `window.ai`)

## Key Features

-   **Offline Failover**: Basic analysis can continue even without internet or a local Ollama server.
-   **Zero-Latency Sensing**: Immediate sentiment and impact checks directly in the browser.
-   **Status Monitor**: A dedicated UI component in the footer shows if Local AI is active and its download status.
-   **Parallel Processing**: In the Manual Entry Editor, Nano provides a "Second Opinion" while cloud models generate the full 9-node report.

## How to Enable

Gemini Nano is currently an experimental feature in Chrome/Edge. To use it:
1.  Open Chrome and navigate to `chrome://flags`.
2.  Enable **"Enables optimization guide on device"**.
3.  Enable **"Prompt API for Gemini Nano"**.
4.  Relaunch Chrome.
5.  Navigate to `chrome://components` and check for **"Optimization Guide On Device Model"** to ensure it's downloaded.

## Technical Implementation

-   **Bridge**: `lib/ai/gemini-nano-bridge.ts` - Raw interface with `window.ai`.
-   **Hook**: `hooks/useNanoAnalyst.ts` - React-friendly wrapper for components.
-   **UI**: `components/GeminiNanoStatus.tsx` - User notification system.

---
**Status**: Experimental (V1.0)
**Security**: All data stays on the device during Nano analysis.
