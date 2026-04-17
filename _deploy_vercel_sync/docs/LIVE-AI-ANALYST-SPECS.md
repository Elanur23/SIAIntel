# Gemini Live AI Analyst - Technical Specifications

This document outlines the implementation plan for the real-time, multimodal AI voice analyst in the SIAIntel terminal.

## Core Technology
- **Engine**: Gemini 2.0 Flash (Multimodal Live API)
- **Protocol**: WebSockets (WSS) for full-duplex audio/vision streaming.
- **Latency Target**: < 500ms for voice-to-voice response.

## Feature Set (V1.0)
1. **Voice-Only Briefing**: Real-time financial market overview.
2. **Vision Integration**: Ability to "see" charts if the user shares their screen or camera.
3. **9-Language Recognition**: Automatic detection of the terminal's active language.
4. **Context Awareness**: The analyst is aware of recent reports published in the SIA DB.

## UI/UX Integration
- **Live Button**: A glowing, pulse-animated button in the header/sidebar.
- **Waveform Visualization**: Real-time frequency bars shown while the AI is speaking.
- **HUD Overlay**: Transparent "Command Node" interface for session management.

## Free Tier Management
- **Session Limiter**: Automatic 15-minute countdown display.
- **Concurrent Handler**: Logic to prevent more than 3 simultaneous sessions per API key.

## File Structure
- `lib/ai/gemini-live-client.ts`: WebSocket client and media stream handlers.
- `components/LiveAnalystHUD.tsx`: The main user interface for the conversation.
- `hooks/useLiveAnalyst.ts`: React state management for the session.
