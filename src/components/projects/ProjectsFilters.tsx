'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'

interface FilterProps {
  clients: Array<{ id: string; name: string }>
  statuses: string[]
  currentStatus?: string
  currentClientId?: string
  currentSearch?: string
}

export function ProjectFilters({
  clients,
  statuses,
  currentStatus,
  currentClientId,
  currentSearch,
}: FilterProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(currentSearch || '')

  const handleFilterChange = (
    key: string,
    value: string | undefined
  ) => {
    const params = new URLSearchParams()

    if (search) params.set('q', search)
    if (key !== 'status' && currentStatus) params.set('status', currentStatus)
    if (key !== 'clientId' && currentClientId) params.set('clientId', currentClientId)

    if (value && key === 'status') params.set('status', value)
    if (value && key === 'clientId') params.set('clientId', value)

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
    if (currentClientId) params.set('clientId', currentClientId)
    params.set('page', '1')

    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  const handleReset = () => {
    setSearch('')
    startTransition(() => {
      router.push('')
    })
  }

  const hasFilters = search || currentStatus || currentClientId

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3.5 h-4 w-4 text-zinc-400 pointer-events-none top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom de projet..."
          className="w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </form>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Status Filter */}
        <select
          value={currentStatus || ''}
          onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
          disabled={isPending}
          className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-50"
        >
          <option value="">Tous les statuts</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        {/* Client Filter */}
        <select
          value={currentClientId || ''}
          onChange={(e) => handleFilterChange('clientId', e.target.value || undefined)}
          disabled={isPending}
          className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-50"
        >
          <option value="">Tous les clients</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>

        {/* Reset Button */}
        {hasFilters && (
          <button
            onClick={handleReset}
            disabled={isPending}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-50 transition-colors"
          >
            <X className="h-4 w-4 inline mr-1" />
            Réinitialiser
          </button>
        )}
      </div>
    </div>
  )
}
