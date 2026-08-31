'use client'

import { useMemo, useState, useTransition } from 'react'
import { FolderKanban, Lock, Timer } from 'lucide-react'
import { updateTaskMetrics } from '@/src/actions/task'
import type { TaskStatus, TaskPriority } from '@/src/generated/client'
import { taskStatusLabels, taskPriorityLabels } from '@/src/lib/labels'
import { taskStatusSolidStyles, taskPriorityStyles } from '@/src/lib/status-colors'
import { formatElapsedSince } from '@/src/lib/elapsed-time'

export interface KanbanTask {
  id: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  startedAt: Date | null
  project: { id: string; name: string } | null
  assignees: { id: string; firstName: string; lastName: string }[]
  editable: boolean
}

interface KanbanBoardProps {
  orgSlug: string
  initialTasks: KanbanTask[]
  columns: TaskStatus[]
}

export function KanbanBoard({ orgSlug, initialTasks, columns }: KanbanBoardProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const tasksByStatus = useMemo(() => {
    const grouped = new Map<TaskStatus, KanbanTask[]>()
    for (const status of columns) grouped.set(status, [])
    for (const task of tasks) grouped.get(task.status)?.push(task)
    return grouped
  }, [tasks, columns])

  const handleDrop = (status: TaskStatus) => {
    setDragOverStatus(null)
    const taskId = draggedTaskId
    setDraggedTaskId(null)
    if (!taskId) return

    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === status || !task.editable) return

    const previousStatus = task.status
    setError(null)
    setTasks((current) => current.map((t) => (t.id === taskId ? { ...t, status } : t)))

    startTransition(async () => {
      const result = await updateTaskMetrics({ taskId, status }, orgSlug)
      if ('error' in result) {
        setError(result.error)
        setTasks((current) => current.map((t) => (t.id === taskId ? { ...t, status: previousStatus } : t)))
      }
    })
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-status-critical-bg bg-status-critical-bg px-3 py-2 text-sm text-status-critical">{error}</div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((status) => {
          const columnTasks = tasksByStatus.get(status) ?? []
          const isDragTarget = dragOverStatus === status

          return (
            <div
              key={status}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverStatus(status)
              }}
              onDragLeave={() => setDragOverStatus((current) => (current === status ? null : current))}
              onDrop={(e) => {
                e.preventDefault()
                handleDrop(status)
              }}
              className={`flex w-72 shrink-0 flex-col rounded-2xl border p-3 transition-colors ${
                isDragTarget ? 'border-maroon-500/50 bg-maroon-100/40' : 'border-sand-200 bg-sand-50'
              }`}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${taskStatusSolidStyles[status]}`} />
                  <h3 className="text-sm font-semibold text-ink-700">{taskStatusLabels[status]}</h3>
                </div>
                <span className="font-data rounded-full border border-sand-200 bg-white px-2 py-0.5 text-xs font-medium text-ink-500">
                  {columnTasks.length}
                </span>
              </div>

              <div className="flex flex-col gap-2 min-h-[4rem]">
                {columnTasks.length === 0 && (
                  <div className="rounded-xl border border-dashed border-sand-200 py-6 text-center text-xs text-sand-400">
                    Aucune tâche
                  </div>
                )}

                {columnTasks.map((task) => {
                  const elapsed = formatElapsedSince(task.startedAt)

                  return (
                    <div
                      key={task.id}
                      draggable={task.editable}
                      onDragStart={() => setDraggedTaskId(task.id)}
                      onDragEnd={() => setDraggedTaskId(null)}
                      className={`rounded-xl border border-sand-200 bg-white p-3 shadow-[0_1px_2px_rgba(32,22,25,0.04)] transition-shadow space-y-2 ${
                        task.editable ? 'cursor-grab active:cursor-grabbing hover:shadow-[0_4px_10px_rgba(32,22,25,0.06),0_20px_40px_-16px_rgba(32,22,25,0.18)]' : 'cursor-default opacity-90'
                      } ${draggedTaskId === task.id ? 'opacity-40' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`font-data inline-flex items-center gap-1 rounded-[5px] px-2 py-1 text-[10px] font-medium ${taskPriorityStyles[task.priority]}`}
                        >
                          {taskPriorityLabels[task.priority]}
                        </span>
                        {!task.editable && <Lock className="h-3 w-3 shrink-0 text-sand-400" />}
                      </div>

                      <p className="text-sm font-medium text-ink-900 leading-snug">{task.title}</p>

                      {task.project && (
                        <div className="flex items-center gap-1.5 text-xs text-ink-500">
                          <FolderKanban className="h-3.5 w-3.5 text-sand-400" />
                          <span className="truncate">{task.project.name}</span>
                        </div>
                      )}

                      <div className={`font-data flex items-center gap-1.5 text-xs ${elapsed ? 'font-medium text-ink-500' : 'text-sand-400'}`}>
                        <Timer className={`h-3.5 w-3.5 ${elapsed ? 'text-sand-400' : 'text-sand-200'}`} />
                        <span>{elapsed ?? 'Non démarrée'}</span>
                      </div>

                      {task.assignees.length > 0 && (
                        <div className="flex -space-x-1.5">
                          {task.assignees.map((assignee) => (
                            <div
                              key={assignee.id}
                              title={`${assignee.firstName} ${assignee.lastName}`}
                              className="font-data flex h-6 w-6 items-center justify-center rounded-full bg-steel-600 text-[10px] font-semibold text-white ring-2 ring-white"
                            >
                              {assignee.firstName.charAt(0).toUpperCase()}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
