'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { List, Kanban } from 'lucide-react'

interface TaskViewToggleProps {
  currentView: 'list' | 'board'
}

export function TaskViewToggle({ currentView }: TaskViewToggleProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setView = (view: 'list' | 'board') => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', view)
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="inline-flex items-center rounded-lg border border-sand-200 bg-white p-0.5 shadow-sm">
      <button
        type="button"
        onClick={() => setView('board')}
        aria-pressed={currentView === 'board'}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          currentView === 'board' ? 'bg-maroon-600 text-white' : 'text-ink-500 hover:bg-sand-100'
        }`}
      >
        <Kanban className="h-3.5 w-3.5" />
        Kanban
      </button>
      <button
        type="button"
        onClick={() => setView('list')}
        aria-pressed={currentView === 'list'}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          currentView === 'list' ? 'bg-maroon-600 text-white' : 'text-ink-500 hover:bg-sand-100'
        }`}
      >
        <List className="h-3.5 w-3.5" />
        Liste
      </button>
    </div>
  )
}
