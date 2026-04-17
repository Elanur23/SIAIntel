// @ts-nocheck - TODO: Fix implicit any types (Phase 4C - deferred to strict mode phase)
import { NextRequest, NextResponse } from 'next/server';
import { translateStructuredArticle, translatePlainText } from '@/lib/ai/translation-service';
import { readWorkspace, writeWorkspace, countWordsWs } from '@/lib/ai/workspace-io';
import { requirePermission } from '@/lib/rbac/rbac-helpers';
import { extractClientIP } from '@/lib/security/client-ip-extractor';

// Legacy imports removed — use workspace-io helpers instead

/**
 * SIA MULTI-LANG SEMANTIC SEO ENGINE v2
 * Category-aware keyword audit: each article category has 8 relevant golden keywords.
 * Covers: AI, ECONOMY, CRYPTO, STOCKS, and a UNIVERSAL fallback set.
 */
type LangMap = Record<string, string[]>
type KeywordEntry = { key: string; langs: LangMap }

const CATEGORY_KEYWORDS: Record<string, KeywordEntry[]> = {
  AI: [
    { key: 'ARTIFICIAL INTELLIGENCE', langs: { en:['artificial intelligence','ai agent'], tr:['yapay zeka','ai ajanı'], de:['künstliche intelligenz','ki'], fr:['intelligence artificielle','ia'], es:['inteligencia artificial'], ru:['искусственный интеллект','ии'], ar:['الذكاء الاصطناعي'], jp:['人工知能','ai'], zh:['人工智能','ai'] } },
    { key: 'AUTONOMOUS',              langs: { en:['autonomous','self-sovereign'], tr:['otonom','özerk'], de:['autonom'], fr:['autonome'], es:['autónomo'], ru:['автономный'], ar:['مستقل','ذاتي'], jp:['自律','自主'], zh:['自主','自律'] } },
    { key: 'BLOCKCHAIN',              langs: { en:['blockchain'], tr:['blockchain','blok zinciri'], de:['blockchain'], fr:['blockchain'], es:['blockchain'], ru:['блокчейн'], ar:['بلوكشين','سلسلة الكتل'], jp:['ブロックチェーン'], zh:['区块链'] } },
    { key: 'DIGITAL ECONOMY',         langs: { en:['digital economy','agent economy'], tr:['dijital ekonomi','ajan ekonomi'], de:['digitalwirtschaft','digitale wirtschaft'], fr:['économie numérique'], es:['economía digital'], ru:['цифровая экономика'], ar:['الاقتصاد الرقمي'], jp:['デジタル経済'], zh:['数字经济','数字货币'] } },
    { key: 'CRYPTOCURRENCY',          langs: { en:['cryptocurrency','crypto','digital wallet'], tr:['kripto para','dijital cüzdan'], de:['kryptowährung'], fr:['cryptomonnaie'], es:['criptomoneda'], ru:['криптовалюта'], ar:['عملة مشفرة','عملة رقمية'], jp:['仮想通貨','暗号通貨'], zh:['加密货币','数字钱包'] } },
    { key: 'REGULATION',              langs: { en:['regulation','oversight','legal framework'], tr:['düzenleme','denetim'], de:['regulierung'], fr:['régulation','réglementation'], es:['regulación'], ru:['регулирование','надзор'], ar:['تنظيم','الرقابة'], jp:['規制'], zh:['监管','法规'] } },
    { key: 'MACHINE LEARNING',        langs: { en:['machine learning','machine-to-machine','llm'], tr:['makine öğrenmesi','makineden makineye'], de:['maschinelles lernen'], fr:['apprentissage automatique'], es:['aprendizaje automático'], ru:['машинное обучение'], ar:['تعلم الآلة'], jp:['機械学習'], zh:['机器学习'] } },
    { key: 'TRILLION',                langs: { en:['trillion','billion'], tr:['trilyon','milyar'], de:['billion','trilliarde'], fr:['trillion','milliard'], es:['trillón','billones'], ru:['триллион','миллиард'], ar:['تريليون','مليار'], jp:['兆','十億'], zh:['万亿','数万亿'] } },
  ],
  ECONOMY: [
    { key: 'LIQUIDITY',    langs: { en:['liquidity','capital flow'], tr:['likidite','sermaye akışı'], de:['liquidität'], fr:['liquidité'], es:['liquidez'], ru:['ликвидность'], ar:['سيولة'], jp:['流動性'], zh:['流动性'] } },
    { key: 'CENTRAL BANK', langs: { en:['central bank','fed','federal reserve'], tr:['merkez bankası'], de:['zentralbank'], fr:['banque centrale'], es:['banco central'], ru:['центральный банк'], ar:['البنك المركزي'], jp:['中央銀行'], zh:['中央银行'] } },
    { key: 'DOLLAR',       langs: { en:['dollar','usd'], tr:['dolar','usd'], de:['dollar'], fr:['dollar'], es:['dólar'], ru:['доллар'], ar:['دولار'], jp:['ドル'], zh:['美元'] } },
    { key: 'INFLATION',    langs: { en:['inflation','cpi'], tr:['enflasyon'], de:['inflation'], fr:['inflation'], es:['inflación'], ru:['инфляция'], ar:['التضخم'], jp:['インフレ'], zh:['通货膨胀'] } },
    { key: 'MBRIDGE',      langs: { en:['mbridge'], tr:['mbridge'], de:['mbridge'], fr:['mbridge'], es:['mbridge'], ru:['mbridge'], ar:['mbridge'], jp:['mbridge'], zh:['mbridge'] } },
    { key: 'SWIFT',        langs: { en:['swift'], tr:['swift'], de:['swift'], fr:['swift'], es:['swift'], ru:['swift'], ar:['سويفت'], jp:['swift'], zh:['swift'] } },
    { key: 'INSTITUTIONAL',langs: { en:['institutional','sovereign fund'], tr:['kurumsal'], de:['institutionell'], fr:['institutionnel'], es:['institucional'], ru:['институциональный'], ar:['مؤسسي'], jp:['機関投資家'], zh:['机构'] } },
    { key: 'GDP',          langs: { en:['gdp','growth'], tr:['gsyih','büyüme'], de:['bip','wachstum'], fr:['pib','croissance'], es:['pib','crecimiento'], ru:['ввп','рост'], ar:['الناتج المحلي'], jp:['gdp','経済成長'], zh:['gdp','经济增长'] } },
  ],
  CRYPTO: [
    { key: 'BITCOIN',       langs: { en:['bitcoin','btc'], tr:['bitcoin','btc'], de:['bitcoin'], fr:['bitcoin'], es:['bitcoin'], ru:['биткоин','btc'], ar:['بيتكوين'], jp:['ビットコイン'], zh:['比特币'] } },
    { key: 'ETHEREUM',      langs: { en:['ethereum','eth'], tr:['ethereum','eth'], de:['ethereum'], fr:['ethereum'], es:['ethereum'], ru:['эфириум'], ar:['إيثريوم'], jp:['イーサリアム'], zh:['以太坊'] } },
    { key: 'DEFI',          langs: { en:['defi','decentralized finance'], tr:['defi','merkeziyetsiz finans'], de:['defi'], fr:['defi','finance décentralisée'], es:['defi','finanzas descentralizadas'], ru:['defi','децентрализованные финансы'], ar:['التمويل اللامركزي'], jp:['defi','分散型金融'], zh:['defi','去中心化金融'] } },
    { key: 'BLOCKCHAIN',    langs: { en:['blockchain'], tr:['blockchain'], de:['blockchain'], fr:['blockchain'], es:['blockchain'], ru:['блокчейн'], ar:['بلوكشين'], jp:['ブロックチェーン'], zh:['区块链'] } },
    { key: 'WALLET',        langs: { en:['wallet','cold storage'], tr:['cüzdan'], de:['wallet','geldbörse'], fr:['portefeuille'], es:['cartera'], ru:['кошелёк'], ar:['محفظة'], jp:['ウォレット'], zh:['钱包'] } },
    { key: 'LIQUIDITY',     langs: { en:['liquidity'], tr:['likidite'], de:['liquidität'], fr:['liquidité'], es:['liquidez'], ru:['ликвидность'], ar:['سيولة'], jp:['流動性'], zh:['流动性'] } },
    { key: 'RSI',           langs: { en:['rsi'], tr:['rsi'], de:['rsi'], fr:['rsi'], es:['rsi'], ru:['rsi'], ar:['rsi'], jp:['rsi'], zh:['rsi'] } },
    { key: 'REGULATION',    langs: { en:['regulation','sec','compliance'], tr:['düzenleme','mevzuat'], de:['regulierung'], fr:['régulation'], es:['regulación'], ru:['регулирование'], ar:['تنظيم'], jp:['規制'], zh:['监管'] } },
  ],
  STOCKS: [
    { key: 'NASDAQ',        langs: { en:['nasdaq'], tr:['nasdaq'], de:['nasdaq'], fr:['nasdaq'], es:['nasdaq'], ru:['nasdaq'], ar:['ناسداك'], jp:['ナスダック'], zh:['纳斯达克'] } },
    { key: 'S&P 500',       langs: { en:['s&p','s&p 500','sp500'], tr:['sp500'], de:['s&p'], fr:['s&p'], es:['s&p'], ru:['s&p'], ar:['ستاندرد آند بورز'], jp:['s&p'], zh:['标普'] } },
    { key: 'EARNINGS',      langs: { en:['earnings','revenue','profit'], tr:['kazanç','gelir'], de:['gewinn','umsatz'], fr:['bénéfices','revenus'], es:['ganancias'], ru:['прибыль','выручка'], ar:['أرباح'], jp:['収益','利益'], zh:['收益','利润'] } },
    { key: 'INSTITUTIONAL', langs: { en:['institutional','hedge fund'], tr:['kurumsal'], de:['institutionell'], fr:['institutionnel'], es:['institucional'], ru:['институциональный'], ar:['مؤسسي'], jp:['機関投資家'], zh:['机构'] } },
    { key: 'FEDERAL RESERVE',langs: { en:['federal reserve','fed','interest rate'], tr:['fed','faiz'], de:['fed','zinsen'], fr:['fed','taux'], es:['fed','tasas'], ru:['фрс','ставка'], ar:['الاحتياطي الفيدرالي'], jp:['FRB','金利'], zh:['美联储','利率'] } },
    { key: 'RSI',           langs: { en:['rsi'], tr:['rsi'], de:['rsi'], fr:['rsi'], es:['rsi'], ru:['rsi'], ar:['rsi'], jp:['rsi'], zh:['rsi'] } },
    { key: 'MACD',          langs: { en:['macd'], tr:['macd'], de:['macd'], fr:['macd'], es:['macd'], ru:['macd'], ar:['macd'], jp:['macd'], zh:['macd'] } },
    { key: 'MARKET CAP',    langs: { en:['market cap','valuation'], tr:['piyasa değeri'], de:['marktkapitalisierung'], fr:['capitalisation boursière'], es:['capitalización bursátil'], ru:['рыночная капитализация'], ar:['القيمة السوقية'], jp:['時価総額'], zh:['市值'] } },
  ],
}

