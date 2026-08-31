'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  total: number
}

export function Pagination({
  currentPage,
  totalPages,
  total,
}: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    router.push(`?${params.toString()}`)
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between pt-6 border-t border-sand-200">
      <div className="font-data text-xs text-ink-500">
        {total} résultat(s) au total
      </div>

      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-lg border border-sand-200 bg-white p-2.5 shadow-sm hover:bg-sand-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-ink-500" />
        </button>

        {/* Page Numbers */}
        <div className="font-data flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`min-w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                page === currentPage
                  ? 'bg-maroon-600 text-white shadow-sm'
                  : 'border border-sand-200 bg-white text-ink-900 hover:bg-sand-50'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-lg border border-sand-200 bg-white p-2.5 shadow-sm hover:bg-sand-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-ink-500" />
        </button>
      </div>
    </div>
  )
}
