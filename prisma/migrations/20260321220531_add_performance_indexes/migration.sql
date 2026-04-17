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
CREATE INDEX "AuditLog_action_timestamp_idx" ON "AuditLog"("action", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_userId_timestamp_idx" ON "AuditLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_success_timestamp_idx" ON "AuditLog"("success", "timestamp");

-- CreateIndex
CREATE INDEX "Comment_status_idx" ON "Comment"("status");

-- CreateIndex
CREATE INDEX "Comment_createdAt_idx" ON "Comment"("createdAt");

-- CreateIndex
CREATE INDEX "Comment_lang_idx" ON "Comment"("lang");

-- CreateIndex
CREATE INDEX "Comment_articleId_status_idx" ON "Comment"("articleId", "status");

-- CreateIndex
CREATE INDEX "RateLimit_key_resetTime_idx" ON "RateLimit"("key", "resetTime");

-- CreateIndex
CREATE INDEX "RecoveryCode_userId_used_idx" ON "RecoveryCode"("userId", "used");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "Session_twoFactorVerified_idx" ON "Session"("twoFactorVerified");

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