// Universal fallback for uncategorized articles
CATEGORY_KEYWORDS['MARKET']  = CATEGORY_KEYWORDS['ECONOMY']
CATEGORY_KEYWORDS['MACRO']   = CATEGORY_KEYWORDS['ECONOMY']
CATEGORY_KEYWORDS['COMMODITIES'] = CATEGORY_KEYWORDS['ECONOMY']
CATEGORY_KEYWORDS['EMERGING_MARKETS'] = CATEGORY_KEYWORDS['ECONOMY']

function getKeywordsForCategory(category: string): KeywordEntry[] {
  const cat = (category || 'ECONOMY').toUpperCase()
  return CATEGORY_KEYWORDS[cat] || CATEGORY_KEYWORDS['ECONOMY']
}

/**
 * GET /api/admin/normalize-workspace
 * Get workspace normalization status
 * Permission: view_content
 */
export async function GET(request: NextRequest) {
  try {
    // Require permission
    const sessionToken = request.cookies.get('sia_admin_session')?.value
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const ipResult = extractClientIP(request.headers)
    await requirePermission(sessionToken, 'view_content', {
      ipAddress: ipResult.normalized,
      userAgent: request.headers.get('user-agent') || 'unknown',
      route: '/api/admin/normalize-workspace',
    })

    const ws = await readWorkspace(); // BOM-safe, 9-lang guaranteed

    const category = (ws as any).category || 'ECONOMY'
    const keywords = getKeywordsForCategory(category)

    const stats = ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh'].map(lang => {
      const node = ws[lang as keyof typeof ws] as any;
      const content = (node?.content || node?.text || '').toLowerCase();
      const wordCount = countWordsWs(content);
      const enWordCount = countWordsWs(ws.en?.content || '');

      // Category-aware semantic SEO audit
      let keywordsFound = 0;
      keywords.forEach(({ langs }) => {
        const variants = langs[lang] || langs['en'] || []
        const found = variants.some(v => content.includes(v.toLowerCase()));
        if (found) keywordsFound++;
      });

      return {
        lang,
        wordCount,
        pct: enWordCount > 0 ? Math.round((wordCount / enWordCount) * 100) : 0,
        seoKeywordsFound: keywordsFound,
        seoKeywordsTotal: keywords.length,
      };
    });

    return NextResponse.json({
      success: true,
      stats,
      category,
      seoKeywords: keywords.map(k => k.key),
    });
  } catch (error: any) {
    if (error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error.name === 'ForbiddenError') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ success: false, error: error.message });
  }
}

