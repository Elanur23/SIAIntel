# Requirements Document

## Introduction

THE FACTORY is an autonomous video production system that transforms financial intelligence into multi-language video content. The system extends the existing Sovereign Core intelligence platform by adding voice synthesis and video composition capabilities, creating a fully automated "Financial Intelligence & Video Factory" that operates on 30-minute cycles without human intervention.

The system ingests financial news via RSS feeds, analyzes content using Gemini AI across 6 languages, synthesizes neural voice narration, and composes professional videos with financial data visualizations - all autonomously.

## Glossary

- **THE_FACTORY**: The complete autonomous video production system (Sovereign V14)
- **SCOUT**: RSS news aggregation module (existing, to be enhanced)
- **BRAIN**: Gemini AI analysis module for multi-language intelligence generation (existing)
- **VOICE**: Neural voice synthesis module using edge-tts (new)
- **COMPOSITOR**: Video composition module using MoviePy (new)
- **Intelligence_Report**: JSON structure containing title, script, and sentiment in 6 languages
- **Video_Asset**: Final .mp4 video file with audio, overlays, and financial charts
- **Deduplication_Database**: SQLite database tracking processed news articles by URL
- **Autonomous_Cycle**: 30-minute interval for checking new news and producing videos
- **Neural_Voice**: High-quality text-to-speech output using edge-tts neural models
- **Financial_Chart**: 24-hour price chart generated from yfinance data
- **Sentiment_Score**: Fear & Greed index value from BRAIN analysis
- **Output_Directory**: File system structure for organizing videos, audio, and assets

## Requirements

### Requirement 1: Database Migration to SQLite

**User Story:** As a system operator, I want persistent deduplication using SQLite, so that the system reliably prevents duplicate video production across restarts.

#### Acceptance Criteria

1. THE Deduplication_Database SHALL store processed article URLs with timestamps using SQLite
2. WHEN SCOUT discovers a news article, THE Deduplication_Database SHALL check if the URL exists in the database
3. IF a URL exists in the database, THEN THE_FACTORY SHALL skip processing that article
4. THE Deduplication_Database SHALL persist data across system restarts
5. THE Deduplication_Database SHALL use the schema: `CREATE TABLE processed_articles (id INTEGER PRIMARY KEY, url TEXT UNIQUE NOT NULL, processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, title TEXT, language TEXT)`

### Requirement 2: Voice Synthesis Module

**User Story:** As a content creator, I want neural voice narration in 6 languages, so that videos have professional-quality audio in each target market.

#### Acceptance Criteria

1. WHEN BRAIN generates an Intelligence_Report, THE VOICE SHALL synthesize Neural_Voice audio for all 6 languages
2. THE VOICE SHALL use edge-tts library with neural voice models
3. THE VOICE SHALL use language-specific neural voices: tr-TR-AhmetNeural (Turkish), en-US-GuyNeural (English), de-DE-ConradNeural (German), es-ES-AlvaroNeural (Spanish), fr-FR-HenriNeural (French), ar-SA-HamedNeural (Arabic)
4. THE VOICE SHALL save audio files as .mp3 format in `output/audio/{article_id}_{lang}.mp3`
5. WHEN voice synthesis fails for any language, THE VOICE SHALL log the error and continue processing remaining languages
6. THE VOICE SHALL generate audio from the 'script' field of each language in the Intelligence_Report

### Requirement 3: Video Composition Module

**User Story:** As a content distributor, I want professional video compositions with financial data, so that the content is visually engaging and informative.

#### Acceptance Criteria

1. WHEN VOICE completes audio synthesis, THE COMPOSITOR SHALL create a Video_Asset for each language
2. THE COMPOSITOR SHALL use MoviePy library for video composition
3. THE COMPOSITOR SHALL load a background image from `assets/studio_background.jpg` or `assets/ai_anchor.jpg`
4. THE COMPOSITOR SHALL overlay the article title from Intelligence_Report on the video at coordinates (50, 50) with font size 48
5. THE COMPOSITOR SHALL overlay the Sentiment_Score on the video at coordinates (50, 150) with format "Fear & Greed: {score}/100"
6. WHEN a financial symbol is detected in the article, THE COMPOSITOR SHALL generate a Financial_Chart using yfinance for the last 24 hours
7. THE COMPOSITOR SHALL overlay the Financial_Chart at coordinates (video_width - 420, video_height - 320) with size 400x300 pixels
8. THE COMPOSITOR SHALL synchronize the Neural_Voice audio track with video duration
9. THE COMPOSITOR SHALL render videos as .mp4 format with H.264 codec at 1920x1080 resolution and 30 fps
10. THE COMPOSITOR SHALL save videos to `output/videos/{article_id}_{lang}.mp4`

### Requirement 4: Financial Chart Generation

**User Story:** As a financial analyst, I want real-time price charts in videos, so that viewers see current market data alongside news analysis.

#### Acceptance Criteria

