"""
Test script for THE LIVE PULSE streaming endpoint

Tests:
1. SSE connection establishment
2. Intelligence streaming with delays
3. Real-time timestamp generation
4. Heartbeat mechanism
"""

import requests
import json
import time
from datetime import datetime

def test_live_pulse_stream():
    """Test the /api/intelligence/stream endpoint"""
    
    print("\n" + "="*80)
    print("🎯 THE LIVE PULSE - Stream Test")
    print("="*80 + "\n")
    
    url = "http://localhost:8000/api/intelligence/stream"
    
    print(f"[TEST] Connecting to: {url}")
    print("[TEST] Waiting for intelligence stream...\n")
    
    try:
        # Stream with timeout
        response = requests.get(url, stream=True, timeout=120)
        
        if response.status_code != 200:
            print(f"❌ Connection failed: {response.status_code}")
            return
        
        print("✅ Stream connected\n")
        
        count = 0
        start_time = time.time()
        last_time = start_time
        
        # Read SSE stream
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                
                # Parse SSE data
                if line_str.startswith('data: '):
                    data_str = line_str[6:]  # Remove 'data: ' prefix
                    
                    try:
                        data = json.loads(data_str)
                        
                        # Handle heartbeat
                        if data.get('type') == 'heartbeat':
                            elapsed = time.time() - start_time
                            print(f"💓 Heartbeat at {elapsed:.1f}s")
                            continue
                        
                        # Handle error
                        if data.get('type') == 'error':
                            print(f"❌ Stream error: {data.get('message')}")
                            break
                        
                        # Intelligence item
                        count += 1
                        current_time = time.time()
                        delay = current_time - last_time
                        last_time = current_time
                        
                        print(f"📡 Intelligence #{count}")
                        print(f"   Time: {data.get('time', 'N/A')}")
                        print(f"   Title: {data.get('title', 'N/A')[:60]}...")
                        print(f"   Region: {data.get('region', 'N/A')}")
                        print(f"   Sentiment: {data.get('sentiment', 'N/A')}")
                        print(f"   Impact: {data.get('impact', 0)}%")
                        print(f"   Delay: {delay:.1f}s")
                        print()
                        
                        # Stop after 3 items for quick test
                        if count >= 3:
                            print(f"✅ Test complete: {count} intelligence items received")
                            print(f"⏱️  Total time: {time.time() - start_time:.1f}s")
                            break
                            
                    except json.JSONDecodeError as e:
                        print(f"❌ JSON parse error: {e}")
                        print(f"   Raw data: {data_str}")
        
        if count == 0:
            print("⚠️  No intelligence received (stream may be empty)")
        
    except requests.exceptions.Timeout:
        print("❌ Connection timeout (120s)")
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - is backend running?")
        print("   Start with: python main.py")
    except KeyboardInterrupt:
        print("\n⚠️  Test interrupted by user")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
    
    print("\n" + "="*80)

if __name__ == "__main__":
    test_live_pulse_stream()
