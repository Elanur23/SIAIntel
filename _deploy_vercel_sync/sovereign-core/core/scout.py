"""
SOVEREIGN V14 - Scout Module
Google News RSS Tarayıcı (Haber Bulucu)
"""

import time
import hashlib
import logging
from typing import List
from datetime import datetime

import feedparser
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class NewsItem(BaseModel):
    """Haber öğesi veri modeli"""
    id: str
    title: str
    link: str
    published: str
    content: str
    source: str
    hash: str


class Scout:
    """RSS Haber Tarayıcı"""
    
    def __init__(self, keywords: List[str]):
        self.keywords = keywords
        logger.info(f"[SCOUT] {len(keywords)} anahtar kelime ile başlatıldı")
    
    def generate_rss_feeds(self) -> List[str]:
        """Google News RSS feed URL'lerini oluştur"""
        feeds = []
        for keyword in self.keywords:
            encoded_keyword = keyword.replace(' ', '+')
            url = f"https://news.google.com/rss/search?q={encoded_keyword}&hl=en-US&gl=US&ceid=US:en"
            feeds.append(url)
        return feeds
    
    def generate_hash(self, title: str, link: str) -> str:
        """Deduplication için MD5 hash oluştur"""
        return hashlib.md5(f"{title}{link}".encode()).hexdigest()
    
    def fetch_feed(self, feed_url: str) -> List[NewsItem]:
        """RSS feed'i çek ve parse et"""
        try:
            logger.info(f"[SCOUT] Taranıyor: {feed_url[:80]}...")
            feed = feedparser.parse(feed_url)
            
            news_items = []
            for entry in feed.entries[:5]:  # Feed başına 5 haber
                news_item = NewsItem(
                    id=f"news-{int(time.time())}-{len(news_items)}",
                    title=entry.get('title', 'Başlık yok'),
                    link=entry.get('link', ''),
                    published=entry.get('published', datetime.now().isoformat()),
                    content=entry.get('summary', entry.get('description', '')),
                    source=entry.get('source', {}).get('title', 'Bilinmeyen'),
                    hash=self.generate_hash(entry.get('title', ''), entry.get('link', ''))
                )
                news_items.append(news_item)
            
            logger.info(f"[SCOUT] {len(news_items)} haber bulundu")
            return news_items
            
        except Exception as e:
            logger.error(f"[SCOUT] Feed hatası: {e}")
            return []
    
    def aggregate_news(self) -> List[NewsItem]:
        """Tüm RSS feed'lerden haberleri topla"""
        logger.info("[SCOUT] Haber toplama başladı...")
        
        feeds = self.generate_rss_feeds()
        all_news = []
        
        for feed_url in feeds:
            items = self.fetch_feed(feed_url)
            all_news.extend(items)
            time.sleep(1)  # Feed'ler arası rate limit
        
        logger.info(f"[SCOUT] Toplam {len(all_news)} haber toplandı")
        return all_news
