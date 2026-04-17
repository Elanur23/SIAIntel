import React from 'react'

interface SiaLegalShieldProps {
  dataMode: 'PRE_INTEL' | 'GENERAL'
}

const SiaLegalShield: React.FC<SiaLegalShieldProps> = ({ dataMode }) => {
  return (
    <div className="p-4 bg-red-950/10 border border-red-900/40 rounded-sm font-mono mb-4">
      <div className="flex items-center space-x-2 text-red-500 mb-2">
        <span className="w-2 h-2 bg-red-600 animate-pulse rounded-full" />
        <span className="text-[10px] font-black uppercase tracking-widest">
          SAFE_HARBOR_PROTOCOL_V2 // COMPLIANCE_CHECK_PASSED
        </span>
      </div>
      
      <p className="text-[9px] text-gray-500 leading-tight uppercase italic">
        {dataMode === 'PRE_INTEL' ? (
          "BU ANALİZ, HALKA AÇIK VERİ SETLERİNDEKİ (ON-CHAIN/SOCIAL) MATEMATİKSEL ANOMALİLERİN BİR KORELASYONUDUR. İÇERİDEN BİLGİ (INSIDER TRADING) KAPSAMINDA DEĞİLDİR. SİSTEM SADECE OLASILIK HESAPLAR VE HİÇBİR ŞEKİLDE YATIRIM TAVSİYESİ (6362 SPK) NİTELİĞİ TAŞIMAZ. KARARLAR KULLANICIYA AİTTİR."
        ) : (
          "BU İÇERİK GEMINI 1.5 PRO TARAFINDAN HALKA AÇIK KAYNAKLARDAN OTONOM OLARAK DERLENMİŞTİR. FİNANSAL BİR DANIŞMANLIK İÇERMEZ."
        )}
      </p>
    </div>
  )
}

export default SiaLegalShield
