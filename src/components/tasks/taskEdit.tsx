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
    canEditPriority: boolean
}

export function TaskQuickEdit({ taskId, orgSlug, currentStatus, currentPriority, canEditPriority }: TaskQuickEditProps) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const handleUpdate = (field: 'status' | 'priority', value: string) => {
        setError(null)

        startTransition(async () => {
            const res = await updateTaskMetrics({ taskId, [field]: value }, orgSlug)

            if ('error' in res) {
                setError(res.error)
            }
        })
    }

    return (
        <div className="space-y-4 rounded-xl border border-sand-200 bg-sand-50 p-4">
            <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-500">Mise à jour rapide</h4>
                {isPending && <Loader2 className="h-4 w-4 animate-spin text-ink-500" />}
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
                                className={`flex items-center gap-1.5 rounded-xl border border-sand-200 px-3.5 py-2 text-sm font-medium ${taskPriorityStyles[currentPriority] ?? ''}`}
                                title="Seuls les administrateurs et chefs de projet peuvent modifier la priorité."
                            >
                                <Lock className="h-3.5 w-3.5 shrink-0 opacity-60" />
                                {taskPriorityLabels[currentPriority]}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
