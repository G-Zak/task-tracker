'use client'

import { useState, useTransition } from 'react'
import { Loader2, Lock } from 'lucide-react'

import { updateTaskMetrics } from '@/actions/task'
import { TaskStatus, TaskPriority } from '@/generated/enums'
import { taskStatusLabels, taskStatusOptions, taskPriorityLabels, taskPriorityOptions } from '@/lib/labels'
import { taskPriorityStyles } from '@/lib/status-colors'
import { FormAlert, Label, Select } from '@/components/ui/Field'

interface TaskQuickEditProps {
    taskId: string
    orgSlug: string
    currentStatus: TaskStatus
    currentPriority: TaskPriority
    currentProgress: number
    canEditPriority: boolean
}

export function TaskQuickEdit({ taskId, orgSlug, currentStatus, currentPriority, currentProgress, canEditPriority }: TaskQuickEditProps) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [progress, setProgress] = useState(currentProgress)

    const handleUpdate = (field: 'status' | 'priority' | 'progress', value: string | number) => {
        setError(null)

        startTransition(async () => {
            const res = await updateTaskMetrics({ taskId, [field]: value }, orgSlug)

            if ('error' in res) {
                setError(res.error)
            }
        })
    }

    return (
        <div className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Mise à jour rapide</h4>
                {isPending && <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />}
            </div>

            {error && <FormAlert type="error" message={error} />}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <Label>Statut</Label>
                    <div className="mt-1">
                        <Select
                            disabled={isPending}
                            defaultValue={currentStatus}
                            onChange={(e) => handleUpdate('status', e.target.value)}
                        >
                            {taskStatusOptions.map((status) => (
                                <option key={status} value={status}>
                                    {taskStatusLabels[status]}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>

                <div>
                    <Label>Priorité</Label>
                    <div className="mt-1">
                        {canEditPriority ? (
                            <Select
                                disabled={isPending}
                                defaultValue={currentPriority}
                                onChange={(e) => handleUpdate('priority', e.target.value)}
                            >
                                {taskPriorityOptions.map((priority) => (
                                    <option key={priority} value={priority}>
                                        {taskPriorityLabels[priority]}
                                    </option>
                                ))}
                            </Select>
                        ) : (
                            <div
                                className={`flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm ring-1 ring-inset ${taskPriorityStyles[currentPriority] ?? ''}`}
                                title="Seuls les administrateurs et chefs de projet peuvent modifier la priorité."
                            >
                                <Lock className="h-3.5 w-3.5 shrink-0 opacity-60" />
                                {taskPriorityLabels[currentPriority]}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                    <Label>Progression</Label>
                    <span className="text-xs font-semibold text-zinc-700">{progress}%</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progress}
                    disabled={isPending}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    onMouseUp={(e) => handleUpdate('progress', Number(e.currentTarget.value))}
                    onTouchEnd={(e) => handleUpdate('progress', Number(e.currentTarget.value))}
                    className="w-full accent-zinc-900 disabled:opacity-50"
                />
            </div>
        </div>
    )
}