1. WHEN COMPOSITOR processes an article mentioning BTC, Bitcoin, or cryptocurrency, THE COMPOSITOR SHALL fetch BTC-USD data from yfinance
2. WHEN COMPOSITOR processes an article mentioning Nasdaq or tech stocks, THE COMPOSITOR SHALL fetch ^IXIC data from yfinance
3. WHEN COMPOSITOR processes an article mentioning S&P 500, THE COMPOSITOR SHALL fetch ^GSPC data from yfinance
4. THE COMPOSITOR SHALL generate a line chart showing the last 24 hours of price data
5. THE COMPOSITOR SHALL use matplotlib to render charts with transparent background, white gridlines, and cyan line color
6. THE COMPOSITOR SHALL save chart images as PNG with 400x300 pixel dimensions
7. IF yfinance data fetch fails, THEN THE COMPOSITOR SHALL continue video composition without the chart overlay

### Requirement 5: Autonomous Cycle Management

**User Story:** As a system operator, I want 30-minute autonomous cycles, so that the system continuously produces fresh content without manual intervention.

#### Acceptance Criteria

1. THE_FACTORY SHALL execute the complete pipeline (SCOUT → BRAIN → VOICE → COMPOSITOR) every 30 minutes
2. THE_FACTORY SHALL use APScheduler with IntervalTrigger set to 1800 seconds
3. WHEN a cycle begins, THE_FACTORY SHALL log the cycle start timestamp
4. WHEN a cycle completes, THE_FACTORY SHALL log the number of videos produced and cycle duration
5. IF any module fails during a cycle, THEN THE_FACTORY SHALL log the error and continue to the next cycle
6. THE_FACTORY SHALL maintain the existing 45-second base delay between Gemini API calls
7. THE_FACTORY SHALL maintain the existing 60-second retry delay on 429 rate limit errors

### Requirement 6: Output Directory Structure

**User Story:** As a system administrator, I want organized output directories, so that generated assets are easy to locate and manage.

#### Acceptance Criteria

1. WHEN THE_FACTORY starts, THE_FACTORY SHALL create directory structure: `output/videos/`, `output/audio/`, `assets/`
2. THE_FACTORY SHALL verify the existence of `assets/studio_background.jpg` on startup
3. IF `assets/studio_background.jpg` does not exist, THEN THE_FACTORY SHALL log a warning and use a solid color background
4. THE_FACTORY SHALL organize audio files by article ID and language code
5. THE_FACTORY SHALL organize video files by article ID and language code
6. THE_FACTORY SHALL use naming convention: `{article_id}_{lang_code}.{extension}`

### Requirement 7: Environment Configuration

**User Story:** As a deployment engineer, I want environment-based configuration, so that API keys and settings are secure and environment-specific.

#### Acceptance Criteria

1. THE_FACTORY SHALL read the Gemini API key from environment variable `GEMINI_API_KEY`
2. THE_FACTORY SHALL read the FastAPI host from environment variable `HOST` with default value "0.0.0.0"
3. THE_FACTORY SHALL read the FastAPI port from environment variable `PORT` with default value 8000
4. THE_FACTORY SHALL read the cycle interval from environment variable `CYCLE_INTERVAL_MINUTES` with default value 30
5. IF `GEMINI_API_KEY` is not set, THEN THE_FACTORY SHALL raise a configuration error on startup
6. THE_FACTORY SHALL load environment variables from `.env` file using python-dotenv

### Requirement 8: Integration with Existing SCOUT Module

**User Story:** As a system integrator, I want seamless integration with existing SCOUT, so that news aggregation continues without disruption.

#### Acceptance Criteria

1. THE_FACTORY SHALL use the existing `core/scout.py` module without modification to its RSS aggregation logic
2. THE_FACTORY SHALL maintain the existing RSS feed sources: Google News (Bitcoin), Google News (Nasdaq), Google News (Fed)
3. THE_FACTORY SHALL pass SCOUT results to the Deduplication_Database for URL checking
4. THE_FACTORY SHALL filter out duplicate articles before passing to BRAIN
5. THE_FACTORY SHALL preserve SCOUT's existing error handling and retry logic

### Requirement 9: Integration with Existing BRAIN Module

**User Story:** As a system integrator, I want seamless integration with existing BRAIN, so that intelligence analysis continues with the same quality.

#### Acceptance Criteria

1. THE_FACTORY SHALL use the existing `core/brain.py` module for Gemini 2.5 Pro analysis
2. THE_FACTORY SHALL maintain the existing 6-language output format: EN, TR, DE, ES, FR, AR
3. THE_FACTORY SHALL maintain the existing JSON schema: `{'lang': {'title': '', 'script': '', 'sentiment': ''}}`
4. THE_FACTORY SHALL maintain the existing "Wall Street Expert" tonality for all languages
5. THE_FACTORY SHALL maintain the existing CPM-optimized regional variations
6. THE_FACTORY SHALL pass BRAIN output directly to VOICE module

### Requirement 10: Error Handling and Logging

**User Story:** As a system operator, I want comprehensive error logging, so that I can diagnose issues and monitor system health.

