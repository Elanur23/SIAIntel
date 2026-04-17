import React from 'react'

export type CellAuditStatus = 'PASSED' | 'FIXED' | 'FAILED' | 'PENDING' | 'RUNNING' | 'NEURAL_EXCEPTION'

export interface CellAudit {
  status: CellAuditStatus
  score: number
  issues: string[]
  autofix_rounds: number
}

export interface ArticleAudit {
  article_id: string
  title: string
  body?: string
  language: string
  overall_score: number
  cms_ready?: boolean
  healing?: boolean
  cells: Record<string, CellAudit>
}

interface NeuralCellAuditRowProps {
  audit: ArticleAudit
}

export function NeuralCellAuditRow({ audit }: NeuralCellAuditRowProps): JSX.Element {
  return (
    <div className="rounded border border-gray-200 p-3 text-sm">
      <div className="font-semibold">{audit.title}</div>
      <div className="text-xs text-gray-500">{audit.article_id}</div>
    </div>
  )
}

export default NeuralCellAuditRow
