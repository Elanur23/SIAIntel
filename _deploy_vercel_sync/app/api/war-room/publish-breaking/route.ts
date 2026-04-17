import { NextRequest, NextResponse } from 'next/server'
import { addToBuffer } from '@/lib/content/content-buffer-system'

/**
 * MÜJDE HABERİ - SİSTEME ENJEKTE ETME SERVİSİ
 * Bu servis, özel haberleri SIA Buffer sistemine manuel ama güvenli bir şekilde sokar.
 */
export async function POST(request: NextRequest) {
  try {
    const breakingNews = {
      headline: "Wall Street Bitcoin ETFs Hit Historic $100B Milestone!",
      summary: "Wall Street's Bitcoin exchange-traded funds have reached a historic milestone, surpassing $100 billion in total assets under management just 14 months after their initial launch.",
      fullContent: `Wall Street's Bitcoin exchange-traded funds have reached a historic milestone, surpassing $100 billion in total assets under management just 14 months after their initial launch, marking the fastest adoption of any ETF category in financial history.

The surge in institutional demand has been led by BlackRock's iShares Bitcoin Trust (IBIT) and Fidelity's Wise Origin Bitcoin Fund (FBTC), which together account for over 60% of the total Bitcoin ETF market. This unprecedented growth reflects a fundamental shift in how traditional financial institutions view cryptocurrency.

SIA ANALİZİ (Müjde):
Bu olay, Bitcoin'in artık spekülatif bir varlıktan çıkıp 'Kurumsal Temel Varlık' statüsüne geçtiğinin tescilidir. $100B eşiğinin aşılması, Nasdaq ve S&P 500 gibi ana endekslerle korelasyonu güçlendirirken, uzun vadeli volatiliteyi düşürecektir.`,
      metadata: {
        generatedAt: new Date().toISOString(),
        confidenceScore: 98,
        language_code: 'en',
        source: 'SIA_SPECIAL_REPORT'
      },
      entities: ['BTC', 'BlackRock', 'Fidelity', 'Wall Street', 'SEC'],
      sentiment: 92, // Bullish
      originalityScore: 100,
      eeatScore: 95
    }

    // 1. Haberi Buffer sistemine ekle
    const bufferedArticle = addToBuffer(breakingNews as any)

    // 2. Yanıt dön
    return NextResponse.json({
      success: true,
      message: 'Müjde haberi SIA Buffer sistemine başarıyla eklendi!',
      data: {
        id: bufferedArticle.bufferId,
        category: bufferedArticle.category,
        priority: bufferedArticle.priority,
        publishStatus: bufferedArticle.publishStatus
      }
    })

  } catch (error) {
    console.error('[Publish Breaking] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Haber enjekte edilemedi.'
    }, { status: 500 })
  }
}
