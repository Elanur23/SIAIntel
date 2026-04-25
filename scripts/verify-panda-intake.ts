import { validatePandaPackage, PANDA_REQUIRED_LANGS } from '../lib/editorial/panda-intake-validator';
import { PANDA_FAIL_CLOSED_CODES, PANDA_SOURCE_SYSTEM } from '../lib/content/sia-panda-writing-protocol';

const createValidNode = (lang: string) => {
  const base = {
    headline: "Institutional Grade Intelligence Report V14",
    subheadline: "Deep Analysis of Global Market Liquidity and Sovereign Debt Risk",
    summary: "This report examines the convergence of AI compute power and traditional finance, analyzing direct correlations with USD performance in Q1 2026. Global equity markets showed strong performance across major indices.",
    body: "The convergence of artificial intelligence compute power and traditional financial systems is creating a new paradigm for institutional asset management. As liquidity flows increase toward sovereign-grade AI infrastructure, the correlation between compute capacity and USD performance has reached a three-year high. Our analysis of Q1 2026 data indicates a 14% increase in capital allocation toward specialized compute clusters in the GCC and North American regions. This shift represents a fundamental transformation in how global intelligence services model market risks and opportunity vectors.",
    keyInsights: [
      "Capital flows toward AI infrastructure increased 14% in Q1.",
      "Sovereign debt risks are highly correlated with compute capacity.",
      "Institutional adoption of neural analysis engines is accelerating."
    ],
    riskNote: "SIA SENTINEL: Intelligence report verified for informational purposes.",
    seoTitle: "AI Market Intelligence Q1 2026",
    seoDescription: "Professional analysis of AI infrastructure and capital flows for institutional investors and global analysts.",
    provenanceNotes: "Generated under SIA Protocol; pending Warroom validation."
  };

  if (lang === 'ru') {
    base.headline = "Отчет об искусственном интеллекте институционального уровня V14";
    base.subheadline = "Глубокий анализ ликвидности мирового рынка и суверенного долга";
    base.summary = "В этом отчете рассматривается конвергенция вычислительной мощности ИИ и традиционных финансов, анализируется прямая корреляция с показателями доллара США в первом квартале 2026 года.";
    base.body = "Конвергенция вычислительных мощностей искусственного интеллекта и традиционных финансовых систем создает новую парадигму для управления институциональными активами. По мере увеличения потоков ликвидности в сторону инфраструктуры ИИ суверенного уровня корреляция между вычислительными мощностями и показателями доллара США достигла трехлетнего максимума. Наш анализ данных за первый квартал 2026 года указывает на 14-процентное увеличение выделения капитала на специализированные вычислительные кластеры в регионах ССАГПЗ и Северной Америки. Этот сдвиг представляет собой фундаментальную трансформацию того, как глобальные разведывательные службы моделируют рыночные риски и векторы возможностей.";
    base.riskNote = "SIA SENTINEL: Разведывательный отчет проверен для информационных целей.";
    base.seoTitle = "Анализ рынка ИИ Q1 2026";
    base.seoDescription = "Профессиональный анализ инфраструктуры ИИ и потоков капитала в глобальном масштабе.";
    base.provenanceNotes = "Generated under SIA Protocol; pending Warroom validation.";
    base.keyInsights = [
        "Потоки капитала в инфраструктуру ИИ выросли на 14% в первом квартале.",
        "Риски суверенного долга сильно коррелируют с вычислительной мощностью.",
        "Институциональное внедрение механизмов нейронного анализа ускоряется."
    ];
  } else if (lang === 'ar') {
    base.headline = "تقرير استخباراتي عن الذكاء الاصطناعي من الدرجة المؤسسية V14";
    base.subheadline = "تحليل عميق لسيولة السوق العالمية ومخاطر الديون السيادية";
    base.summary = "يبحث هذا التقرير في التقارب بين قوة الحوسبة للذكاء الاصطناعي والتمويل التقليدي، ويحلل الارتباط المباشر مع أداء الدولار الأمريكي في الربع الأول من عام 2026.";
    base.body = "إن التقارب بين قوة الحوسبة للذكاء الاصطناعي والأنظمة المالية التقليدية يخلق نموذجاً جديداً لإدارة الأصول المؤسسية. مع زيادة تدفقات السيولة نحو البنية التحتية للذكاء الاصطناعي ذات السيادية، وصلت العلاقة بين قدرة الحوسبة وأداء الدولار الأمريكي إلى أعلى مستوى لها منذ ثلاث سنوات. يشير تحليلنا لبيانات الربع الأول من عام 2026 إلى زيادة بنسبة 14٪ في تخصيص رأس المال نحو مجموعات الحوسبة المتخصصة في مناطق مجلس التعاون الخليجي وأمريكا الشمالية. ويمثل هذا التحول تحولاً أساسياً في كيفية قيام خدمات الاستخبارات العالمية بنمذجة مخاطر السوق وموجهات الفرص.";
    base.riskNote = "SIA SENTINEL: تم التحقق من تقرير الاستخبارات لأغراض إعلامية.";
    base.seoTitle = "ذكاء سوق الذكاء الاصطناعي الربع الأول 2026";
    base.seoDescription = "تحليل احترافي للبنية التحتية للذكاء الاصطناعي وتدفقات رأس المال للمستثمرين.";
    base.provenanceNotes = "Generated under SIA Protocol; pending Warroom validation.";
    base.keyInsights = [
        "زادت تدفقات رأس المال نحو البنية التحتية للذكاء الاصطناعي بنسبة 14٪ في الربع الأول.",
        "تترابط مخاطر الديون السيادية بشكل كبير مع قدرة الحوسبة.",
        "يتسارع الاعتماد المؤسسي لمحركات التحليل عصبي."
    ];
  } else if (lang === 'jp') {
    base.headline = "機関投資家向けAIインテリジェンスレポート V14";
    base.subheadline = "グローバル市場の流動性とソブリン債務リスクの徹底的な分析レポート";
    base.summary = "本レポートでは、AI計算能力と伝統的な金融の融合を検証し、2026年第1四半期の米ドルパフォーマンスとの直接的な相関関係を分析します。これには、主要な経済指標と機関投資家の行動に関する詳細なデータが含まれています。";
    base.body = "人工知能の計算能力と伝統的な金融システムの融合は、機関投資家の資産管理に新たなパラダイムをもたらしています。ソブリン級のAIインフラへの流動性の流入が増加するにつれ、計算能力と米ドルのパフォーマンスの相関関係は3年ぶりの高水準に達しました。2026年第1四半期のデータ分析によると、GCCおよび北米地域の特殊な計算クラスターへの資本配分が14％増加したことが示されています。この変化は、グローバル・インテリジェンス・サービスが市場リスクと機会のベクトルをモデル化する方法における根本的な変革を表しています。さらに、ニューラル分析エンジンの機関への採用が加速しており、意思決定プロセスにおけるデータの密度が向上しています。";
    base.riskNote = "SIA SENTINEL: インテリジェンスレポートは情報提供の目的で確認されています。";
    base.seoTitle = "AI市場インテリジェンス 2026年第1四半期";
    base.seoDescription = "2026年第1四半期のAIインフラと資本フローに関する機関投資家レベルの専門的な分析レポートです。";
    base.provenanceNotes = "Generated under SIA Protocol; pending Warroom validation.";
    base.keyInsights = [
        "第1四半期のAIインフラへの資本流入は14％増加しました。",
        "ソブリン債務リスクは計算能力と高い相関関係があります。",
        "ニューラル分析エンジンの機関導入が加速しています。"
    ];
  } else if (lang === 'zh') {
    base.headline = "机构级人工智能情报报告 V14";
    base.subheadline = "全球市场流动性与主权债务风险深度分析与战略前景预测报告";
    base.summary = "本报告探讨了人工智能计算能力 with 传统金融的融合，分析了2026年第一季度与美元表现的直接相关性。该分析基于广泛的数据集，包括全球市场趋势和主要机构投资者的资本流向。";
    base.body = "人工智能计算能力 with 传统金融系统的融合正在为机构资产 management 创造新的范式。随着流动性流向主权级人工智能基础设施的增加，计算能力 with 美元表现之间的相关性已达到三年来的最高点。我们对2026年第一季度数据的分析表明，分配给海湾合作委员会和北美地区专用计算集群 summit 的资本增加了14％。这一转变代表了全球情报服务建模市场风险和机会向量方式的根本变革。此外，机构采用神经分析引擎的速度正在加快，从而提高了决策过程中的数据密度。这种趋势将在未来几年内继续重塑全球金融格局。";
    base.riskNote = "SIA SENTINEL: 情报报告已通过验证，仅供参考。";
    base.seoTitle = "2026年第一季度AI市场情报";
    base.seoDescription = "专业分析2026年第一季度全球人工智能基础设施和资本流动的机构级情报报告。";
    base.provenanceNotes = "Generated under SIA Protocol; pending Warroom validation.";
    base.keyInsights = [
        "第一季度流向人工智能基础设施的资金增加了14%。",
        "主权债务风险与计算能力高度相关。",
        "机构采用神经分析引擎的速度正在加快。"
    ];
  }

  return base;
};

