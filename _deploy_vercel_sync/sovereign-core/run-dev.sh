#!/bin/bash
# Development server with auto-reload using uvicorn

echo "🏭 SIAIntel - Development Server"
echo "================================"
echo "Auto-reload: ENABLED"
echo "Port: 8000"
echo "Press Ctrl+C to stop"
echo ""

uvicorn main:app --reload --host 0.0.0.0 --port 8000
