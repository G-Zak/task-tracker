import { ListChecks } from 'lucide-react'
import type { TaskStatus } from '@/generated/enums'
import { taskStatusLabels, taskStatusOptions } from '@/src/lib/labels'
import { taskStatusSolidStyles } from '@/src/lib/status-colors'

interface TaskStatusBreakdownProps {
    tasksByStatus: Record<TaskStatus, number>
    totalTasks: number
    className?: string
}

export function TaskStatusBreakdown({ tasksByStatus, totalTasks, className = '' }: TaskStatusBreakdownProps) {
    return (
        <div className={`rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all ${className}`}>
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
    )
}