#### Acceptance Criteria

1. WHEN any module encounters an error, THE_FACTORY SHALL log the error with timestamp, module name, and error details
2. THE_FACTORY SHALL use Python logging module with INFO level for normal operations and ERROR level for failures
3. THE_FACTORY SHALL log to both console and file `logs/factory.log`
4. THE_FACTORY SHALL rotate log files daily with 30-day retention
5. WHEN VOICE synthesis fails, THE_FACTORY SHALL log the language and article ID
6. WHEN COMPOSITOR rendering fails, THE_FACTORY SHALL log the language, article ID, and MoviePy error
7. WHEN yfinance data fetch fails, THE_FACTORY SHALL log the symbol and continue without chart

### Requirement 11: Video Quality Standards

**User Story:** As a content quality manager, I want consistent video quality, so that all output meets professional broadcast standards.

#### Acceptance Criteria

1. THE COMPOSITOR SHALL render all videos at 1920x1080 resolution (Full HD)
2. THE COMPOSITOR SHALL use 30 frames per second for smooth playback
3. THE COMPOSITOR SHALL use H.264 video codec with CRF 23 for balanced quality and file size
4. THE COMPOSITOR SHALL use AAC audio codec at 192 kbps bitrate
5. THE COMPOSITOR SHALL ensure audio and video tracks are synchronized within 50 milliseconds
6. THE COMPOSITOR SHALL generate videos with duration matching the Neural_Voice audio length
7. THE COMPOSITOR SHALL use anti-aliased text rendering for all overlays

### Requirement 12: Symbol Detection and Chart Mapping

**User Story:** As a financial content producer, I want automatic symbol detection, so that relevant charts appear in videos without manual configuration.

#### Acceptance Criteria

1. WHEN article title or script contains "Bitcoin" or "BTC", THE COMPOSITOR SHALL use symbol "BTC-USD"
2. WHEN article title or script contains "Ethereum" or "ETH", THE COMPOSITOR SHALL use symbol "ETH-USD"
3. WHEN article title or script contains "Nasdaq", THE COMPOSITOR SHALL use symbol "^IXIC"
4. WHEN article title or script contains "S&P 500" or "SPX", THE COMPOSITOR SHALL use symbol "^GSPC"
5. WHEN article title or script contains "Dow Jones" or "DJIA", THE COMPOSITOR SHALL use symbol "^DJI"
6. WHEN article title or script contains "Fed" or "Federal Reserve", THE COMPOSITOR SHALL use symbol "^TNX" (10-year Treasury)
7. IF multiple symbols are detected, THE COMPOSITOR SHALL use the first detected symbol
8. IF no symbols are detected, THE COMPOSITOR SHALL create video without Financial_Chart overlay

### Requirement 13: Performance and Resource Management

**User Story:** As a system administrator, I want efficient resource usage, so that the system runs reliably on standard hardware.

#### Acceptance Criteria

1. THE COMPOSITOR SHALL process videos sequentially to avoid memory exhaustion
2. THE COMPOSITOR SHALL release MoviePy resources after each video render
3. THE_FACTORY SHALL limit concurrent Gemini API calls to 1 request at a time
4. THE_FACTORY SHALL clean up temporary chart images after video composition
5. WHEN system memory usage exceeds 80%, THE_FACTORY SHALL log a warning
6. THE_FACTORY SHALL complete a full cycle (all languages, all articles) within 25 minutes to allow buffer before next cycle

### Requirement 14: API Endpoints for Monitoring

**User Story:** As a system operator, I want API endpoints for monitoring, so that I can check system status and recent outputs.

#### Acceptance Criteria

1. THE_FACTORY SHALL expose GET endpoint `/api/status` returning system health and last cycle timestamp
2. THE_FACTORY SHALL expose GET endpoint `/api/videos/recent` returning list of last 10 produced videos with metadata
3. THE_FACTORY SHALL expose GET endpoint `/api/cycle/stats` returning statistics: total cycles, total videos, success rate
4. THE_FACTORY SHALL expose POST endpoint `/api/cycle/trigger` to manually trigger a production cycle
5. THE_FACTORY SHALL return JSON responses with proper HTTP status codes
6. THE_FACTORY SHALL include CORS headers to allow frontend access

### Requirement 15: Dependency Management

**User Story:** As a deployment engineer, I want clear dependency specifications, so that the system can be deployed reliably across environments.

#### Acceptance Criteria

1. THE_FACTORY SHALL document all Python dependencies in `requirements.txt`
2. THE requirements.txt SHALL include: fastapi, uvicorn, feedparser, google-generativeai, edge-tts, moviepy, yfinance, matplotlib, pillow, apscheduler, python-dotenv, sqlite3
3. THE requirements.txt SHALL specify minimum versions for critical dependencies
4. THE_FACTORY SHALL include a `README.md` with installation instructions
5. THE README.md SHALL document required system dependencies: ffmpeg, python 3.10+
6. THE README.md SHALL include example `.env` file configuration

