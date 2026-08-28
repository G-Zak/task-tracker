'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search, X, ShieldAlert } from 'lucide-react'

interface ClientFiltersProps {
    currentSearch?: string
    atRiskOnly: boolean
}

export function ClientFilters({ currentSearch, atRiskOnly }: ClientFiltersProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [isPending, startTransition] = useTransition()
    const [search, setSearch] = useState(currentSearch || '')

    const pushParams = (nextSearch: string, nextAtRisk: boolean) => {
        const params = new URLSearchParams()
        if (nextSearch) params.set('q', nextSearch)
        if (nextAtRisk) params.set('atRisk', '1')

        startTransition(() => {
            router.push(params.size > 0 ? `${pathname}?${params.toString()}` : pathname)
        })
    }

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        pushParams(search, atRiskOnly)
    }

    const handleReset = () => {
        setSearch('')
        startTransition(() => router.push(pathname))
    }

    const hasFilters = search || atRiskOnly

    return (
        <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="relative flex-1">
                <Search className="absolute left-3.5 h-4 w-4 text-zinc-400 pointer-events-none top-1/2 -translate-y-1/2" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher par nom ou email..."
                    className="w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
            </form>

            <button
                type="button"
                onClick={() => pushParams(search, !atRiskOnly)}
                disabled={isPending}
                title="N'afficher que les clients ayant au moins un projet en retard, triés par nombre de projets en retard"
                className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-50 ${
                    atRiskOnly ? 'border-red-200 bg-red-50 text-red-700' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
            >
                <ShieldAlert className="h-4 w-4" />
                Clients à risque
            </button>

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
    )
}
