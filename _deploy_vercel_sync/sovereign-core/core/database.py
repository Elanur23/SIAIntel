"""
SOVEREIGN V14 - Database Module
SQLite Bağlantısı (Haber Geçmişi) - THE FACTORY Edition
"""

import sqlite3
import logging
from typing import Dict, Optional, List
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)


class Database:
    """SQLite tabanlı veritabanı - Production ready"""
    
    def __init__(self, db_path: str = 'data/sovereign.db'):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        self._init_db()
        logger.info(f"[DATABASE] SQLite veritabanı başlatıldı: {self.db_path}")
    
    def _init_db(self):
        """Veritabanı tablolarını oluştur"""
        cursor = self.conn.cursor()
        
        # Processed articles tablosu
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS processed_articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT UNIQUE NOT NULL,
                hash TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                language TEXT,
                video_count INTEGER DEFAULT 0
            )
        """)
        
        # Video outputs tablosu
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS video_outputs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                article_id INTEGER NOT NULL,
                language_code TEXT NOT NULL,
                video_path TEXT NOT NULL,
                audio_path TEXT NOT NULL,
                duration_seconds REAL,
                file_size_mb REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (article_id) REFERENCES processed_articles(id)
            )
        """)
        
        self.conn.commit()
        
        # İstatistikleri logla
        cursor.execute("SELECT COUNT(*) FROM processed_articles")
        article_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM video_outputs")
        video_count = cursor.fetchone()[0]
        
        logger.info(f"[DATABASE] {article_count} işlenmiş haber, {video_count} video kaydı")
    
    def is_seen(self, news_hash: str) -> bool:
        """Haber daha önce görüldü mü?"""
        cursor = self.conn.cursor()
        cursor.execute("SELECT id FROM processed_articles WHERE hash = ?", (news_hash,))
        return cursor.fetchone() is not None
    
    def article_exists(self, url: str) -> bool:
        """URL'e göre haber var mı kontrol et"""
        cursor = self.conn.cursor()
        cursor.execute("SELECT id FROM processed_articles WHERE url = ?", (url,))
        return cursor.fetchone() is not None
    
    def mark_as_seen(self, news_hash: str, title: str, url: str = "") -> int:
        """Haberi görüldü olarak işaretle ve article_id döndür"""
        cursor = self.conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO processed_articles (hash, title, url, processed_at)
                VALUES (?, ?, ?, ?)
            """, (news_hash, title, url, datetime.now().isoformat()))
            
            self.conn.commit()
            article_id = cursor.lastrowid
            
            logger.info(f"[DATABASE] Görüldü olarak işaretlendi: {title[:50]}... (ID: {article_id})")
            return article_id
            
        except sqlite3.IntegrityError:
            # Zaten var, ID'yi getir
            cursor.execute("SELECT id FROM processed_articles WHERE hash = ?", (news_hash,))
            article_id = cursor.fetchone()[0]
            logger.warning(f"[DATABASE] Zaten mevcut: {title[:50]}... (ID: {article_id})")
            return article_id
    
    def save_video_output(
        self, 
        article_id: int, 
        language_code: str, 
        video_path: str, 
        audio_path: str,
        duration_seconds: float = 0,
        file_size_mb: float = 0
    ):
        """Video çıktısını kaydet"""
        cursor = self.conn.cursor()
        
        cursor.execute("""
            INSERT INTO video_outputs 
            (article_id, language_code, video_path, audio_path, duration_seconds, file_size_mb)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (article_id, language_code, video_path, audio_path, duration_seconds, file_size_mb))
        
        # Video sayısını güncelle
        cursor.execute("""
            UPDATE processed_articles 
            SET video_count = video_count + 1 
            WHERE id = ?
        """, (article_id,))
        
        self.conn.commit()
        logger.info(f"[DATABASE] Video kaydedildi: {language_code} - {video_path}")
    
    def get_recent_videos(self, limit: int = 10) -> List[Dict]:
        """Son üretilen videoları getir"""
        cursor = self.conn.cursor()
        
        cursor.execute("""
            SELECT 
                v.id,
                v.language_code,
                v.video_path,
                v.duration_seconds,
                v.file_size_mb,
                v.created_at,
                a.title,
                a.url
            FROM video_outputs v
            JOIN processed_articles a ON v.article_id = a.id
            ORDER BY v.created_at DESC
            LIMIT ?
        """, (limit,))
        
        rows = cursor.fetchall()
        
        return [
            {
                'id': row[0],
                'language_code': row[1],
                'video_path': row[2],
                'duration_seconds': row[3],
                'file_size_mb': row[4],
                'created_at': row[5],
                'title': row[6],
                'url': row[7]
            }
            for row in rows
        ]
    
    def get_stats(self) -> Dict:
        """Veritabanı istatistikleri"""
        cursor = self.conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM processed_articles")
        total_articles = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM video_outputs")
        total_videos = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT language_code, COUNT(*) 
            FROM video_outputs 
            GROUP BY language_code
        """)
        videos_by_language = dict(cursor.fetchall())
        
        cursor.execute("""
            SELECT MIN(processed_at), MAX(processed_at) 
            FROM processed_articles
        """)
        oldest, newest = cursor.fetchone()
        
        return {
            'total_articles': total_articles,
            'total_videos': total_videos,
            'videos_by_language': videos_by_language,
            'oldest_article': oldest,
            'newest_article': newest
        }
    
    def clear(self):
        """Veritabanını temizle (dikkatli kullan!)"""
        cursor = self.conn.cursor()
        cursor.execute("DELETE FROM video_outputs")
        cursor.execute("DELETE FROM processed_articles")
        self.conn.commit()
        logger.warning("[DATABASE] Veritabanı temizlendi!")
    
    def close(self):
        """Veritabanı bağlantısını kapat"""
        self.conn.close()
        logger.info("[DATABASE] Bağlantı kapatıldı")
