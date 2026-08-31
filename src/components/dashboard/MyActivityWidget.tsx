import { CheckSquare, MessageSquare, Clock, ShieldAlert, FolderKanban } from 'lucide-react'
import type { MyTask, ActivityItem, OrgActivitySummary } from '@/src/services/dashboard.service'
import { taskStatusLabels } from '@/src/lib/labels'
import { taskStatusStyles } from '@/src/lib/status-colors'

interface MyActivityWidgetProps {
    myTasks: MyTask[]
    recentActivity: ActivityItem[]
    orgSummary: OrgActivitySummary | null
}

function formatDate(date: Date | string) {
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

function formatDateTime(date: Date | string) {
    return new Date(date).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    })
}

const panelClass =
    'rounded-2xl border border-sand-200 bg-white p-5 shadow-[0_1px_2px_rgba(32,22,25,0.04),0_8px_24px_-12px_rgba(32,22,25,0.12)] transition-shadow hover:shadow-[0_4px_10px_rgba(32,22,25,0.06),0_20px_40px_-16px_rgba(32,22,25,0.18)]'

export function MyActivityWidget({ myTasks, recentActivity, orgSummary }: MyActivityWidgetProps) {
    return (
        <div className="space-y-3.5">
            {orgSummary && (
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-maroon-100 bg-maroon-100/40 p-3.5 text-sm">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-maroon-600" />
                    <span className="font-semibold text-maroon-700">Résumé organisation, aujourd&apos;hui :</span>
                    <span className="font-data text-[13px] text-maroon-600">
                        {orgSummary.tasksUpdatedToday} tâche(s) modifiée(s) · {orgSummary.notesPostedToday} message(s) posté(s)
                    </span>
                </div>
            )}

            <div className="grid gap-3.5 lg:grid-cols-2">
                <div className={panelClass}>
                    <div className="mb-4 flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-maroon-100 text-maroon-700 [&_svg]:h-3.5 [&_svg]:w-3.5">
                            <CheckSquare />
                        </div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Mes tâches</span>
                    </div>

                    {myTasks.length === 0 ? (
                        <p className="text-xs italic text-sand-400">Aucune tâche active assignée pour le moment.</p>
                    ) : (
                        <ul className="space-y-3">
                            {myTasks.map((task) => (
                                <li key={task.id} className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-ink-900">{task.title}</p>
                                        {task.project && (
                                            <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
                                                <FolderKanban className="h-3 w-3 text-sand-400" />
                                                <span className="truncate">{task.project.name}</span>
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end gap-1">
                                        <span className={`font-data inline-block rounded-[5px] px-2 py-1 text-[10px] font-medium ${taskStatusStyles[task.status] ?? 'bg-sand-100 text-ink-500'}`}>
                                            {taskStatusLabels[task.status]}
                                        </span>
                                        {task.dueDate && (
                                            <span className="font-data flex items-center gap-1 text-[11px] text-ink-500">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(task.dueDate)}
                                            </span>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className={panelClass}>
                    <div className="mb-4 flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-steel-100 text-steel-700 [&_svg]:h-3.5 [&_svg]:w-3.5">
                            <MessageSquare />
                        </div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Activité récente</span>
                    </div>

                    {recentActivity.length === 0 ? (
                        <p className="text-xs italic text-sand-400">Aucune activité récente sur vos projets.</p>
                    ) : (
                        <ul className="space-y-3">
                            {recentActivity.map((item) => (
                                <li key={`${item.type}-${item.id}`} className="flex items-start gap-2.5">
                                    <div className="mt-0.5 shrink-0 rounded-md bg-sand-100 p-1.5">
                                        {item.type === 'task' ? (
                                            <CheckSquare className="h-3 w-3 text-steel-600" />
                                        ) : (
                                            <MessageSquare className="h-3 w-3 text-steel-600" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        {item.type === 'task' ? (
                                            <p className="text-sm text-ink-700">
                                                Tâche <span className="font-medium text-ink-900">{item.title}</span> mise à jour
                                                {item.status && <> — {taskStatusLabels[item.status]}</>}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-ink-700">
                                                <span className="font-medium text-ink-900">{item.authorName ?? 'Utilisateur'}</span> a
                                                {' '}posté un message : <span className="italic">« {item.content} »</span>
                                            </p>
                                        )}
                                        <p className="font-data mt-0.5 text-[11px] text-sand-400">
                                            {item.projectName ?? 'Projet inconnu'} · {formatDateTime(item.timestamp)}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    )
}
