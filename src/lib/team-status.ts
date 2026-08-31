import type { TeamStatus } from '@/src/services/team.service'

export const teamStatusLabels: Record<TeamStatus, string> = {
    overdue: 'En retard',
    active: 'Active',
    idle: 'Sans activité',
    empty: 'Sans membre',
}

export const teamStatusStyles: Record<TeamStatus, string> = {
    overdue: 'bg-status-critical-bg text-status-critical',
    active: 'bg-status-success-bg text-status-success',
    idle: 'bg-sand-100 text-ink-500',
    empty: 'bg-sand-100 text-sand-400',
}
