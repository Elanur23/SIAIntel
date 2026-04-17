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
