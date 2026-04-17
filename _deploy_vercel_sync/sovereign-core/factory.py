"""
SIAIntel Factory - Autonomous Video Production Engine
Scans RSS feeds, analyzes with Gemini, produces multi-language videos

Bu factory, mevcut sovereign-core modüllerini kullanarak:
1. RSS feed'lerden haber toplar (Scout)
2. Gemini ile 6 dilde analiz eder (Brain)
3. Her dil için ses üretir (Voice)
4. Logolu video oluşturur (Compositor)
5. SQLite'a kaydeder (Database)
"""

import os
import sys
import time
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
import feedparser
from dotenv import load_dotenv

# Import core modules
from core.scout import Scout, NewsItem
from core.brain import Brain, RateLimiter, IntelligencePackage
from core.voice import Voice
from core.compositor import Compositor
from core.database import Database

# Load environment
load_dotenv()

# Configure logging
log_dir = Path('logs')
log_dir.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(levelname)s] - %(message)s',
    handlers=[
        logging.FileHandler(log_dir / 'factory.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class Factory:
    """Main factory controller for autonomous video production"""
    
    # Financial RSS feeds (5 premium sources)
    RSS_SOURCES = [
        'https://www.coindesk.com/arc/outboundfeeds/rss/',
        'https://cointelegraph.com/rss',
        'https://www.investing.com/rss/news.rss',
        'https://feeds.finance.yahoo.com/rss/2.0/headline',
        'https://www.marketwatch.com/rss/topstories'
    ]
    
    # Financial keywords for Google News
    KEYWORDS = [
        'Bitcoin price',
        'Ethereum market',
        'Stock market news',
        'Federal Reserve',
        'Cryptocurrency regulation'
    ]
    
    # Supported languages
    LANGUAGES = ['en', 'tr', 'de', 'es', 'fr', 'ar']
    
    # Cycle interval (30 minutes)
    CYCLE_INTERVAL = 30 * 60  # seconds
    
    def __init__(self):
        """Initialize factory components"""
        logger.info("🏭 Initializing SIAIntel Factory...")
        
        # Get API key
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment")
        
        # Initialize rate limiter
        self.rate_limiter = RateLimiter(base_delay=45)
        
        # Initialize core modules
        self.scout = Scout(keywords=self.KEYWORDS)
        self.brain = Brain(
            api_key=api_key,
            rate_limiter=self.rate_limiter,
            model_type='2.5-pro'
        )
        self.voice = Voice()
        self.compositor = Compositor()
        self.db = Database()
        
        # Create output directories
        self.output_dir = Path('../public/videos')
        self.data_dir = Path('data')
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info("✅ Factory initialized successfully")
        logger.info(f"   - Model: Gemini 2.5 Pro")
        logger.info(f"   - Rate Limit: 45s base delay")
        logger.info(f"   - Output: {self.output_dir.absolute()}")
        logger.info(f"   - Database: {self.db.db_path}")
    
    def scan_feeds(self) -> List[NewsItem]:
        """Scan RSS feeds and Google News for new articles"""
        logger.info(f"📡 Scanning {len(self.RSS_SOURCES)} RSS sources + Google News...")
        
        all_news = []
        
        # 1. Scan direct RSS feeds
        for source_url in self.RSS_SOURCES:
            try:
                feed = feedparser.parse(source_url)
                source_name = feed.feed.get('title', 'Unknown')
                logger.info(f"  ✓ {source_name} - {len(feed.entries)} entries")
                
                for entry in feed.entries[:3]:  # Top 3 from each source
                    news_item = NewsItem(
                        id=f"rss-{int(time.time())}-{len(all_news)}",
                        title=entry.get('title', ''),
                        link=entry.get('link', ''),
                        published=entry.get('published', datetime.now().isoformat()),
                        content=entry.get('summary', entry.get('description', '')),
                        source=source_name,
                        hash=self.scout.generate_hash(
                            entry.get('title', ''),
                            entry.get('link', '')
                        )
                    )
                    all_news.append(news_item)
                    
                time.sleep(1)  # Rate limit between feeds
                    
            except Exception as e:
                logger.error(f"  ✗ Failed to parse {source_url}: {e}")
                continue
        
        # 2. Scan Google News with keywords
        google_news = self.scout.aggregate_news()
        all_news.extend(google_news)
        
        logger.info(f"📊 Total articles collected: {len(all_news)}")
        return all_news
    
    def filter_new_articles(self, articles: List[NewsItem]) -> List[NewsItem]:
        """Filter out already processed articles using database"""
        new_articles = []
        
        for article in articles:
            # Check if article already exists in database
            if not self.db.article_exists(article.link):
                new_articles.append(article)
        
        logger.info(f"🆕 New articles to process: {len(new_articles)}")
        return new_articles
    
    def process_article(self, news_item: NewsItem):
        """Process single article: analyze with Brain and produce videos"""
        logger.info(f"\n{'='*60}")
        logger.info(f"📰 Processing: {news_item.title}")
        logger.info(f"{'='*60}")
        
        # Analyze with Gemini Brain (6 languages)
        intelligence = self.brain.process_news(news_item)
        
        if not intelligence:
            logger.warning("⚠️  Brain analysis failed, skipping...")
            return
        
        # Produce videos for each language
        videos = {}
        for lang_content in intelligence.languages:
            try:
                lang_code = lang_content.language_code
                logger.info(f"🎬 Producing video: {lang_code.upper()}")
                
                # Generate audio with Voice module
                logger.info("  → Generating audio...")
                audio_path = self.voice.synthesize(
                    text=lang_content.full_content[:500],  # First 500 chars for 45s video
                    language=lang_code
                )
                
                if not audio_path:
                    logger.error(f"  ✗ Audio generation failed for {lang_code}")
                    continue
                
                # Create video with Compositor
                logger.info("  → Compositing video...")
                video_path = self.compositor.create_video(
                    audio_path=audio_path,
                    title=lang_content.title,
                    language=lang_code,
                    duration=45
                )
                
                if video_path:
                    videos[lang_code] = str(video_path)
                    logger.info(f"  ✓ Video created: {video_path}")
                else:
                    logger.error(f"  ✗ Video creation failed for {lang_code}")
                
            except Exception as e:
                logger.error(f"  ✗ Video production failed for {lang_code}: {e}")
                continue
        
        # Save to database
        try:
            self.db.save_article(
                url=news_item.link,
                title=news_item.title,
                intelligence=intelligence,
                videos=videos
            )
            logger.info(f"💾 Saved to database")
        except Exception as e:
            logger.error(f"❌ Database save failed: {e}")
        
        # Update feed.json
        self.update_feed_json(news_item, intelligence, videos)
        
        logger.info(f"✅ Article processed: {len(videos)}/{len(intelligence.languages)} videos produced")
    
    def update_feed_json(self, news_item: NewsItem, intelligence: IntelligencePackage, videos: Dict[str, str]):
        """Update public feed.json file for Next.js frontend"""
        feed_path = self.data_dir / 'feed.json'
        
        # Load existing feed
        if feed_path.exists():
            with open(feed_path, 'r', encoding='utf-8') as f:
                feed_data = json.load(f)
        else:
            feed_data = {'articles': [], 'last_updated': None}
        
        # Add new article
        feed_item = {
            'id': intelligence.news_id,
            'title': news_item.title,
            'link': news_item.link,
            'published': news_item.published,
            'source': news_item.source,
            'processed_at': intelligence.processed_at,
            'total_cpm': intelligence.total_cpm,
            'languages': [
                {
                    'code': lang.language_code,
                    'language': lang.language,
                    'flag': lang.flag,
                    'cpm': lang.cpm,
                    'title': lang.title,
                    'meta': lang.meta,
                    'sentiment': lang.sentiment,
                    'sentiment_score': lang.sentiment_score,
                    'video': videos.get(lang.language_code)
                }
                for lang in intelligence.languages
            ]
        }
        
        feed_data['articles'].insert(0, feed_item)
        feed_data['last_updated'] = datetime.now().isoformat()
        
        # Keep only last 100 articles
        feed_data['articles'] = feed_data['articles'][:100]
        
        # Save
        with open(feed_path, 'w', encoding='utf-8') as f:
            json.dump(feed_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"📝 Feed updated: {feed_path}")
    
    def run_cycle(self):
        """Run single production cycle"""
        cycle_start = time.time()
        logger.info(f"\n{'#'*60}")
        logger.info(f"🚀 STARTING PRODUCTION CYCLE")
        logger.info(f"{'#'*60}\n")
        
        try:
            # 1. Scan RSS feeds
            articles = self.scan_feeds()
            
            if not articles:
                logger.warning("⚠️  No articles found")
                return
            
            # 2. Filter new articles
            new_articles = self.filter_new_articles(articles)
            
            if not new_articles:
                logger.info("✓ No new articles to process")
                return
            
            # 3. Process top 3 articles
            for article in new_articles[:3]:
                try:
                    self.process_article(article)
                except Exception as e:
                    logger.error(f"❌ Failed to process article: {e}")
                    continue
            
        except Exception as e:
            logger.error(f"❌ Cycle failed: {e}")
        
        finally:
            cycle_duration = time.time() - cycle_start
            logger.info(f"\n{'#'*60}")
            logger.info(f"✅ CYCLE COMPLETED in {cycle_duration:.1f}s")
            logger.info(f"{'#'*60}\n")
    
    def run_forever(self):
        """Run factory in infinite loop"""
        logger.info(f"\n{'='*60}")
        logger.info(f"🏭 SIAIntel Factory - AUTONOMOUS MODE")
        logger.info(f"{'='*60}")
        logger.info(f"📊 Cycle Interval: {self.CYCLE_INTERVAL / 60} minutes")
        logger.info(f"📡 RSS Sources: {len(self.RSS_SOURCES)}")
        logger.info(f"🌍 Languages: {', '.join(self.LANGUAGES)}")
        logger.info(f"{'='*60}\n")
        
        cycle_count = 0
        
        while True:
            cycle_count += 1
            logger.info(f"🔄 Cycle #{cycle_count}")
            
            try:
                self.run_cycle()
            except KeyboardInterrupt:
                logger.info("\n⚠️  Shutdown signal received")
                break
            except Exception as e:
                logger.error(f"❌ Unexpected error: {e}")
            
            # Wait for next cycle
            logger.info(f"⏳ Waiting {self.CYCLE_INTERVAL / 60} minutes until next cycle...")
            time.sleep(self.CYCLE_INTERVAL)
        
        logger.info("👋 Factory shutdown complete")

def main():
    """Main entry point"""
    factory = Factory()
    factory.run_forever()

if __name__ == '__main__':
    main()
