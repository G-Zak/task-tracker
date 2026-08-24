import { FolderKanban, AlertTriangle, ListChecks } from 'lucide-react'
import type { DashboardKpis as DashboardKpisData } from '@/src/services/dashboard.service'
import { taskStatusLabels, taskStatusOptions } from '@/src/lib/labels'
import { taskStatusSolidStyles } from '@/src/lib/status-colors'

interface DashboardKpisProps {
    kpis: DashboardKpisData
    scopeLabel: string
}

export function DashboardKpis({ kpis, scopeLabel }: DashboardKpisProps) {
    const { activeProjects, overdueTasks, tasksByStatus, totalTasks } = kpis

    return (
        <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-2 text-zinc-500">
                    <FolderKanban className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Projets actifs</span>
                </div>
                <p className="mt-3 text-3xl font-bold text-zinc-900">{activeProjects}</p>
                <p className="mt-1 text-xs text-zinc-500">{scopeLabel}</p>
            </div>

            <div
                className={`rounded-2xl border p-6 shadow-sm hover:shadow-md transition-all ${
                    overdueTasks > 0
                        ? 'border-red-200/60 bg-red-50/50'
                        : 'border-zinc-200/80 bg-white'
                }`}
            >
                <div className={`flex items-center gap-2 ${overdueTasks > 0 ? 'text-red-700' : 'text-zinc-500'}`}>
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Tâches en retard</span>
                </div>
                <p className={`mt-3 text-3xl font-bold ${overdueTasks > 0 ? 'text-red-700' : 'text-zinc-900'}`}>
                    {overdueTasks}
                </p>
                <p className={`mt-1 text-xs ${overdueTasks > 0 ? 'text-red-600/80' : 'text-zinc-500'}`}>
                    Échéance dépassée, non terminées
                </p>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all lg:row-span-2">
                <div className="flex items-center gap-2 text-zinc-500">
                    <ListChecks className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Répartition des tâches</span>
                </div>

                {totalTasks === 0 ? (
                    <p className="mt-4 text-xs text-zinc-400 italic">Aucune tâche pour le moment.</p>
                ) : (
                    <ul className="mt-4 space-y-3">
                        {taskStatusOptions.map((status) => {
                            const count = tasksByStatus[status] ?? 0
                            const percentage = totalTasks === 0 ? 0 : Math.round((count / totalTasks) * 100)

                            return (
                                <li key={status} title={`${taskStatusLabels[status]} — ${count} tâche(s) (${percentage}%)`}>
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="font-medium text-zinc-700">{taskStatusLabels[status]}</span>
                                        <span className="text-zinc-500 tabular-nums">{count}</span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${taskStatusSolidStyles[status]}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>
        </div>
    )
}
