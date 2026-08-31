'use client'

import { useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import type { StatisticsPeriod } from '@/src/services/statistics.service'

const periodLabels: Record<StatisticsPeriod, string> = {
    week: 'Cette semaine',
    month: 'Ce mois-ci',
    quarter: 'Ce trimestre',
    custom: 'Personnalisée',
}

interface StatisticsFiltersProps {
    projects: Array<{ id: string; name: string }>
    clients: Array<{ id: string; name: string }>
    teams: Array<{ id: string; name: string }>
    currentPeriod: StatisticsPeriod
    currentFrom?: string
    currentTo?: string
    currentProjectId?: string
    currentClientId?: string
    currentTeamId?: string
}

interface FilterState {
    period: StatisticsPeriod
    from: string
    to: string
    projectId: string
    clientId: string
    teamId: string
}

const selectClasses =
    'flex-1 rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-sm text-ink-900 shadow-sm focus:border-maroon-600 focus:outline-none focus:ring-1 focus:ring-maroon-600 disabled:opacity-50'

export function StatisticsFilters({
    projects,
    clients,
    teams,
    currentPeriod,
    currentFrom,
    currentTo,
    currentProjectId,
    currentClientId,
    currentTeamId,
}: StatisticsFiltersProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [isPending, startTransition] = useTransition()

    const push = (overrides: Partial<FilterState>) => {
        const next: FilterState = {
            period: currentPeriod,
            from: currentFrom ?? '',
            to: currentTo ?? '',
            projectId: currentProjectId ?? '',
            clientId: currentClientId ?? '',
            teamId: currentTeamId ?? '',
            ...overrides,
        }

        if (overrides.projectId) next.clientId = ''
        if (overrides.clientId) next.projectId = ''

        const params = new URLSearchParams()
        if (next.period !== 'month') params.set('period', next.period)
        if (next.period === 'custom') {
            if (next.from) params.set('from', next.from)
            if (next.to) params.set('to', next.to)
        }
        if (next.projectId) params.set('projectId', next.projectId)
        if (next.clientId) params.set('clientId', next.clientId)
        if (next.teamId) params.set('teamId', next.teamId)

        startTransition(() => {
            router.push(params.size > 0 ? `${pathname}?${params.toString()}` : pathname)
        })
    }

    const hasFilters = currentPeriod !== 'month' || currentProjectId || currentClientId || currentTeamId

    return (
        <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
                <select
                    value={currentPeriod}
                    onChange={(e) => push({ period: e.target.value as StatisticsPeriod })}
                    disabled={isPending}
                    className={selectClasses}
                >
                    {(Object.keys(periodLabels) as StatisticsPeriod[]).map((period) => (
                        <option key={period} value={period}>
                            {periodLabels[period]}
                        </option>
                    ))}
                </select>

                <select
                    value={currentProjectId || ''}
                    onChange={(e) => push({ projectId: e.target.value })}
                    disabled={isPending}
                    className={selectClasses}
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
                    onChange={(e) => push({ clientId: e.target.value })}
                    disabled={isPending}
                    className={selectClasses}
                >
                    <option value="">Tous les clients</option>
                    {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                            {client.name}
                        </option>
                    ))}
                </select>

                <select
                    value={currentTeamId || ''}
                    onChange={(e) => push({ teamId: e.target.value })}
                    disabled={isPending}
                    className={selectClasses}
                >
                    <option value="">Toutes les équipes</option>
                    {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                            {team.name}
                        </option>
                    ))}
                </select>

                {hasFilters && (
                    <button
                        onClick={() => startTransition(() => router.push(pathname))}
                        disabled={isPending}
                        className="rounded-lg border border-sand-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-700 shadow-sm hover:bg-sand-50 disabled:opacity-50 transition-colors"
                    >
                        <X className="h-4 w-4 inline mr-1" />
                        Réinitialiser
                    </button>
                )}
            </div>

            {currentPeriod === 'custom' && (
                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-sand-200 bg-sand-50 px-3.5 py-2.5">
                    <label className="text-xs font-medium text-ink-500">Du</label>
                    <input
                        type="date"
                        value={currentFrom || ''}
                        onChange={(e) => push({ from: e.target.value })}
                        disabled={isPending}
                        className="font-data rounded-lg border border-sand-200 bg-white px-3 py-1.5 text-sm text-ink-900 shadow-sm focus:border-maroon-600 focus:outline-none focus:ring-1 focus:ring-maroon-600 disabled:opacity-50"
                    />
                    <label className="text-xs font-medium text-ink-500">Au</label>
                    <input
                        type="date"
                        value={currentTo || ''}
                        onChange={(e) => push({ to: e.target.value })}
                        disabled={isPending}
                        className="font-data rounded-lg border border-sand-200 bg-white px-3 py-1.5 text-sm text-ink-900 shadow-sm focus:border-maroon-600 focus:outline-none focus:ring-1 focus:ring-maroon-600 disabled:opacity-50"
                    />
                </div>
            )}
        </div>
    )
}
