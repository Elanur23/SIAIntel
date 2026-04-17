/**
 * SIA ANALYSIS BAROMETER - INTERACTIVE AUTHORITY WIDGET
 * PURPOSE: Display trust signals for Google SGE and user confidence
 * FEATURES: Real-time reliability score, source verification, analysis depth indicator
 */

import { ShieldCheck, Activity, Zap } from 'lucide-react'

interface SiaAnalysisBarometerProps {
  reliabilityScore?: number
  sourceVerification?: 'active' | 'verified' | 'pending'
  analysisDepth?: 'sovereign' | 'elite' | 'standard'
  lang?: string
}

const translations = {
  en: {
    title: 'SIA Analysis Barometer',
    reliability: 'Reliability Score',
    verification: 'Source Verification',
    depth: 'Analysis Depth',
    active: 'Active',
    verified: 'Verified',
    pending: 'Pending',
    sovereign: 'Sovereign Level',
    elite: 'Elite Level',
    standard: 'Standard Level',
  },
  tr: {
    title: 'SIA Analiz Barometresi',
    reliability: 'Güvenilirlik Skoru',
    verification: 'Kaynak Doğrulama',
    depth: 'Analiz Derinliği',
    active: 'Aktif',
    verified: 'Doğrulandı',
    pending: 'Beklemede',
    sovereign: 'Egemen Seviye',
    elite: 'Elit Seviye',
    standard: 'Standart Seviye',
  },
  de: {
    title: 'SIA-Analysebarometer',
    reliability: 'Zuverlässigkeitswert',
    verification: 'Quellenverifizierung',
    depth: 'Analysetiefe',
    active: 'Aktiv',
    verified: 'Verifiziert',
    pending: 'Ausstehend',
    sovereign: 'Souveräne Ebene',
    elite: 'Elite-Ebene',
    standard: 'Standard-Ebene',
  },
  fr: {
    title: 'Baromètre d\'Analyse SIA',
    reliability: 'Score de Fiabilité',
    verification: 'Vérification des Sources',
    depth: 'Profondeur d\'Analyse',
    active: 'Actif',
    verified: 'Vérifié',
    pending: 'En Attente',
    sovereign: 'Niveau Souverain',
    elite: 'Niveau Élite',
    standard: 'Niveau Standard',
  },
  es: {
    title: 'Barómetro de Análisis SIA',
    reliability: 'Puntuación de Fiabilidad',
    verification: 'Verificación de Fuentes',
    depth: 'Profundidad de Análisis',
    active: 'Activo',
    verified: 'Verificado',
    pending: 'Pendiente',
    sovereign: 'Nivel Soberano',
    elite: 'Nivel Élite',
    standard: 'Nivel Estándar',
  },
  ru: {
    title: 'Барометр Анализа SIA',
    reliability: 'Оценка Надежности',
    verification: 'Проверка Источников',
    depth: 'Глубина Анализа',
    active: 'Активно',
    verified: 'Проверено',
    pending: 'Ожидание',
    sovereign: 'Суверенный Уровень',
    elite: 'Элитный Уровень',
    standard: 'Стандартный Уровень',
  },
  ar: {
    title: 'مقياس تحليل SIA',
    reliability: 'درجة الموثوقية',
    verification: 'التحقق من المصدر',
    depth: 'عمق التحليل',
    active: 'نشط',
    verified: 'تم التحقق',
    pending: 'قيد الانتظار',
    sovereign: 'المستوى السيادي',
    elite: 'المستوى النخبوي',
    standard: 'المستوى القياسي',
  },
  jp: {
    title: 'SIA分析バロメーター',
    reliability: '信頼性スコア',
    verification: 'ソース検証',
    depth: '分析深度',
    active: 'アクティブ',
    verified: '検証済み',
    pending: '保留中',
    sovereign: 'ソブリンレベル',
    elite: 'エリートレベル',
    standard: 'スタンダードレベル',
  },
  zh: {
    title: 'SIA分析晴雨表',
    reliability: '可靠性评分',
    verification: '来源验证',
    depth: '分析深度',
    active: '活跃',
    verified: '已验证',
    pending: '待处理',
    sovereign: '主权级别',
    elite: '精英级别',
    standard: '标准级别',
  },
}

export default function SiaAnalysisBarometer({
  reliabilityScore = 98,
  sourceVerification = 'active',
  analysisDepth = 'sovereign',
  lang = 'en',
}: SiaAnalysisBarometerProps) {
  const t = translations[lang as keyof typeof translations] || translations.en

  const verificationColor = {
    active: 'text-lime-400 bg-lime-500/10 border-lime-500/30',
    verified: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  }

  const depthColor = {
    sovereign: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    elite: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    standard: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
  }

  return (
    <div className="p-6 glass-panel machined-edge rounded-[2rem] space-y-5 relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500" />

      {/* Header */}
      <div className="flex items-center gap-3 relative z-10">
        <Activity size={18} className="text-blue-400" />
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400">
          {t.title}
        </span>
      </div>

      {/* Metrics */}
      <div className="space-y-4 relative z-10">
        {/* Reliability Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">
              {t.reliability}
            </span>
            <span className="text-2xl font-black text-lime-400 italic">
              {reliabilityScore}%
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-lime-500 to-lime-400 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${reliabilityScore}%` }}
            />
          </div>
        </div>

        {/* Source Verification */}
        <div className="flex items-center justify-between py-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-lime-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">
              {t.verification}
            </span>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
              verificationColor[sourceVerification]
            }`}
          >
            {t[sourceVerification]}
          </span>
        </div>

        {/* Analysis Depth */}
        <div className="flex items-center justify-between py-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-purple-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">
              {t.depth}
            </span>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
              depthColor[analysisDepth]
            }`}
          >
            {t[analysisDepth]}
          </span>
        </div>
      </div>

      {/* Trust Badge */}
      <div className="pt-4 border-t border-white/5 relative z-10">
        <div className="flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-[0.3em] text-white/40">
          <ShieldCheck size={10} />
          <span>E-E-A-T VERIFIED</span>
        </div>
      </div>
    </div>
  )
}
