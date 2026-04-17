"""
Test Script: SIA Intelligence Report Format
Tests the new brain.py format with a sample financial news
"""

import os
import sys
import json
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.brain import Brain, RateLimiter
from core.scout import NewsItem

# Load environment
load_dotenv()

def test_sia_format():
    """Test the new SIA Intelligence Report format"""
    
    print("=" * 80)
    print("SIA INTELLIGENCE REPORT FORMAT TEST")
    print("=" * 80)
    
    # Initialize
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("❌ GEMINI_API_KEY bulunamadı!")
        return
    
    rate_limiter = RateLimiter(base_delay=45)
    brain = Brain(api_key=api_key, rate_limiter=rate_limiter, model_type='2.5-pro')
    
    # Sample news
    sample_news = NewsItem(
        id="test_001",
        title="Federal Reserve Signals Potential Rate Cut Amid Economic Slowdown",
        content="""
        The Federal Reserve indicated today that it may consider cutting interest rates 
        in the coming months as economic indicators show signs of slowing growth. 
        Fed Chair Jerome Powell stated that the central bank is closely monitoring 
        inflation data and employment figures. Market analysts predict this could 
        trigger significant movements in equity markets and strengthen the dollar 
        against emerging market currencies. Major institutional investors are 
        repositioning portfolios in anticipation of the policy shift.
        """,
        source="Reuters",
        url="https://example.com/fed-rate-cut",
        published_at="2024-02-28T10:00:00Z"
    )
    
    print(f"\n📰 Test Haberi: {sample_news.title}\n")
    print("🔄 Gemini 2.5 Pro ile işleniyor...\n")
    
    # Process
    result = brain.process_news(sample_news)
    
    if result:
        print("✅ İŞLEM BAŞARILI!\n")
        print("=" * 80)
        print("SIA INTELLIGENCE REPORT - SAMPLE OUTPUT")
        print("=" * 80)
        
        for lang_content in result.languages:
            print(f"\n{'=' * 80}")
            print(f"{lang_content.flag} {lang_content.language.upper()} - CPM: ${lang_content.cpm}")
            print(f"{'=' * 80}")
            print(f"\n📌 TITLE: {lang_content.title}")
            print(f"\n📝 META: {lang_content.meta}")
            print(f"\n📊 EXECUTIVE SUMMARY:")
            print(f"   {lang_content.executive_summary}")
            print(f"\n📈 MARKET IMPACT: {lang_content.market_impact}/10")
            print(f"\n🔍 SOVEREIGN INSIGHT:")
            print(f"   {lang_content.sovereign_insight}")
            print(f"\n⚠️  RISK ASSESSMENT:")
            print(f"   {lang_content.risk_assessment}")
            print(f"\n💹 SENTIMENT: {lang_content.sentiment} ({lang_content.sentiment_score}% confidence)")
            print(f"\n🏷️  CPM TAGS: {', '.join(lang_content.cpm_tags)}")
            print(f"\n📄 CONTENT BRIEF:")
            print(f"   {lang_content.content_brief[:200]}...")
            
        print(f"\n{'=' * 80}")
        print(f"TOTAL CPM: ${result.total_cpm}")
        print(f"PROCESSED AT: {result.processed_at}")
        print(f"{'=' * 80}\n")
        
        # Save to JSON
        output_file = "data/test_sia_report.json"
        os.makedirs("data", exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result.model_dump(), f, ensure_ascii=False, indent=2)
        
        print(f"💾 Full report saved to: {output_file}\n")
        
    else:
        print("❌ İşlem başarısız!")

if __name__ == "__main__":
    test_sia_format()