const createValidPackage = (): any => {
  const languages: any = {};
  PANDA_REQUIRED_LANGS.forEach(lang => {
    languages[lang] = createValidNode(lang);
  });

  return {
    articleId: "INT-2026-04-A1",
    sourceSystem: PANDA_SOURCE_SYSTEM,
    createdAt: new Date().toISOString(),
    category: "MARKET",
    targetRegion: "GLOBAL",
    languageCompleteness: 9,
    provenanceStatus: "VERIFIED",
    languages
  };
};

async function test() {
  console.log("🧪 Verifying SIA-Panda Writing Protocol...\n");

  // 1. Valid Package
  console.log("Case 01: Valid 9-language PANDA_V1 package");
  const case01 = validatePandaPackage(createValidPackage());
  if (case01.ok) {
    console.log("  ✅ PASS");
  } else {
    console.error("  ❌ FAIL:", JSON.stringify(case01.errors, null, 2));
  }

  // 2. Missing Language (tr)
  console.log("\nCase 02: Missing 'tr' language key");
  const pkg02 = createValidPackage();
  delete pkg02.languages.tr;
  const case02 = validatePandaPackage(pkg02);
  if (!case02.ok && case02.errors.some(e => e.code === PANDA_FAIL_CLOSED_CODES.LANGUAGE_MISSING)) {
    console.log("  ✅ PASS (Correctly blocked)");
  } else {
    console.error("  ❌ FAIL: Should have been blocked for missing tr");
  }

  // 3. Missing Language (jp)
  console.log("\nCase 03: Missing 'jp' language key");
  const pkg03 = createValidPackage();
  delete pkg03.languages.jp;
  const case03 = validatePandaPackage(pkg03);
  if (!case03.ok && case03.errors.some(e => e.code === PANDA_FAIL_CLOSED_CODES.LANGUAGE_MISSING)) {
    console.log("  ✅ PASS (Correctly blocked)");
  } else {
    console.error("  ❌ FAIL: Should have been blocked for missing jp");
  }

  // 4. Unsupported Languages (it/pt)
  console.log("\nCase 04: Package using 'it' and 'pt' instead of tr/jp");
  const pkg04 = createValidPackage();
  pkg04.languages.it = pkg04.languages.tr;
  pkg04.languages.pt = pkg04.languages.jp;
  delete pkg04.languages.tr;
  delete pkg04.languages.jp;
  const case04 = validatePandaPackage(pkg04);
  if (!case04.ok && case04.errors.some(e => e.code === PANDA_FAIL_CLOSED_CODES.LANGUAGE_MISSING)) {
    console.log("  ✅ PASS (Correctly blocked unsupported langs)");
  } else {
    console.error("  ❌ FAIL: Should have blocked it/pt");
  }

  // 5. Wrong sourceSystem
  console.log("\nCase 05: sourceSystem 'Panda-9'");
  const pkg05 = createValidPackage();
  pkg05.sourceSystem = "Panda-9";
  const case05 = validatePandaPackage(pkg05);
  if (!case05.ok && case05.errors.some(e => e.code === PANDA_FAIL_CLOSED_CODES.MALFORMED_JSON)) {
    console.log("  ✅ PASS (Correctly blocked invalid sourceSystem)");
  } else {
    console.error("  ❌ FAIL: Should have been blocked for 'Panda-9'");
  }

  // 6. Editorial Residue 'Option 2'
  console.log("\nCase 06: Editorial Residue 'Option 2' in any language");
  const pkg06 = createValidPackage();
  pkg06.languages.es.body += " Option 2: Strategy Notes";
  const case06 = validatePandaPackage(pkg06);
  if (!case06.ok && case06.errors.some(e => e.lang === "es" && e.code === PANDA_FAIL_CLOSED_CODES.RESIDUE_DETECTED)) {
    console.log("  ✅ PASS (Correctly blocked 'Option 2')");
  } else {
    console.error("  ❌ FAIL: Should have blocked residue");
  }

  // 7. 'Great for Google News'
  console.log("\nCase 07: 'Great for Google News' residue");
  const pkg07 = createValidPackage();
  pkg07.languages.en.headline += " (Great for Google News)";
  const case07 = validatePandaPackage(pkg07);
  if (!case07.ok && case07.errors.some(e => e.code === PANDA_FAIL_CLOSED_CODES.RESIDUE_DETECTED)) {
    console.log("  ✅ PASS (Correctly blocked strategy residue)");
  } else {
    console.error("  ❌ FAIL: Should have blocked 'Great for Google News'");
  }

  // 8. 'Viral Potential'
  console.log("\nCase 08: 'Viral Potential' residue");
  const pkg08 = createValidPackage();
  pkg08.languages.fr.summary += " Viral Potential: High";
  const case08 = validatePandaPackage(pkg08);
  if (!case08.ok && case08.errors.some(e => e.code === PANDA_FAIL_CLOSED_CODES.RESIDUE_DETECTED)) {
    console.log("  ✅ PASS (Correctly blocked viral potential residue)");
  } else {
    console.error("  ❌ FAIL: Should have blocked 'Viral Potential'");
  }

  // 9. 'should be reviewed before publication'
  console.log("\nCase 09: 'should be reviewed before publication' residue");
  const pkg09 = createValidPackage();
  pkg09.languages.tr.riskNote += " This draft should be reviewed before publication.";
  const case09 = validatePandaPackage(pkg09);
  if (!case09.ok && case09.errors.some(e => e.code === PANDA_FAIL_CLOSED_CODES.RESIDUE_DETECTED)) {
    console.log("  ✅ PASS (Correctly blocked review notice residue)");
  } else {
    console.error("  ❌ FAIL: Should have blocked review notice");
  }

  // 10. 'multilingual parity verified'
  console.log("\nCase 10: 'multilingual parity verified' in provenance");
  const pkg10 = createValidPackage();
  pkg10.languages.en.provenanceNotes = "Status: multilingual parity verified.";
  const case10 = validatePandaPackage(pkg10);
  if (!case10.ok && case10.errors.some(e => e.code === PANDA_FAIL_CLOSED_CODES.FAKE_VERIFICATION)) {
    console.log("  ✅ PASS (Correctly blocked fake parity claim)");
  } else {
    console.error("  ❌ FAIL: Should have blocked fake parity claim");
  }

  // 11. Fake 'verified E-E-A-T'
  console.log("\nCase 11: Fake 'verified E-E-A-T' claim");
  const pkg11 = createValidPackage();
  pkg11.languages.en.body += " This report has fake verified E-E-A-T credentials.";
  const case11 = validatePandaPackage(pkg11);
  if (!case11.ok && case11.errors.some(e => e.code === PANDA_FAIL_CLOSED_CODES.RESIDUE_DETECTED)) {
    console.log("  ✅ PASS (Correctly blocked fake EEAT claim)");
  } else {
    console.error("  ❌ FAIL: Should have blocked fake EEAT claim");
  }

  // 12. Unsupported confidence score
  console.log("\nCase 12: Unsupported confidence score claim");
  const pkg12 = createValidPackage();
  pkg12.languages.de.body += " Global Confidence Score: 99.9%";
  const case12 = validatePandaPackage(pkg12);
  if (!case12.ok && case12.errors.some(e => e.code === PANDA_FAIL_CLOSED_CODES.UNSUPPORTED_SCORE)) {
    console.log("  ✅ PASS (Correctly blocked unsupported confidence claim)");
  } else {
    console.error("  ❌ FAIL: Should have blocked confidence claim");
  }

  // 13. Deterministic Financial Language
  console.log("\nCase 13: Deterministic language 'guaranteed returns'");
  const pkg13 = createValidPackage();
  pkg13.languages.en.summary += " This asset will provide guaranteed returns.";
  const case13 = validatePandaPackage(pkg13);
  if (!case13.ok && case13.errors.some(e => e.code === PANDA_FAIL_CLOSED_CODES.FAKE_VERIFICATION)) {
    console.log("  ✅ PASS (Correctly blocked deterministic language)");
  } else {
    console.error("  ❌ FAIL: Should have blocked deterministic language");
  }

  // 14. Valid cautious provenance wording
  console.log("\nCase 14: Valid cautious provenance wording passes");
  const pkg14 = createValidPackage();
  pkg14.languages.en.provenanceNotes = "Generated under SIA Protocol; pending Warroom validation.";
  const case14 = validatePandaPackage(pkg14);
  if (case14.ok) {
    console.log("  ✅ PASS");
  } else {
    console.error("  ❌ FAIL: Should have passed with valid wording. Errors:", case14.errors);
  }

  console.log("\n✨ Protocol verification complete!");
}

test().catch(console.error);
