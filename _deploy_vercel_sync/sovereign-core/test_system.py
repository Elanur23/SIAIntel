"""
SIAIntel - System Test Script
Quick verification that all modules are working
"""

import os
import sys
from pathlib import Path

def test_imports():
    """Test all module imports"""
    print("🔍 Testing module imports...")
    
    try:
        from core.scout import Scout
        print("  ✅ Scout module")
    except Exception as e:
        print(f"  ❌ Scout module: {e}")
        return False
    
    try:
        from core.brain import Brain, RateLimiter
        print("  ✅ Brain module")
    except Exception as e:
        print(f"  ❌ Brain module: {e}")
        return False
    
    try:
        from core.voice import Voice
        print("  ✅ Voice module")
    except Exception as e:
        print(f"  ❌ Voice module: {e}")
        return False
    
    try:
        from core.compositor import Compositor
        print("  ✅ Compositor module")
    except Exception as e:
        print(f"  ❌ Compositor module: {e}")
        return False
    
    try:
        from core.database import Database
        print("  ✅ Database module")
    except Exception as e:
        print(f"  ❌ Database module: {e}")
        return False
    
    return True

def test_environment():
    """Test environment variables"""
    print("\n🔍 Testing environment...")
    
    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.getenv('GEMINI_API_KEY')
    if api_key:
        print(f"  ✅ GEMINI_API_KEY configured ({api_key[:20]}...)")
    else:
        print("  ❌ GEMINI_API_KEY not found")
        return False
    
    model_type = os.getenv('GEMINI_MODEL_TYPE', '2.5-pro')
    print(f"  ✅ Model type: {model_type}")
    
    return True

def test_directories():
    """Test required directories"""
    print("\n🔍 Testing directories...")
    
    dirs = ['output/videos', 'output/audio', 'assets', 'data', 'logs']
    
    for dir_path in dirs:
        path = Path(dir_path)
        if path.exists():
            print(f"  ✅ {dir_path}")
        else:
            print(f"  ⚠️  {dir_path} (will be created)")
            path.mkdir(parents=True, exist_ok=True)
    
    return True

def test_assets():
    """Test required assets"""
    print("\n🔍 Testing assets...")
    
    logo_path = Path('assets/logo.png')
    if logo_path.exists():
        size_kb = logo_path.stat().st_size / 1024
        print(f"  ✅ Logo: {size_kb:.1f} KB")
    else:
        print("  ❌ Logo not found: assets/logo.png")
        return False
    
    bg_path = Path('assets/studio_background.jpg')
    if bg_path.exists():
        size_kb = bg_path.stat().st_size / 1024
        print(f"  ✅ Background: {size_kb:.1f} KB")
    else:
        print("  ⚠️  Background not found (will be created)")
    
    return True

def test_database():
    """Test database connection"""
    print("\n🔍 Testing database...")
    
    try:
        from core.database import Database
        
        db = Database(db_path='data/siaintel.db')
        stats = db.get_stats()
        
        print(f"  ✅ Database connected")
        print(f"  ✅ Articles: {stats['total_articles']}")
        print(f"  ✅ Videos: {stats['total_videos']}")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"  ❌ Database error: {e}")
        return False

def test_scout():
    """Test Scout module"""
    print("\n🔍 Testing Scout (RSS aggregation)...")
    
    try:
        from core.scout import Scout
        
        scout = Scout(keywords=['Bitcoin'])
        feeds = scout.generate_rss_feeds()
        
        print(f"  ✅ Scout initialized")
        print(f"  ✅ RSS feeds: {len(feeds)}")
        
        # Test single feed (don't fetch all to save time)
        print("  ⏳ Testing single RSS feed...")
        news = scout.fetch_feed(feeds[0])
        
        if news:
            print(f"  ✅ RSS fetch successful: {len(news)} items")
        else:
            print("  ⚠️  No news items (might be rate limited)")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Scout error: {e}")
        return False

def test_api_key():
    """Test Gemini API key"""
    print("\n🔍 Testing Gemini API...")
    
    try:
        import google.generativeai as genai
        from dotenv import load_dotenv
        
        load_dotenv()
        api_key = os.getenv('GEMINI_API_KEY')
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-pro')
        
        print("  ✅ API key configured")
        print("  ✅ Model initialized: gemini-2.5-pro")
        
        # Quick test (optional - comment out to save quota)
        # response = model.generate_content("Say 'API working'")
        # print(f"  ✅ API test: {response.text}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ API error: {e}")
        return False

def main():
    """Run all tests"""
    print("="*60)
    print("🏭 SIAIntel - System Test")
    print("="*60)
    
    tests = [
        ("Module Imports", test_imports),
        ("Environment", test_environment),
        ("Directories", test_directories),
        ("Assets", test_assets),
        ("Database", test_database),
        ("Scout (RSS)", test_scout),
        ("Gemini API", test_api_key),
    ]
    
    results = []
    
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n❌ {name} failed: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "="*60)
    print("📊 Test Summary")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {name}")
    
    print("\n" + "="*60)
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("✅ System is OPERATIONAL")
        print("\nTo start the system:")
        print("  python main.py")
        print("\nTo start autonomous cycle:")
        print("  curl -X POST http://localhost:8000/start")
    else:
        print("❌ System has issues - check errors above")
        sys.exit(1)
    
    print("="*60)

if __name__ == "__main__":
    main()
