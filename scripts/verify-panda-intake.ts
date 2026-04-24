import { validatePandaPackage, PANDA_REQUIRED_LANGS } from '../lib/editorial/panda-intake-validator';

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
    provenanceNotes: "Source: SEC, Bloomberg terminal, and official GCC regulatory filings."
  };

  if (lang === 'ru') {
    base.headline = "Отчет об искусственном интеллекте институционального уровня V14";
    base.subheadline = "Глубокий анализ ликвидности мирового рынка и суверенного долга";
    base.summary = "В этом отчете рассматривается конвергенция вычислительной мощности ИИ и традиционных финансов, анализируется прямая корреляция с показателями доллара США в первом квартале 2026 года.";
    base.body = "Конвергенция вычислительных мощностей искусственного интеллекта и традиционных финансовых систем создает новую парадигму для управления институциональными активами. По мере увеличения потоков ликвидности в сторону инфраструктуры ИИ суверенного уровня корреляция между вычислительными мощностями и показателями доллара США достигла трехлетнего максимума. Наш анализ данных за первый квартал 2026 года указывает на 14-процентное увеличение выделения капитала на специализированные вычислительные кластеры в регионах ССАГПЗ и Северной Америки. Этот сдвиг представляет собой фундаментальную трансформацию того, как глобальные разведывательные службы моделируют рыночные риски и векторы возможностей.";
    base.riskNote = "SIA SENTINEL: Разведывательный отчет проверен для информационных целей.";
    base.seoTitle = "Анализ рынка ИИ Q1 2026";
    base.seoDescription = "Профессиональный анализ инфраструктуры ИИ и потоков капитала в глобальном масштабе.";
    base.provenanceNotes = "Источник: SEC, терминал Bloomberg и официальные документы ССАГПЗ.";
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
    base.provenanceNotes = "المصدر: SEC، ومحطة Bloomberg، والملفات التنظيمية الرسمية لدول مجلس التعاون الخليجي.";
    base.keyInsights = [
        "زادت تدفقات رأس المال نحو البنية التحتية للذكاء الاصطناعي بنسبة 14٪ في الربع الأول.",
        "تترابط مخاطر الديون السيادية بشكل كبير مع قدرة الحوسبة.",
        "يتسارع الاعتماد المؤسسي لمحركات التحليل العصبي."
    ];
  } else if (lang === 'jp') {
    base.headline = "機関投資家向けAIインテリジェンスレポート V14";
    base.subheadline = "グローバル市場の流動性とソブリン債務リスクの徹底的な分析レポート";
    base.summary = "本レポートでは、AI計算能力と伝統的な金融の融合を検証し、2026年第1四半期の米ドルパフォーマンスとの直接的な相関関係を分析します。これには、主要な経済指標と機関投資家の行動に関する詳細なデータが含まれています。";
    base.body = "人工知能の計算能力と伝統的な金融システムの融合は、機関投資家の資産管理に新たなパラダイムをもたらしています。ソブリン級のAIインフラへの流動性の流入が増加するにつれ、計算能力と米ドルのパフォーマンスの相関関係は3年ぶりの高水準に達しました。2026年第1四半期のデータ分析によると、GCCおよび北米地域の特殊な計算クラスターへの資本配分が14％増加したことが示されています。この変化は、グローバル・インテリジェンス・サービスが市場リスクと機会のベクトルをモデル化する方法における根本的な変革を表しています。さらに、ニューラル分析エンジンの機関への採用が加速しており、意思決定プロセスにおけるデータの密度が向上しています。";
    base.riskNote = "SIA SENTINEL: インテリジェンスレポートは情報提供の目的で確認されています。";
    base.seoTitle = "AI市場インテリジェンス 2026年第1四半期";
    base.seoDescription = "2026年第1四半期のAIインフラと資本フローに関する機関投資家レベルの専門的な分析レポートです。";
    base.provenanceNotes = "出典：SEC、ブルームバーグ端末、およびGCC公式規制当局の提出書類。";
    base.keyInsights = [
        "第1四半期のAIインフラへの資本流入は14％増加しました。",
        "ソブリン債務リスクは計算能力と高い相関関係があります。",
        "ニューラル分析エンジンの機関導入が加速しています。"
    ];
  } else if (lang === 'zh') {
    base.headline = "机构级人工智能情报报告 V14";
    base.subheadline = "全球市场流动性与主权债务风险深度分析与战略前景预测报告";
    base.summary = "本报告探讨了人工智能计算能力与传统金融的融合，分析了2026年第一季度与美元表现的直接相关性。该分析基于广泛的数据集，包括全球市场趋势和主要机构投资者的资本流向。";
    base.body = "人工智能计算能力与传统金融系统的融合正在为机构资产 management 创造新的范式。随着流动性流向主权级人工智能基础设施的增加，计算能力与美元表现之间的相关性已达到三年来的最高点。我们对2026年第一季度数据的分析表明，分配给海湾合作委员会和北美地区专用计算集群 summit 的资本增加了14％。这一转变代表了全球情报服务建模市场风险和机会向量方式的根本变革。此外，机构采用神经分析引擎的速度正在加快，从而提高了决策过程中的数据密度。这种趋势将在未来几年内继续重塑全球金融格局。";
    base.riskNote = "SIA SENTINEL: 情报报告已通过验证，仅供参考。";
    base.seoTitle = "2026年第一季度AI市场情报";
    base.seoDescription = "专业分析2026年第一季度全球人工智能基础设施和资本流动的机构级情报报告。";
    base.provenanceNotes = "来源：美国证券交易委员会、彭博终端和海湾合作委员会官方监管文件。";
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
    sourceSystem: "PANDA_V1",
    createdAt: new Date().toISOString(),
    category: "MARKET",
    targetRegion: "GLOBAL",
    languageCompleteness: 9,
    provenanceStatus: "VERIFIED",
    languages
  };
};

