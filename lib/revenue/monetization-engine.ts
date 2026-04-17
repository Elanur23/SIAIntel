/**
 * SIA MONETIZATION LAYER V1
 * Mission: Attach revenue logic to content system.
 *
 * Features:
 * 1. Soft CTA System (Subtle, non-salesy)
 * 2. Authority Reinforcement
 * 3. Conversion Intent Tagging
 * 4. Multi-language (9 Nodes) support
 */

import { Language } from '../dispatcher/types';

export type ConversionIntent = 'LOW' | 'MEDIUM' | 'HIGH';

export interface MonetizationMetadata {
  cta: string;
  positioning: string;
  intent: ConversionIntent;
  exclusivity_score: number; // 0-100
  last_updated: string;
}

export interface MonetizationNode {
  language: Language;
  cta: string;
  authority_line: string;
}

/**
 * MONETIZATION_LAYER_V1 Engine
 */
export class MonetizationEngine {
  private static instance: MonetizationEngine;

  private constructor() {}

  public static getInstance(): MonetizationEngine {
    if (!MonetizationEngine.instance) {
      MonetizationEngine.instance = new MonetizationEngine();
    }
    return MonetizationEngine.instance;
  }

  /**
   * SECTION 1 — SOFT CTA SYSTEM & SECTION 2 — POSITIONING
   * Generates localized monetization strings for a specific language
   */
  public generateMonetizationNode(language: Language, category: string): MonetizationNode {
    const ctas: Record<Language, string[]> = {
      en: ["Stay ahead of structural shifts. Follow for deep intelligence.", "Institutional-grade insights delivered daily. Join the network.", "Decode the global macro landscape. Secure your information advantage."],
      tr: ["Yapısal değişimlerin önünde kalın. Derin istihbarat için takip edin.", "Kurumsal düzeyde analizler günlük olarak iletilir. Ağa katılın.", "Küresel makro manzarayı çözün. Bilgi avantajınızı koruyun."],
      de: ["Bleiben Sie strukturellen Veränderungen einen Schritt voraus. Folgen Sie für tiefe Einblicke.", "Täglich Analysen auf institutionellem Niveau. Treten Sie dem Netzwerk bei.", "Entschlüsseln Sie die globale Makrolandschaft. Sichern Sie sich Ihren Informationsvorteil."],
      fr: ["Gardez une longueur d'avance sur les changements structurels. Suivez pour une intelligence profonde.", "Analyses de niveau institutionnel livrées quotidiennement. Rejoignez le réseau.", "Décryptez le paysage macro global. Sécurisez votre avantage informationnel."],
      es: ["Anticípese a los cambios estructurales. Síganos para obtener inteligencia profunda.", "Análisis de nivel institucional entregados diariamente. Únase a la red.", "Descodifique el panorama macro global. Asegure su ventaja informativa."],
      ru: ["Будьте на шаг впереди структурных изменений. Подписывайтесь для глубокой аналитики.", "Аналитика институционального уровня ежедневно. Присоединяйтесь к сети.", "Расшифруйте глобальный макроэкономический ландшафт. Обеспечьте свое информационное преимущество."],
      ar: ["كن سباقاً في مواجهة التحولات الهيكلية. تابعنا للحصول على استخبارات عميقة.", "تحليلات على مستوى المؤسسات تُقدم يومياً. انضم إلى الشبكة.", "فك شفرة المشهد الماكرو العالمي. أمّن ميزتك المعلوماتية."],
      jp: ["構造的変化を先取りする。深層インテリジェンスのためにフォローする。", "機関投資家レベルの洞察を毎日配信。ネットワークに参加する。", "グローバルなマクロ情勢を解読する。情報の優位性を確保する。"],
      zh: ["领先于结构性转变。关注获取深度情报。", "每日提供机构级洞察。加入网络。", "解码全球宏观格局。确保您的信息优势。"]
    };

    const authorityLines: Record<Language, string[]> = {
      en: ["SIA Intelligence: Operating at the intersection of compute and sovereignty.", "Verified by Sentinel Node. Cross-referenced across global nodes.", "Council of Five Strategic Assessment - Internal Distribution Only."],
      tr: ["SIA İstihbaratı: Hesaplama ve egemenliğin kesiştiği noktada faaliyet gösteriyor.", "Sentinel Düğümü tarafından doğrulandı. Küresel düğümler arası çapraz referanslı.", "Beşler Konseyi Stratejik Değerlendirmesi - Sadece Dahili Dağıtım."],
      de: ["SIA Intelligence: Agiert an der Schnittstelle von Rechenleistung und Souveränität.", "Verifiziert durch Sentinel Node. Querverweise über globale Knoten.", "Strategische Bewertung des Rats der Fünf - Nur für den internen Gebrauch."],
      fr: ["SIA Intelligence : Opère à l'intersection du calcul et de la souveraineté.", "Vérifié par Sentinel Node. Références croisées entre les nœuds mondiaux.", "Évaluation stratégique du Conseil des Cinq - Distribution interne uniquement."],
      es: ["SIA Intelligence: Operando en la intersección de la computación y la soberanía.", "Verificado por Sentinel Node. Referenciado de forma cruzada en nodos globales.", "Evaluación Estratégica del Consejo de los Cinco - Solo Distribución Interna."],
      ru: ["SIA Intelligence: Работа на стыке вычислений и суверенитета.", "Верифицировано Sentinel Node. Перекрестные ссылки по всем глобальным узлам.", "Стратегическая оценка Совета Пяти — только для внутреннего распространения."],
      ar: ["استخبارات SIA: تعمل في نقطة تقاطع الحوسبة والسيادة.", "تم التحقق بواسطة عقدة Sentinel. مراجع متقاطعة عبر العقد العالمية.", "التقييم الاستراتيجي لمجلس الخمسة - للتوزيع الداخلي فقط."],
      jp: ["SIAインテリジェンス：計算能力と主権の交差点で活動。", "Sentinel Nodeによる検証済み。グローバルノード間で相互参照。", "五人評議会戦略評価 - 内部配布限定。"],
      zh: ["SIA 情报：在计算与主权的交汇点运行。", "经 Sentinel 节点验证。跨全球节点引用。", "五人委员会战略评估 - 仅限内部分发。"]
    };

    const ctaList = ctas[language] || ctas['en'];
    const authList = authorityLines[language] || authorityLines['en'];

    return {
      language,
      cta: ctaList[Math.floor(Math.random() * ctaList.length)],
      authority_line: authList[Math.floor(Math.random() * authList.length)]
    };
  }

  /**
   * SECTION 3 — FUTURE MONETIZATION PREP & SECTION 5 — OUTPUT
   */
  public calculateConversionIntent(metrics: { pageViews: number; avgReadTime: number; repeatVisitor: boolean }): ConversionIntent {
    if (metrics.repeatVisitor && metrics.avgReadTime > 120) return 'HIGH';
    if (metrics.avgReadTime > 60 || metrics.pageViews > 3) return 'MEDIUM';
    return 'LOW';
  }

  public getExclusivityScore(category: string): number {
    const highExclusivity = ['SOVEREIGN_INTELLIGENCE', 'COMPUTE_RESERVES', 'CENTRAL_BANK_DIGITAL'];
    if (highExclusivity.includes(category)) return 95;
    return 75;
  }
}
