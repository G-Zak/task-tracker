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

export function MyActivityWidget({ myTasks, recentActivity, orgSummary }: MyActivityWidgetProps) {
    return (
        <div className="space-y-4">
            {orgSummary && (
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-violet-200/60 bg-violet-50/50 p-4 text-sm">
                    <ShieldAlert className="h-4 w-4 text-violet-700 shrink-0" />
                    <span className="font-semibold text-violet-900">Résumé organisation, aujourd’hui :</span>
                    <span className="text-violet-700">
                        {orgSummary.tasksUpdatedToday} tâche(s) modifiée(s) · {orgSummary.notesPostedToday} message(s) posté(s)
                    </span>
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 text-zinc-500 mb-4">
                        <CheckSquare className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Mes tâches</span>
                    </div>

                    {myTasks.length === 0 ? (
                        <p className="text-xs text-zinc-400 italic">Aucune tâche active assignée pour le moment.</p>
                    ) : (
                        <ul className="space-y-3">
                            {myTasks.map((task) => (
                                <li key={task.id} className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-zinc-900 truncate">{task.title}</p>
                                        {task.project && (
                                            <p className="flex items-center gap-1 text-xs text-zinc-500 mt-0.5">
                                                <FolderKanban className="h-3 w-3 text-zinc-400" />
                                                <span className="truncate">{task.project.name}</span>
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md uppercase ring-1 ring-inset ${taskStatusStyles[task.status] ?? 'bg-zinc-100 text-zinc-600 ring-zinc-600/10'}`}>
                                            {taskStatusLabels[task.status]}
                                        </span>
                                        {task.dueDate && (
                                            <span className="flex items-center gap-1 text-[11px] text-zinc-500">
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

                <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 text-zinc-500 mb-4">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Activité récente</span>
                    </div>

                    {recentActivity.length === 0 ? (
                        <p className="text-xs text-zinc-400 italic">Aucune activité récente sur vos projets.</p>
                    ) : (
                        <ul className="space-y-3">
                            {recentActivity.map((item) => (
                                <li key={`${item.type}-${item.id}`} className="flex items-start gap-2.5">
                                    <div className="mt-0.5 shrink-0 rounded-md bg-zinc-100 p-1.5">
                                        {item.type === 'task' ? (
                                            <CheckSquare className="h-3 w-3 text-zinc-600" />
                                        ) : (
                                            <MessageSquare className="h-3 w-3 text-zinc-600" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        {item.type === 'task' ? (
                                            <p className="text-sm text-zinc-700">
                                                Tâche <span className="font-medium text-zinc-900">{item.title}</span> mise à jour
                                                {item.status && <> — {taskStatusLabels[item.status]}</>}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-zinc-700">
                                                <span className="font-medium text-zinc-900">{item.authorName ?? 'Utilisateur'}</span> a
                                                {' '}posté un message : <span className="italic">« {item.content} »</span>
                                            </p>
                                        )}
                                        <p className="text-[11px] text-zinc-400 mt-0.5">
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