/**
 * POST /api/admin/normalize-workspace
 * Normalize workspace translations
 * Permission: manage_integrations
 */
export async function POST(request: NextRequest) {
  try {
    // Require permission
    const sessionToken = request.cookies.get('sia_admin_session')?.value
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const ipResult = extractClientIP(request.headers)
    await requirePermission(sessionToken, 'manage_integrations', {
      ipAddress: ipResult.normalized,
      userAgent: request.headers.get('user-agent') || 'unknown',
      route: '/api/admin/normalize-workspace',
    })

    const url = new URL(request.url);
    const forceMode = url.searchParams.get('force') === 'true';

    const ws = await readWorkspace(); // BOM-safe, 9-lang guaranteed

    const masterLang = ws.en ? 'en' : ws.tr ? 'tr' : null;
    const masterNode = ws[masterLang!];
    if (!masterNode || !masterLang) throw new Error('No master node (en/tr) found in ai_workspace.json');

    const TRANSLATE_LANGS = ['tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh'].filter(l => l !== masterLang);
    const results: string[] = [];
    let normalizedCount = 0;

    const enWordCount = countWordsWs(masterNode.content || '');

    for (const lang of TRANSLATE_LANGS) {
      const existing = ws[lang as keyof typeof ws] as any;
      const existingWords = countWordsWs(existing?.content || '');
      const threshold = Math.max(100, Math.round(enWordCount * 0.85));

      if (!forceMode && existing && existingWords >= threshold) {
        results.push(`${lang}: SKIPPED (${existingWords}W >= ${threshold}W threshold)`);
        continue;
      }

      if (forceMode) {
        console.log(`[NORMALIZE FORCE] Re-translating ${masterLang} → ${lang} (was ${existingWords}W)…`);
      }

      console.log(`[NORMALIZE] Translating ${masterLang} → ${lang}…`);
      try {
        const [contentResult, titleResult, summaryResult, insightResult, riskResult] = await Promise.all([
          translateStructuredArticle({ text: masterNode.content, targetLang: lang, sourceLang: masterLang }),
          translatePlainText({ text: masterNode.title || '', targetLang: lang, sourceLang: masterLang }),
          masterNode.summary ? translatePlainText({ text: masterNode.summary, targetLang: lang, sourceLang: masterLang }) : Promise.resolve({ translatedText: '' }),
          masterNode.insight ? translatePlainText({ text: masterNode.insight, targetLang: lang, sourceLang: masterLang }) : Promise.resolve({ translatedText: '' }),
          masterNode.risk ? translatePlainText({ text: masterNode.risk, targetLang: lang, sourceLang: masterLang }) : Promise.resolve({ translatedText: '' }),
        ]);

        ws[lang] = {
          title: titleResult.translatedText || contentResult.title || masterNode.title,
          summary: summaryResult.translatedText || masterNode.summary,
          content: contentResult.translatedText,
          insight: insightResult.translatedText || masterNode.insight,
          risk: riskResult.translatedText || masterNode.risk,
        };

        normalizedCount++;
        results.push(`${lang}: ${countWordsWs(contentResult.translatedText)} words (${contentResult.systemLog})`);
      } catch (err: any) {
        console.error(`[NORMALIZE] Translation failed for ${lang}:`, err.message);
        results.push(`${lang}: FAILED — ${err.message}`);
      }
    }

    // Always include master lang unchanged
    if (!ws[masterLang as keyof typeof ws]) (ws as any)[masterLang] = masterNode;

    await writeWorkspace(ws); // BOM-safe write

    return NextResponse.json({
      success: true,
      message: `${normalizedCount} language nodes translated via Gemini 1.5 Pro / Groq.${forceMode ? ' [FORCE MODE]' : ''}`,
      details: results,
      forceMode,
    });
  } catch (error: any) {
    if (error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error.name === 'ForbiddenError') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