async function test() {
  console.log("🧪 Verifying Panda Intake Validator...\n");

  // 1. Valid Package
  console.log("Case 01: Valid 9-language package");
  const case01 = validatePandaPackage(createValidPackage());
  if (case01.ok) {
    console.log("  ✅ PASS");
  } else {
    console.error("  ❌ FAIL:", JSON.stringify(case01.errors, null, 2));
  }

  // 2. Missing Language
  console.log("\nCase 02: Missing 'zh' language key");
  const pkg02 = createValidPackage();
  delete pkg02.languages.zh;
  const case02 = validatePandaPackage(pkg02);
  if (!case02.ok && case02.errors.some(e => e.code === "LANGUAGE_COMPLETENESS_FAILURE")) {
    console.log("  ✅ PASS (Correctly blocked)");
  } else {
    console.error("  ❌ FAIL: Should have been blocked for missing lang. Errors:", case02.errors);
  }

  // 3. Wrong sourceSystem
  console.log("\nCase 03: Wrong sourceSystem");
  const pkg03 = createValidPackage();
  pkg03.sourceSystem = "INVALID_SYS";
  const case03 = validatePandaPackage(pkg03);
  if (!case03.ok && case03.errors.some(e => e.code === "SCHEMA_VALIDATION_FAILURE")) {
    console.log("  ✅ PASS (Correctly blocked)");
  } else {
    console.error("  ❌ FAIL: Should have been blocked for invalid sourceSystem");
  }

  // 4. Editorial Residue
  console.log("\nCase 04: Editorial Residue 'Option 2' in de node");
  const pkg04 = createValidPackage();
  pkg04.languages.de.body += " Option 2: The Alternative Angle";
  const case04 = validatePandaPackage(pkg04);
  if (!case04.ok && case04.errors.some(e => e.lang === "de" && e.code === "RESIDUE_DETECTED")) {
    console.log("  ✅ PASS (Correctly blocked residue)");
  } else {
    console.error("  ❌ FAIL: Should have blocked 'Option 2'");
  }

  // 5. Language Leakage
  console.log("\nCase 05: English leakage in RU node");
  const pkg05 = createValidPackage();
  pkg05.languages.ru.body = "This is a full English body inside a Russian node which should trigger leakage detection. It contains institutional grade analysis of global market liquidity and sovereign debt risk, but written in the wrong language for this specific node. This content is high quality but fails the governance gate due to script mismatch. We must ensure that Russian content is actually written in Cyrillic to prevent accidental English leaks into non-English language sections of the terminal.";
  const case05 = validatePandaPackage(pkg05);
  if (!case05.ok && case05.errors.some(e => e.lang === "ru" && e.code === "LANGUAGE_MISMATCH")) {
    console.log("  ✅ PASS (Correctly detected English leakage in RU)");
  } else {
    console.error("  ❌ FAIL: Should have detected leakage. Errors:", case05.errors);
  }

  // 6. Provenance Failure
  console.log("\nCase 06: VERIFIED status but missing provenanceNotes");
  const pkg06 = createValidPackage();
  pkg06.languages.tr.provenanceNotes = "";
  const case06 = validatePandaPackage(pkg06);
  if (!case06.ok && case06.errors.some(e => e.lang === "tr" && e.code === "PROVENANCE_FAILURE")) {
    console.log("  ✅ PASS (Correctly blocked empty provenance)");
  } else {
    console.error("  ❌ FAIL: Should have blocked empty provenance");
  }

  // 7. Malformed Markdown
  console.log("\nCase 07: Malformed markdown '## ##'");
  const pkg07 = createValidPackage();
  pkg07.languages.en.headline = "## ## Broken Heading";
  const case07 = validatePandaPackage(pkg07);
  if (!case07.ok && case07.errors.some(e => e.code === "FOOTER_INTEGRITY_FAILURE")) {
    console.log("  ✅ PASS (Correctly blocked malformed markdown)");
  } else {
    console.error("  ❌ FAIL: Should have blocked malformed markdown");
  }

  console.log("\n✨ Panda intake verification complete!");
}

test().catch(console.error);
