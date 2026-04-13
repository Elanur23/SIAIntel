'use client'

import React from 'react'
import { Download } from 'lucide-react'

export default function PdfExportButton({ articleId, title, content, author, lang }: any) {
  const handleExport = () => {
    window.print()
  }

  return (
    <button
      onClick={handleExport}
      className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 no-print"
    >
      <Download size={16} /> Export_Report_PDF
    </button>
  )
}
