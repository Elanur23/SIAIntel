-- CreateTable
CREATE TABLE "WarRoomArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "authorName" TEXT NOT NULL DEFAULT 'Anonymous Analyst',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "lang" TEXT NOT NULL DEFAULT 'en',
    "articleId" TEXT NOT NULL,
    CONSTRAINT "Comment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "WarRoomArticle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DistributionJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
);

-- CreateTable
CREATE TABLE "DistributionVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "DistributionVariant_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "DistributionJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GlossaryTerm" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "alternatives" TEXT
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "twoFactorEnabledAt" DATETIME,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "passwordChangedAt" DATETIME
);

-- CreateTable
CREATE TABLE "BackupCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BackupCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hashedToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "lastAccessedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "twoFactorVerified" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "resetTime" DATETIME NOT NULL,
    "firstAttempt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "metadata" TEXT
);

-- CreateTable
CREATE TABLE "RecoveryCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" DATETIME,
    "invalidatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PasswordHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BlockedIP" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ip" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "blockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "blockedBy" TEXT
);

-- CreateTable
CREATE TABLE "IdempotencyKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "result" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    CONSTRAINT "IdempotencyKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imageUrl" TEXT,
    "authorId" TEXT,
    "impact" INTEGER,
    "confidence" REAL,
    "signal" TEXT,
    "volatility" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ArticleTranslation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ArticleTranslation_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WarRoomArticle_status_idx" ON "WarRoomArticle"("status");

-- CreateIndex
CREATE INDEX "WarRoomArticle_publishedAt_idx" ON "WarRoomArticle"("publishedAt");

-- CreateIndex
CREATE INDEX "WarRoomArticle_category_idx" ON "WarRoomArticle"("category");

-- CreateIndex
CREATE INDEX "WarRoomArticle_region_idx" ON "WarRoomArticle"("region");

-- CreateIndex
CREATE INDEX "WarRoomArticle_createdAt_idx" ON "WarRoomArticle"("createdAt");

-- CreateIndex
CREATE INDEX "WarRoomArticle_updatedAt_idx" ON "WarRoomArticle"("updatedAt");

-- CreateIndex
CREATE INDEX "WarRoomArticle_sourceId_idx" ON "WarRoomArticle"("sourceId");

-- CreateIndex
CREATE INDEX "WarRoomArticle_status_publishedAt_idx" ON "WarRoomArticle"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "WarRoomArticle_category_publishedAt_idx" ON "WarRoomArticle"("category", "publishedAt");

-- CreateIndex
CREATE INDEX "Comment_articleId_idx" ON "Comment"("articleId");

-- CreateIndex
CREATE INDEX "Comment_status_idx" ON "Comment"("status");

-- CreateIndex
CREATE INDEX "Comment_createdAt_idx" ON "Comment"("createdAt");

-- CreateIndex
CREATE INDEX "Comment_lang_idx" ON "Comment"("lang");

-- CreateIndex
CREATE INDEX "Comment_articleId_status_idx" ON "Comment"("articleId", "status");

-- CreateIndex
CREATE INDEX "DistributionJob_articleId_idx" ON "DistributionJob"("articleId");

-- CreateIndex
CREATE INDEX "DistributionJob_status_idx" ON "DistributionJob"("status");

-- CreateIndex
CREATE INDEX "DistributionVariant_jobId_idx" ON "DistributionVariant"("jobId");

-- CreateIndex
CREATE INDEX "DistributionVariant_platform_idx" ON "DistributionVariant"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "GlossaryTerm_term_category_key" ON "GlossaryTerm"("term", "category");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_enabled_idx" ON "User"("enabled");

-- CreateIndex
CREATE INDEX "BackupCode_userId_idx" ON "BackupCode"("userId");

-- CreateIndex
CREATE INDEX "BackupCode_used_idx" ON "BackupCode"("used");

-- CreateIndex
CREATE UNIQUE INDEX "Session_hashedToken_key" ON "Session"("hashedToken");

-- CreateIndex
CREATE INDEX "Session_hashedToken_idx" ON "Session"("hashedToken");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "Session_twoFactorVerified_idx" ON "Session"("twoFactorVerified");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_key_key" ON "RateLimit"("key");

-- CreateIndex
CREATE INDEX "RateLimit_key_idx" ON "RateLimit"("key");

-- CreateIndex
CREATE INDEX "RateLimit_resetTime_idx" ON "RateLimit"("resetTime");

-- CreateIndex
CREATE INDEX "RateLimit_key_resetTime_idx" ON "RateLimit"("key", "resetTime");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_success_idx" ON "AuditLog"("success");

-- CreateIndex
CREATE INDEX "AuditLog_action_timestamp_idx" ON "AuditLog"("action", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_userId_timestamp_idx" ON "AuditLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_success_timestamp_idx" ON "AuditLog"("success", "timestamp");

-- CreateIndex
CREATE INDEX "RecoveryCode_userId_idx" ON "RecoveryCode"("userId");

-- CreateIndex
CREATE INDEX "RecoveryCode_used_idx" ON "RecoveryCode"("used");

-- CreateIndex
CREATE INDEX "RecoveryCode_userId_used_idx" ON "RecoveryCode"("userId", "used");

-- CreateIndex
CREATE INDEX "RecoveryCode_invalidatedAt_idx" ON "RecoveryCode"("invalidatedAt");

-- CreateIndex
CREATE INDEX "PasswordHistory_userId_idx" ON "PasswordHistory"("userId");

-- CreateIndex
CREATE INDEX "PasswordHistory_changedAt_idx" ON "PasswordHistory"("changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedIP_ip_key" ON "BlockedIP"("ip");

-- CreateIndex
CREATE INDEX "BlockedIP_ip_idx" ON "BlockedIP"("ip");

-- CreateIndex
CREATE INDEX "BlockedIP_expiresAt_idx" ON "BlockedIP"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyKey_key_key" ON "IdempotencyKey"("key");

-- CreateIndex
CREATE INDEX "IdempotencyKey_key_idx" ON "IdempotencyKey"("key");

-- CreateIndex
CREATE INDEX "IdempotencyKey_userId_idx" ON "IdempotencyKey"("userId");

-- CreateIndex
CREATE INDEX "IdempotencyKey_expiresAt_idx" ON "IdempotencyKey"("expiresAt");

-- CreateIndex
CREATE INDEX "IdempotencyKey_completed_idx" ON "IdempotencyKey"("completed");

-- CreateIndex
CREATE INDEX "Article_category_publishedAt_idx" ON "Article"("category", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_featured_publishedAt_idx" ON "Article"("featured", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_published_publishedAt_idx" ON "Article"("published", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_category_published_publishedAt_idx" ON "Article"("category", "published", "publishedAt");

-- CreateIndex
CREATE INDEX "ArticleTranslation_lang_articleId_idx" ON "ArticleTranslation"("lang", "articleId");

-- CreateIndex
CREATE INDEX "ArticleTranslation_slug_lang_idx" ON "ArticleTranslation"("slug", "lang");

-- CreateIndex
CREATE INDEX "ArticleTranslation_lang_idx" ON "ArticleTranslation"("lang");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleTranslation_articleId_lang_key" ON "ArticleTranslation"("articleId", "lang");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleTranslation_slug_lang_key" ON "ArticleTranslation"("slug", "lang");

