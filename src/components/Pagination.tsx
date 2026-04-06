'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, perPage, total, showPerPage = true, onPageChange, onPerPageChange }: {
  page: number
  perPage: number
  total: number
  showPerPage?: boolean
  onPageChange: (page: number) => void
  onPerPageChange?: (perPage: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  if (total <= perPage && !showPerPage) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6">
      <p className="text-[12px] text-muted">{total} result{total !== 1 ? 's' : ''}</p>
      <div className="flex items-center gap-3">
        {showPerPage && onPerPageChange && (
          <select
            value={perPage}
            onChange={e => { onPerPageChange(parseInt(e.target.value)); onPageChange(1) }}
            className="text-[12px] text-secondary bg-white border border-border rounded-lg px-2 py-1.5"
          >
            {[10, 25, 50].map(n => <option key={n} value={n}>{n} per page</option>)}
          </select>
        )}
        <div className="flex items-center gap-1">
          <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}
            className="p-1.5 rounded-lg border border-border text-muted hover:text-ink hover:border-ink/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft size={14} />
          </button>
          <span className="text-[12px] text-secondary px-3">Page <span className="font-medium text-ink">{page}</span> of {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}
            className="p-1.5 rounded-lg border border-border text-muted hover:text-ink hover:border-ink/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
