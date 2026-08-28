import type { TeamStatus } from '@/src/services/team.service'

export const teamStatusLabels: Record<TeamStatus, string> = {
    overdue: 'En retard',
    active: 'Active',
    idle: 'Sans activité',
    empty: 'Sans membre',
}

export const teamStatusStyles: Record<TeamStatus, string> = {
    overdue: 'bg-red-50 text-red-700 ring-red-600/20',
    active: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    idle: 'bg-zinc-100 text-zinc-500 ring-zinc-600/10',
    empty: 'bg-zinc-50 text-zinc-400 ring-zinc-600/10',
}
