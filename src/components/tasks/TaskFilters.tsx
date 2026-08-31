'use client'

import { useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

import { taskStatusLabels, taskStatusOptions, taskPriorityLabels, taskPriorityOptions } from '@/lib/labels'

interface TaskFiltersProps {
  projects: Array<{ id: string; name: string }>
  currentStatus?: string
  currentPriority?: string
  currentProjectId?: string
  currentSearch?: string
  currentView?: 'list' | 'board'
}

export function TaskFilters({
  projects,
  currentStatus,
  currentPriority,
  currentProjectId,
  currentSearch,
  currentView = 'list',
}: TaskFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(currentSearch || '')

  const handleFilterChange = (key: 'status' | 'priority' | 'projectId', value: string | undefined) => {
    const params = new URLSearchParams()

    if (search) params.set('q', search)
    if (key !== 'status' && currentStatus) params.set('status', currentStatus)
    if (key !== 'priority' && currentPriority) params.set('priority', currentPriority)
    if (key !== 'projectId' && currentProjectId) params.set('projectId', currentProjectId)
    if (currentView !== 'list') params.set('view', currentView)

    if (value) params.set(key, value)

    params.set('page', '1')

    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const params = new URLSearchParams()

    if (search) params.set('q', search)
    if (currentStatus) params.set('status', currentStatus)
    if (currentPriority) params.set('priority', currentPriority)
    if (currentProjectId) params.set('projectId', currentProjectId)
    if (currentView !== 'list') params.set('view', currentView)
    params.set('page', '1')

    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  const handleReset = () => {
    setSearch('')
    startTransition(() => {
      router.push(currentView !== 'list' ? `${pathname}?view=${currentView}` : pathname)
    })
  }

  const hasFilters = search || currentStatus || currentPriority || currentProjectId

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3.5 h-4 w-4 text-sand-400 pointer-events-none top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par titre de tâche..."
          className="w-full rounded-lg border border-sand-200 bg-white pl-10 pr-4 py-2.5 text-sm text-ink-900 placeholder:text-sand-400 shadow-sm focus:border-maroon-600 focus:outline-none focus:ring-1 focus:ring-maroon-600"
        />
      </form>

      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={currentStatus || ''}
          onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
          disabled={isPending}
          className="flex-1 rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-ink-900 shadow-sm focus:border-maroon-600 focus:outline-none focus:ring-1 focus:ring-maroon-600 disabled:opacity-50"
        >
          <option value="">Tous les statuts</option>
          {taskStatusOptions.map((status) => (
            <option key={status} value={status}>
              {taskStatusLabels[status]}
            </option>
          ))}
        </select>

        <select
          value={currentPriority || ''}
          onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
          disabled={isPending}
          className="flex-1 rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-ink-900 shadow-sm focus:border-maroon-600 focus:outline-none focus:ring-1 focus:ring-maroon-600 disabled:opacity-50"
        >
          <option value="">Toutes les priorités</option>
          {taskPriorityOptions.map((priority) => (
            <option key={priority} value={priority}>
              {taskPriorityLabels[priority]}
            </option>
          ))}
        </select>

        <select
          value={currentProjectId || ''}
          onChange={(e) => handleFilterChange('projectId', e.target.value || undefined)}
          disabled={isPending}
          className="flex-1 rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-ink-900 shadow-sm focus:border-maroon-600 focus:outline-none focus:ring-1 focus:ring-maroon-600 disabled:opacity-50"
        >
          <option value="">Tous les projets</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={handleReset}
            disabled={isPending}
            className="rounded-lg border border-sand-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-700 shadow-sm hover:bg-sand-50 disabled:opacity-50 transition-colors"
          >
            <X className="h-4 w-4 inline mr-1" />
            Réinitialiser
          </button>
        )}
      </div>
    </div>
  )
}
