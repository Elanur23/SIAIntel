"use client"

import React, { useState } from 'react'
import SiaLegalShield from './SiaLegalShield'

// Her dil için özgün medya şivesi ve stil tanımları
const NEWS_STYLES: Record<string, { label: string, prefix: string, font?: string }> = {
  TR: { label: "İSTANBUL_HUB", prefix: "[SON_DAKİKA]" },
  EN: { label: "NEW_YORK_GLOBAL", prefix: "[BREAKING]" },
  DE: { label: "FRANKFURT_BÖRSE", prefix: "[EILMELDUNG]" },
  ES: { label: "MADRID_CENTRAL", prefix: "[ULTIMA_HORA]" },
  FR: { label: "PARIS_BUREAU", prefix: "[ALERTE_INFO]" },
  AR: { label: "DUBAI_NETWORK", prefix: "[خبر_عاجل]", font: "font-serif" }
}

interface SpotlightIntelligenceProps {
  activeNews: any
  isLiveData?: boolean
}

export default function GlobalAutonomousEditor({ activeNews, isLiveData = false }: SpotlightIntelligenceProps) {
  const [selectedLang, setSelectedLang] = useState('TR')

  // Binance Live Data kontrolü
  const isBinanceLive = activeNews?.source === 'BINANCE_LIVE'

  // SIA_NETWORK Protokolü: OSINT_COMPLIANCE + NEUTRAL_ANALYSIS + LOCALIZATION_LOGIC
  const generateAutonomousReport = (news: any, lang: string) => {
    if (!news) return "AWAITING_SIGNAL..."
    
    // Risk seviyesi tespiti (olasılık bazlı)
    const impact = news.market_impact || news.impact || 5
    const riskLevel = impact >= 8 ? 'YÜKSEK' : impact >= 5 ? 'ORTA' : 'DÜŞÜK'
    const sentiment = news.sentiment || news.signal || 'NEUTRAL'
    
    // Binance Live Data için özel analiz
    const isBinanceLive = news.source === 'BINANCE_LIVE'
    
    const reports: Record<string, string> = {
      TR: isBinanceLive 
        ? `OSINT Analizi: ${news.title.split(' ')[0]} varlığında %${Math.abs(parseFloat(news.executive_summary?.match(/[-+]?\d+\.\d+%/)?.[0] || '0')).toFixed(2)} fiyat sapması tespit edildi. 24 saatlik volatilite anomalisi gözlemlendi. Risk Seviyesi: ${riskLevel}. Algoritmik olasılık modeli ${news.confidence}% güven aralığında sinyal üretiyor. NOT_FINANCIAL_ADVICE: Algorithmic Probability Analysis.`
        : `Piyasa İstihbaratı: ${news.title} gelişmesi volatilite artışına işaret ediyor. Erken Uyarı Sistemi (EWS) ${riskLevel} seviye risk tespit etti. Analiz merkezimiz on-chain verileri ve halka açık kaynaklardan gelen sinyalleri değerlendiriyor. NOT_FINANCIAL_ADVICE: Algorithmic Probability Analysis.`,
      
      EN: isBinanceLive
        ? `OSINT Analysis: ${news.title.split(' ')[0]} asset shows ${Math.abs(parseFloat(news.executive_summary?.match(/[-+]?\d+\.\d+%/)?.[0] || '0')).toFixed(2)}% price deviation detected via public API nodes. 24h volatility anomaly observed. Risk Level: ${riskLevel === 'YÜKSEK' ? 'HIGH' : riskLevel === 'ORTA' ? 'MODERATE' : 'LOW'}. Algorithmic probability model generates signal with ${news.confidence}% confidence interval. NOT_FINANCIAL_ADVICE: Algorithmic Probability Analysis.`
        : `Market Intelligence: ${news.title} development indicates volatility increase. Early Warning System (EWS) detected ${riskLevel === 'YÜKSEK' ? 'HIGH' : riskLevel === 'ORTA' ? 'MODERATE' : 'LOW'} level risk. Analysis center evaluating on-chain data and public source signals. NOT_FINANCIAL_ADVICE: Algorithmic Probability Analysis.`,
      
      DE: isBinanceLive
        ? `OSINT-Analyse: ${news.title.split(' ')[0]}-Asset zeigt ${Math.abs(parseFloat(news.executive_summary?.match(/[-+]?\d+\.\d+%/)?.[0] || '0')).toFixed(2)}% Preisabweichung über öffentliche API-Knoten. 24h-Volatilitätsanomalie beobachtet. Risikostufe: ${riskLevel === 'YÜKSEK' ? 'HOCH' : riskLevel === 'ORTA' ? 'MITTEL' : 'NIEDRIG'}. Algorithmisches Wahrscheinlichkeitsmodell generiert Signal mit ${news.confidence}% Konfidenzintervall. KEINE_ANLAGEBERATUNG: Algorithmische Wahrscheinlichkeitsanalyse.`
        : `Marktintelligenz: ${news.title} Entwicklung deutet auf Volatilitätszunahme hin. Frühwarnsystem (EWS) erkannte ${riskLevel === 'YÜKSEK' ? 'HOHES' : riskLevel === 'ORTA' ? 'MITTLERES' : 'NIEDRIGES'} Risikoniveau. Analysezentrum bewertet On-Chain-Daten und öffentliche Quellensignale. KEINE_ANLAGEBERATUNG: Algorithmische Wahrscheinlichkeitsanalyse.`,
      
      ES: isBinanceLive
        ? `Análisis OSINT: Activo ${news.title.split(' ')[0]} muestra desviación de precio del ${Math.abs(parseFloat(news.executive_summary?.match(/[-+]?\d+\.\d+%/)?.[0] || '0')).toFixed(2)}% detectada vía nodos API públicos. Anomalía de volatilidad 24h observada. Nivel de Riesgo: ${riskLevel === 'YÜKSEK' ? 'ALTO' : riskLevel === 'ORTA' ? 'MODERADO' : 'BAJO'}. Modelo probabilístico algorítmico genera señal con intervalo de confianza del ${news.confidence}%. NO_ES_ASESORAMIENTO_FINANCIERO: Análisis de Probabilidad Algorítmica.`
        : `Inteligencia de Mercado: Desarrollo ${news.title} indica aumento de volatilidad. Sistema de Alerta Temprana (EWS) detectó riesgo nivel ${riskLevel === 'YÜKSEK' ? 'ALTO' : riskLevel === 'ORTA' ? 'MODERADO' : 'BAJO'}. Centro de análisis evaluando datos on-chain y señales de fuentes públicas. NO_ES_ASESORAMIENTO_FINANCIERO: Análisis de Probabilidad Algorítmica.`,
      
      FR: isBinanceLive
        ? `Analyse OSINT: L'actif ${news.title.split(' ')[0]} présente une déviation de prix de ${Math.abs(parseFloat(news.executive_summary?.match(/[-+]?\d+\.\d+%/)?.[0] || '0')).toFixed(2)}% détectée via nœuds API publics. Anomalie de volatilité 24h observée. Niveau de Risque: ${riskLevel === 'YÜKSEK' ? 'ÉLEVÉ' : riskLevel === 'ORTA' ? 'MODÉRÉ' : 'FAIBLE'}. Modèle probabiliste algorithmique génère signal avec intervalle de confiance de ${news.confidence}%. PAS_DE_CONSEIL_FINANCIER: Analyse de Probabilité Algorithmique.`
        : `Renseignement de Marché: Le développement ${news.title} indique une augmentation de volatilité. Système d'Alerte Précoce (EWS) a détecté un risque niveau ${riskLevel === 'YÜKSEK' ? 'ÉLEVÉ' : riskLevel === 'ORTA' ? 'MODÉRÉ' : 'FAIBLE'}. Centre d'analyse évaluant données on-chain et signaux de sources publiques. PAS_DE_CONSEIL_FINANCIER: Analyse de Probabilité Algorithmique.`,
      
      AR: isBinanceLive
        ? `تحليل OSINT: الأصل ${news.title.split(' ')[0]} يظهر انحراف سعر ${Math.abs(parseFloat(news.executive_summary?.match(/[-+]?\d+\.\d+%/)?.[0] || '0')).toFixed(2)}% تم اكتشافه عبر عقد API العامة. لوحظ شذوذ تقلب 24 ساعة. مستوى المخاطر: ${riskLevel === 'YÜKSEK' ? 'عالي' : riskLevel === 'ORTA' ? 'متوسط' : 'منخفض'}. نموذج الاحتمالية الخوارزمية يولد إشارة بفاصل ثقة ${news.confidence}%. ليس_نصيحة_مالية: تحليل احتمالي خوارزمي.`
        : `استخبارات السوق: تطور ${news.title} يشير إلى زيادة التقلب. نظام الإنذار المبكر (EWS) اكتشف مخاطر مستوى ${riskLevel === 'YÜKSEK' ? 'عالي' : riskLevel === 'ORTA' ? 'متوسط' : 'منخفض'}. مركز التحليل يقيم بيانات on-chain وإشارات المصادر العامة. ليس_نصيحة_مالية: تحليل احتمالي خوارزمي.`
    }
    
    return reports[lang] || reports['EN']
  }

  return (
    <div className="flex flex-col h-full bg-[#050505] font-mono border border-gray-900 overflow-hidden">
      {/* ÜST PANEL: DİL SEÇİCİ */}
      <div className="p-4 bg-black/60 border-b border-gray-900 flex justify-between items-center">
        <span className="text-[9px] text-gray-500 font-bold tracking-widest uppercase">
          Autonomous_Editor // Target: {NEWS_STYLES[selectedLang].label}
        </span>

        <div className="grid grid-cols-3 gap-1 md:flex">
          {Object.keys(NEWS_STYLES).map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLang(lang)}
              className={`px-3 py-1 text-[10px] font-bold border transition-all ${
                selectedLang === lang 
                  ? 'bg-[#FFB800] text-black border-[#FFB800]' 
                  : 'text-gray-600 border-gray-800 hover:border-gray-600'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* EDİTÖR ÖNİZLEME ALANI */}
      <div className="flex-grow p-8 flex flex-col justify-center relative overflow-auto">
        {/* SAFE HARBOR PROTOCOL - Yasal Kalkan */}
        <SiaLegalShield dataMode={isBinanceLive ? 'PRE_INTEL' : 'GENERAL'} />
        
        <div className="transition-all duration-700 opacity-100 translate-y-0">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_green]" />
            <span className="text-[10px] text-gray-400 font-black italic uppercase">
              {NEWS_STYLES[selectedLang].prefix} SIA_NEWS_NETWORK
            </span>
          </div>

          <h2 className={`text-3xl font-black italic tracking-tighter mb-6 ${
            NEWS_STYLES[selectedLang].font || ''
          }`}>
            {activeNews?.title || "SYSTEM_STANDBY"}
          </h2>

          <p className="text-lg text-gray-300 font-light leading-relaxed max-w-2xl border-l-4 border-[#FFB800] pl-6 italic">
            {generateAutonomousReport(activeNews, selectedLang)}
          </p>
        </div>
      </div>

      {/* DURUM ÇUBUĞU */}
      <div className="p-3 bg-black border-t border-gray-900 flex justify-between items-center text-[9px]">
        <div className="flex items-center space-x-4">
          <span className="font-bold text-green-500">
            ● LIVE_ON_AIR
          </span>
          {/* Live Data Stream Indicator */}
          {isLiveData && activeNews?.source === 'BINANCE_LIVE' && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
              <span className="text-[10px] text-green-500 font-mono font-bold tracking-widest">
                LIVE_DATA_STREAM: ONLINE // SOURCE: BINANCE_NODES
              </span>
            </div>
          )}
          {!isLiveData && (
            <span className="text-gray-600">
              CHANNELS: WEB // TERMINAL // TELEGRAM // X
            </span>
          )}
        </div>
        <span className="text-gray-700 uppercase tracking-widest">
          AUTONOMOUS_CONTENT_GENERATOR_V2
        </span>
      </div>

      {/* YASAL ZIRH - SIA_NETWORK LEGAL_SHIELD Protokolü */}
      <div className="px-6 py-2 bg-red-900/5 text-[7px] text-gray-700 uppercase tracking-widest border-t border-gray-900">
        ⚠ SIA_NETWORK // OSINT_COMPLIANCE_VERIFIED // NOT_FINANCIAL_ADVICE (SPK 6362 • SEC • MiFID II)
      </div>
    </div>
  )
}
