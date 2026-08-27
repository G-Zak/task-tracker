'use client'

import { useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { X } from 'lucide-react'

import type { TimesheetGroupBy, TimesheetPeriod } from '@/src/services/timesheet.service'

const periodLabels: Record<TimesheetPeriod, string> = {
    week: '7 derniers jours',
    month: '30 derniers jours',
    quarter: '90 derniers jours',
    all: 'Toute la période',
}

const groupByLabels: Record<TimesheetGroupBy, string> = {
    user: 'Par utilisateur',
    project: 'Par projet',
}

interface TimesheetFiltersProps {
    projects: Array<{ id: string; name: string }>
    members: Array<{ id: string; name: string }>
    currentPeriod: TimesheetPeriod
    currentProjectId?: string
    currentUserId?: string
    currentGroupBy: TimesheetGroupBy
    canFilterByUser: boolean
}

export function TimesheetFilters({
    projects,
    members,
    currentPeriod,
    currentProjectId,
    currentUserId,
    currentGroupBy,
    canFilterByUser,
}: TimesheetFiltersProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [isPending, startTransition] = useTransition()

    const handleChange = (key: 'period' | 'projectId' | 'userId' | 'groupBy', value: string | undefined) => {
        const params = new URLSearchParams()

        if (key !== 'period' && currentPeriod !== 'month') params.set('period', currentPeriod)
        if (key !== 'projectId' && currentProjectId) params.set('projectId', currentProjectId)
        if (key !== 'userId' && currentUserId) params.set('userId', currentUserId)
        if (key !== 'groupBy' && currentGroupBy !== 'user') params.set('groupBy', currentGroupBy)

        if (value) params.set(key, value)

        startTransition(() => {
            router.push(params.size > 0 ? `${pathname}?${params.toString()}` : pathname)
        })
    }

    const hasFilters = currentPeriod !== 'month' || currentProjectId || currentUserId || currentGroupBy !== 'user'

    return (
        <div className="flex flex-col sm:flex-row gap-3">
            <select
                value={currentPeriod}
                onChange={(e) => handleChange('period', e.target.value)}
                disabled={isPending}
                className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-50"
            >
                {(Object.keys(periodLabels) as TimesheetPeriod[]).map((period) => (
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

            {canFilterByUser && (
                <select
                    value={currentUserId || ''}
                    onChange={(e) => handleChange('userId', e.target.value || undefined)}
                    disabled={isPending}
                    className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-50"
                >
                    <option value="">Tous les utilisateurs</option>
                    {members.map((member) => (
                        <option key={member.id} value={member.id}>
                            {member.name}
                        </option>
                    ))}
                </select>
            )}

            <select
                value={currentGroupBy}
                onChange={(e) => handleChange('groupBy', e.target.value)}
                disabled={isPending}
                className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-50"
            >
                {(Object.keys(groupByLabels) as TimesheetGroupBy[]).map((groupBy) => (
                    <option key={groupBy} value={groupBy}>
                        {groupByLabels[groupBy]}
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
