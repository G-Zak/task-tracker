'use client'

import { useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import type { Period } from '@/src/lib/period'

const periodLabels: Record<Period, string> = {
    week: '7 derniers jours',
    month: '30 derniers jours',
    quarter: '90 derniers jours',
    all: 'Toute la période',
}

interface StatisticsFiltersProps {
    projects: Array<{ id: string; name: string }>
    clients: Array<{ id: string; name: string }>
    currentPeriod: Period
    currentProjectId?: string
    currentClientId?: string
}

export function StatisticsFilters({ projects, clients, currentPeriod, currentProjectId, currentClientId }: StatisticsFiltersProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [isPending, startTransition] = useTransition()

    const handleChange = (key: 'period' | 'projectId' | 'clientId', value: string | undefined) => {
        const params = new URLSearchParams()

        if (key !== 'period' && currentPeriod !== 'month') params.set('period', currentPeriod)

        // Projet et client sont mutuellement exclusifs (un projet appartient déjà à un client) :
        // choisir l'un efface l'autre plutôt que de laisser un filtre ignoré silencieusement.
        if (key !== 'projectId' && key !== 'clientId') {
            if (currentProjectId) params.set('projectId', currentProjectId)
            else if (currentClientId) params.set('clientId', currentClientId)
        }

        if (value) params.set(key, value)

        startTransition(() => {
            router.push(params.size > 0 ? `${pathname}?${params.toString()}` : pathname)
        })
    }

    const hasFilters = currentPeriod !== 'month' || currentProjectId || currentClientId

    return (
        <div className="flex flex-col sm:flex-row gap-3">
            <select
                value={currentPeriod}
                onChange={(e) => handleChange('period', e.target.value)}
                disabled={isPending}
                className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-50"
            >
                {(Object.keys(periodLabels) as Period[]).map((period) => (
                    <option key={period} value={period}>
                        {periodLabels[period]}
                    </option>
                ))}
            </select>

            <select
                value={currentProjectId || ''}
                onChange={(e) => handleChange('projectId', e.target.value || undefined)}
                disabled={isPending}
                className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-50"
            >
                <option value="">Tous les projets</option>
                {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                        {project.name}
                    </option>
                ))}
            </select>

            <select
                value={currentClientId || ''}
                onChange={(e) => handleChange('clientId', e.target.value || undefined)}
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

            {hasFilters && (
                <button
                    onClick={() => startTransition(() => router.push(pathname))}
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
