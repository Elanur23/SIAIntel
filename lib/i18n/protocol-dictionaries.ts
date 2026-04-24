/**
 * SIA PROTOCOL DICTIONARIES
 * Centralized strings for the SIA Master Protocol v4.0
 */

export const protocolStrings = {
  en: {
    verification_title: "SIA-V4-EEAT-SOURCE-VERIFICATION",
    methodology_title: "Data Sources & Methodology",
    metadata_title: "Verification Metadata",
    confidence_score: "Confidence Score",
    hash: "SHA-256 Hash",
    timestamp: "Timestamp",
    protocol_version: "Protocol Version",
    authority: "Authority",
    compliance: "E-E-A-T Compliance",
    intelligence_validation_title: "Intelligence Validation",
    risk_disclaimer_title: "Risk Disclaimer",
    regulatory_notice: "Regulatory Notice",
    global_intelligence_title: "Global Intelligence Network",
    regional_nodes_title: "Regional Intelligence Nodes",
    network_effect: "**Network Effect**:",
    statistical_probability: "Statistical Probability",
    verified: "Verified",
    important: "IMPORTANT",
    action_required: "Action Required",
  },
  tr: {
    verification_title: "SIA-V4-EEAT-KAYNAK-DOĞRULAMA",
    methodology_title: "Veri Kaynakları ve Metodoloji",
    metadata_title: "Doğrulama Meta Verileri",
    confidence_score: "Güven Oranı",
    hash: "SHA-256 Hash",
    timestamp: "Zaman Damgası",
    protocol_version: "Protokol Versiyonu",
    authority: "Otorite",
    compliance: "E-E-A-T Uyumluluğu",
    intelligence_validation_title: "İstihbarat Doğrulaması",
    risk_disclaimer_title: "Risk Açıklaması",
    regulatory_notice: "Düzenleyici Bildirimi",
    global_intelligence_title: "Küresel İstihbarat Ağı",
    regional_nodes_title: "Bölgesel İstihbarat Düğümleri",
    network_effect: "**Ağ Etkisi**:",
    statistical_probability: "İstatistiksel Olasılık",
    verified: "Doğrulandı",
    important: "ÖNEMLİ",
    action_required: "Eylem Gerekli",
  }
} as const;

export type ProtocolLanguage = keyof typeof protocolStrings;
