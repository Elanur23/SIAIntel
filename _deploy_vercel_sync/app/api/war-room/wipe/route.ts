import { NextRequest, NextResponse } from 'next/server'
import { deleteAllArticles } from '@/lib/warroom/database'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    const masterPassword = process.env.ADMIN_WIPE_PASSWORD;

    // 🛡️ KRİTİK ŞİFRE KONTROLÜ
    if (!masterPassword || password !== masterPassword) {
      return NextResponse.json({
        success: false,
        error: 'YETKİSİZ ERİŞİM: İmha şifresi hatalı!'
      }, { status: 403 });
    }

    // Şifre doğruysa silme işlemini yap
    const result = await deleteAllArticles()

    return NextResponse.json({
      success: true,
      message: 'System Archive wiped successfully',
      count: result.count
    })

  } catch (error: any) {
    console.error('Wipe API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Sistem Hatası' },
      { status: 500 }
    )
  }
}
