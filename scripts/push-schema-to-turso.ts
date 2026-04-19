import { createClient } from '@libsql/client/web';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function pushSchemaToTurso() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl || !tursoToken) {
    console.error('❌ TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env');
    process.exit(1);
  }

  console.log('🔗 Connecting to Turso database...');
  console.log(`   URL: ${tursoUrl}`);

  const client = createClient({
    url: tursoUrl,
    authToken: tursoToken,
  });

  try {
    // Read the Prisma schema and generate SQL
    console.log('\n📋 Creating tables from Prisma schema...\n');

    // Create tables in order (respecting foreign key dependencies)
    const tables = [
      // Independent tables first
      `CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "username" TEXT NOT NULL UNIQUE,
        "passwordHash" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'viewer',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        "twoFactorEnabled" INTEGER NOT NULL DEFAULT 0,
        "twoFactorSecret" TEXT,
        "twoFactorEnabledAt" DATETIME,
        "enabled" INTEGER NOT NULL DEFAULT 1,
        "passwordChangedAt" DATETIME
      )`,
      
      `CREATE TABLE IF NOT EXISTS "Session" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "hashedToken" TEXT NOT NULL UNIQUE,
        "userId" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expiresAt" DATETIME NOT NULL,
        "lastAccessedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "twoFactorVerified" INTEGER NOT NULL DEFAULT 0
      )`,
      
      `CREATE TABLE IF NOT EXISTS "BackupCode" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "userId" TEXT NOT NULL,
        "codeHash" TEXT NOT NULL,
        "used" INTEGER NOT NULL DEFAULT 0,
        "usedAt" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS "PasswordHistory" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "userId" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS "RateLimit" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "key" TEXT NOT NULL UNIQUE,
        "count" INTEGER NOT NULL DEFAULT 1,
        "resetTime" DATETIME NOT NULL,
        "firstAttempt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "action" TEXT NOT NULL,
        "userId" TEXT,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "success" INTEGER NOT NULL,
        "errorMessage" TEXT,
        "metadata" TEXT
      )`,
      
      `CREATE TABLE IF NOT EXISTS "RecoveryCode" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "userId" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "used" INTEGER NOT NULL DEFAULT 0,
        "usedAt" DATETIME,
        "invalidatedAt" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS "BlockedIP" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "ip" TEXT NOT NULL UNIQUE,
        "reason" TEXT NOT NULL,
        "blockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expiresAt" DATETIME,
        "blockedBy" TEXT
      )`,
      
      `CREATE TABLE IF NOT EXISTS "WarRoomArticle" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        "sourceId" TEXT,
        "source" TEXT DEFAULT 'SIAINTEL',
        "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "sentiment" TEXT,
        "confidence" INTEGER NOT NULL DEFAULT 90,
        "marketImpact" INTEGER NOT NULL DEFAULT 5,
        "category" TEXT DEFAULT 'GENERAL',
        "region" TEXT DEFAULT 'GLOBAL',
        "authorName" TEXT DEFAULT 'SIA Intelligence Unit',
        "authorRole" TEXT DEFAULT 'Senior Analyst',
        "authorBio" TEXT,
        "titleTr" TEXT,
        "summaryTr" TEXT,
        "titleEn" TEXT,
        "summaryEn" TEXT,
        "siaInsightTr" TEXT,
        "riskShieldTr" TEXT,
        "siaInsightEn" TEXT,
        "riskShieldEn" TEXT,
        "socialSnippetTr" TEXT,
        "socialSnippetEn" TEXT,
        "contentTr" TEXT,
        "contentEn" TEXT,
        "imageUrl" TEXT,
        "visualData" TEXT,
        "status" TEXT NOT NULL DEFAULT 'published',
        "contentAr" TEXT,
        "contentDe" TEXT,
        "contentEs" TEXT,
        "contentFr" TEXT,
        "contentJp" TEXT,
        "contentRu" TEXT,
        "contentZh" TEXT,
        "riskShieldAr" TEXT,
        "riskShieldDe" TEXT,
        "riskShieldEs" TEXT,
        "riskShieldFr" TEXT,
        "riskShieldJp" TEXT,
        "riskShieldRu" TEXT,
        "riskShieldZh" TEXT,
        "siaInsightAr" TEXT,
        "siaInsightDe" TEXT,
        "siaInsightEs" TEXT,
        "siaInsightFr" TEXT,
        "siaInsightJp" TEXT,
        "siaInsightRu" TEXT,
        "siaInsightZh" TEXT,
        "socialSnippetAr" TEXT,
        "socialSnippetDe" TEXT,
        "socialSnippetEs" TEXT,
        "socialSnippetFr" TEXT,
        "socialSnippetJp" TEXT,
        "socialSnippetRu" TEXT,
        "socialSnippetZh" TEXT,
        "summaryAr" TEXT,
        "summaryDe" TEXT,
        "summaryEs" TEXT,
        "summaryFr" TEXT,
        "summaryJp" TEXT,
        "summaryRu" TEXT,
        "summaryZh" TEXT,
        "titleAr" TEXT,
        "titleDe" TEXT,
        "titleEs" TEXT,
        "titleFr" TEXT,
        "titleJp" TEXT,
        "titleRu" TEXT,
        "titleZh" TEXT
      )`,
      
      `CREATE TABLE IF NOT EXISTS "Comment" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "content" TEXT NOT NULL,
        "authorName" TEXT NOT NULL DEFAULT 'Anonymous Analyst',
        "isVerified" INTEGER NOT NULL DEFAULT 0,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "lang" TEXT NOT NULL DEFAULT 'en',
        "articleId" TEXT NOT NULL,
        FOREIGN KEY ("articleId") REFERENCES "WarRoomArticle"("id") ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS "DistributionJob" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        "articleId" TEXT NOT NULL,
        "platforms" TEXT NOT NULL,
        "languages" TEXT NOT NULL,
        "mode" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'draft',
        "scheduledAt" DATETIME,
        "trustScore" INTEGER NOT NULL DEFAULT 0,
        "reviewedBy" TEXT,
        "reviewedAt" DATETIME
      )`,
      
      `CREATE TABLE IF NOT EXISTS "DistributionVariant" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "jobId" TEXT NOT NULL,
        "platform" TEXT NOT NULL,
        "language" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "mediaUrls" TEXT,
        "publishedAt" DATETIME,
        "externalId" TEXT,
        "externalUrl" TEXT,
        "views" INTEGER NOT NULL DEFAULT 0,
        "engagements" INTEGER NOT NULL DEFAULT 0,
        "clicks" INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY ("jobId") REFERENCES "DistributionJob"("id") ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS "GlossaryTerm" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        "term" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "translationEn" TEXT,
        "translationTr" TEXT,
        "translationDe" TEXT,
        "translationEs" TEXT,
        "translationFr" TEXT,
        "translationRu" TEXT,
        "translationAr" TEXT,
        "translationJp" TEXT,
        "translationZh" TEXT,
        "context" TEXT,
        "alternatives" TEXT,
        UNIQUE("term", "category")
      )`,
      
      `CREATE TABLE IF NOT EXISTS "Article" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "category" TEXT NOT NULL DEFAULT 'MARKET',
        "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "imageUrl" TEXT,
        "authorId" TEXT,
        "impact" INTEGER,
        "confidence" REAL,
        "signal" TEXT,
        "volatility" TEXT,
        "featured" INTEGER NOT NULL DEFAULT 0,
        "published" INTEGER NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      
      `CREATE TABLE IF NOT EXISTS "ArticleTranslation" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "articleId" TEXT NOT NULL,
        "lang" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "excerpt" TEXT NOT NULL DEFAULT '',
        "content" TEXT NOT NULL DEFAULT '',
        "slug" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE,
        UNIQUE("articleId", "lang"),
        UNIQUE("slug", "lang")
      )`,
    ];

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS "User_username_idx" ON "User"("username")',
      'CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role")',
      'CREATE INDEX IF NOT EXISTS "User_enabled_idx" ON "User"("enabled")',
      'CREATE INDEX IF NOT EXISTS "Session_hashedToken_idx" ON "Session"("hashedToken")',
      'CREATE INDEX IF NOT EXISTS "Session_expiresAt_idx" ON "Session"("expiresAt")',
      'CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId")',
      'CREATE INDEX IF NOT EXISTS "BackupCode_userId_idx" ON "BackupCode"("userId")',
      'CREATE INDEX IF NOT EXISTS "BackupCode_used_idx" ON "BackupCode"("used")',
      'CREATE INDEX IF NOT EXISTS "PasswordHistory_userId_idx" ON "PasswordHistory"("userId")',
      'CREATE INDEX IF NOT EXISTS "PasswordHistory_changedAt_idx" ON "PasswordHistory"("changedAt")',
      'CREATE INDEX IF NOT EXISTS "RateLimit_key_idx" ON "RateLimit"("key")',
      'CREATE INDEX IF NOT EXISTS "RateLimit_resetTime_idx" ON "RateLimit"("resetTime")',
      'CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action")',
      'CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId")',
      'CREATE INDEX IF NOT EXISTS "AuditLog_timestamp_idx" ON "AuditLog"("timestamp")',
      'CREATE INDEX IF NOT EXISTS "AuditLog_success_idx" ON "AuditLog"("success")',
      'CREATE INDEX IF NOT EXISTS "RecoveryCode_userId_idx" ON "RecoveryCode"("userId")',
      'CREATE INDEX IF NOT EXISTS "RecoveryCode_used_idx" ON "RecoveryCode"("used")',
      'CREATE INDEX IF NOT EXISTS "RecoveryCode_invalidatedAt_idx" ON "RecoveryCode"("invalidatedAt")',
      'CREATE INDEX IF NOT EXISTS "BlockedIP_ip_idx" ON "BlockedIP"("ip")',
      'CREATE INDEX IF NOT EXISTS "BlockedIP_expiresAt_idx" ON "BlockedIP"("expiresAt")',
      'CREATE INDEX IF NOT EXISTS "WarRoomArticle_status_idx" ON "WarRoomArticle"("status")',
      'CREATE INDEX IF NOT EXISTS "WarRoomArticle_publishedAt_idx" ON "WarRoomArticle"("publishedAt")',
      'CREATE INDEX IF NOT EXISTS "Comment_articleId_idx" ON "Comment"("articleId")',
      'CREATE INDEX IF NOT EXISTS "DistributionJob_articleId_idx" ON "DistributionJob"("articleId")',
      'CREATE INDEX IF NOT EXISTS "DistributionJob_status_idx" ON "DistributionJob"("status")',
      'CREATE INDEX IF NOT EXISTS "DistributionVariant_jobId_idx" ON "DistributionVariant"("jobId")',
      'CREATE INDEX IF NOT EXISTS "DistributionVariant_platform_idx" ON "DistributionVariant"("platform")',
      'CREATE INDEX IF NOT EXISTS "Article_published_idx" ON "Article"("published")',
      'CREATE INDEX IF NOT EXISTS "Article_publishedAt_idx" ON "Article"("publishedAt")',
      'CREATE INDEX IF NOT EXISTS "Article_category_idx" ON "Article"("category")',
      'CREATE INDEX IF NOT EXISTS "ArticleTranslation_articleId_idx" ON "ArticleTranslation"("articleId")',
      'CREATE INDEX IF NOT EXISTS "ArticleTranslation_lang_idx" ON "ArticleTranslation"("lang")',
      'CREATE INDEX IF NOT EXISTS "ArticleTranslation_slug_idx" ON "ArticleTranslation"("slug")',
    ];

    // Execute table creation
    for (const sql of tables) {
      const tableName = sql.match(/CREATE TABLE IF NOT EXISTS "(\w+)"/)?.[1];
      try {
        await client.execute(sql);
        console.log(`✅ Created table: ${tableName}`);
      } catch (error: any) {
        console.error(`❌ Failed to create table ${tableName}:`, error.message);
      }
    }

    console.log('\n📊 Creating indexes...\n');

    // Execute index creation
    for (const sql of indexes) {
      const indexName = sql.match(/CREATE INDEX IF NOT EXISTS "(\w+)"/)?.[1];
      try {
        await client.execute(sql);
        console.log(`✅ Created index: ${indexName}`);
      } catch (error: any) {
        console.error(`❌ Failed to create index ${indexName}:`, error.message);
      }
    }

    console.log('\n✅ Database schema pushed to Turso successfully!');
    console.log('🎉 The database is now in sync with your Prisma schema.\n');

  } catch (error: any) {
    console.error('❌ Error pushing schema to Turso:', error.message);
    process.exit(1);
  }
}

pushSchemaToTurso();
