import { prisma, updateArticle } from '@/lib/warroom/database'
import { buildArticleSeoPackage } from '@/lib/warroom/article-seo'
import { buildSocialMediaPackage } from '@/lib/warroom/social-media'
import { ARTICLE_LANGS, getArticleFieldKey, getAvailableArticleLanguages, getLocalizedArticleValue, type ArticleLanguage } from '@/lib/warroom/article-localization'
import { translatePlainText } from '@/lib/ai/translation-service'

type BackfillOptions = {
  limit?: number
  ids?: string[]
}

type BackfillResult = {
  scanned: number
  updated: number
  skipped: number
  errors: Array<{ id: string; error: string }>
}

const BACKFILL_LANGS = ARTICLE_LANGS.filter((lang) => lang !== 'en' && lang !== 'tr')

async function backfillArticleLanguage(article: Record<string, any>, sourceLang: ArticleLanguage, targetLang: ArticleLanguage) {
  const sourceTitle = getLocalizedArticleValue(article, 'title', sourceLang)
  const sourceSummary = getLocalizedArticleValue(article, 'summary', sourceLang)
  const sourceInsight = getLocalizedArticleValue(article, 'siaInsight', sourceLang)
  const sourceRisk = getLocalizedArticleValue(article, 'riskShield', sourceLang)
  const sourceContent = getLocalizedArticleValue(article, 'content', sourceLang)

  if (!sourceTitle || !sourceContent) {
    return null
  }

  const [title, summary, insight, risk, content] = await Promise.all([
    translatePlainText({ text: sourceTitle, targetLang, sourceLang }).then((res) => res.translatedText),
    sourceSummary ? translatePlainText({ text: sourceSummary, targetLang, sourceLang }).then((res) => res.translatedText) : Promise.resolve(''),
    sourceInsight ? translatePlainText({ text: sourceInsight, targetLang, sourceLang }).then((res) => res.translatedText) : Promise.resolve(''),
    sourceRisk ? translatePlainText({ text: sourceRisk, targetLang, sourceLang }).then((res) => res.translatedText) : Promise.resolve(''),
    translatePlainText({ text: sourceContent, targetLang, sourceLang }).then((res) => res.translatedText),
  ])

  return {
    [getArticleFieldKey('title', targetLang)]: title,
    [getArticleFieldKey('summary', targetLang)]: summary,
    [getArticleFieldKey('siaInsight', targetLang)]: insight,
    [getArticleFieldKey('riskShield', targetLang)]: risk,
    [getArticleFieldKey('content', targetLang)]: content,
  }
}

function buildVisualPayload(article: Record<string, any>) {
  const seo: Record<string, any> = { generatedAt: new Date().toISOString() }
  const social: Record<string, any> = { generatedAt: new Date().toISOString() }

  const availableLanguages = getAvailableArticleLanguages(article, ['title', 'content'])
  for (const lang of availableLanguages) {
    const title = getLocalizedArticleValue(article, 'title', lang)
    const content = getLocalizedArticleValue(article, 'content', lang)
    const summary = getLocalizedArticleValue(article, 'summary', lang)
    if (!title || !content) continue

    seo[lang] = buildArticleSeoPackage({
      id: article.id,
      lang,
      title,
      content,
      imageUrl: article.imageUrl || undefined,
      category: article.category || undefined,
      author: article.authorName || 'SIA Intelligence Unit',
      publishedAt: article.publishedAt.toISOString(),
    })

    if (summary) {
      social[lang] = buildSocialMediaPackage({
        language: lang,
        title,
        summary,
        url: seo[lang].url,
        category: article.category || undefined,
        region: article.region || undefined,
        impact: article.marketImpact || 5,
      })
    }
  }

  return { seo, social }
}

export async function backfillMultilingualArticles(options: BackfillOptions = {}): Promise<BackfillResult> {
  const limit = Math.max(1, Math.min(options.limit || 10, 50));
  const ids = options.ids && Array.isArray(options.ids) ? options.ids : undefined;

  // Cache: İşlenen makale ID'leri tutulur
  const processedIds = new Set<string>();

  let articles: any[] = [];
  if (ids && ids.length > 0) {
    articles = await prisma.warRoomArticle.findMany({ where: { id: { in: ids } } });
  } else {
    articles = await prisma.warRoomArticle.findMany({ orderBy: { publishedAt: 'desc' }, take: limit });
  }

  const result: BackfillResult = {
    scanned: articles.length,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (const article of articles) {
    if (processedIds.has(article.id)) {
      result.skipped += 1;
      continue;
    }
    processedIds.add(article.id);
    try {
      const sourceLang: ArticleLanguage | null = article.titleEn && article.contentEn ? 'en' : article.titleTr && article.contentTr ? 'tr' : null;
      if (!sourceLang) {
        result.skipped += 1;
        continue;
      }

      const updatePayload: Record<string, any> = {};
      for (const targetLang of BACKFILL_LANGS) {
        const hasTarget = Boolean(getLocalizedArticleValue(article, 'title', targetLang, [] as any)) && Boolean(getLocalizedArticleValue(article, 'content', targetLang, [] as any));
        if (hasTarget) continue;

        const translated = await backfillArticleLanguage(article as Record<string, any>, sourceLang, targetLang);
        if (translated) Object.assign(updatePayload, translated);
      }

      if (Object.keys(updatePayload).length === 0) {
        result.skipped += 1;
        continue;
      }

      const mergedArticle = { ...article, ...updatePayload };
      const visualPayload = buildVisualPayload(mergedArticle);

      for (const lang of ARTICLE_LANGS) {
        updatePayload[getArticleFieldKey('socialSnippet', lang)] = visualPayload.social[lang]?.heroSnippet;
      }
      updatePayload.visualData = JSON.stringify({
        ...(article.visualData ? JSON.parse(article.visualData) : {}),
        seo: visualPayload.seo,
        social: visualPayload.social,
      });

      await updateArticle(article.id, updatePayload);
      result.updated += 1;
    } catch (error: any) {
      result.errors.push({ id: article.id, error: error?.message || 'Unknown error' });
    }
  }

  return result;
}