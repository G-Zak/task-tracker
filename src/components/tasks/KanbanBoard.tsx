'use client'

import { useMemo, useState, useTransition } from 'react'
import { FolderKanban, Lock, Timer } from 'lucide-react'
import { updateTaskMetrics } from '@/src/actions/task'
import { TaskStatus, TaskPriority } from '@/src/generated/client'
import { taskStatusLabels, taskPriorityLabels, taskPriorityStyles } from '@/src/lib/labels'
import { taskStatusSolidStyles } from '@/src/lib/status-colors'
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
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
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
              className={`flex w-72 shrink-0 flex-col rounded-2xl border bg-zinc-50/60 p-3 transition-colors ${
                isDragTarget ? 'border-primary/40 bg-primary/5' : 'border-zinc-200/80'
              }`}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${taskStatusSolidStyles[status]}`} />
                  <h3 className="text-sm font-semibold text-zinc-800">{taskStatusLabels[status]}</h3>
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-zinc-500 border border-zinc-200">
                  {columnTasks.length}
                </span>
              </div>

              <div className="flex flex-col gap-2 min-h-[4rem]">
                {columnTasks.length === 0 && (
                  <div className="rounded-xl border border-dashed border-zinc-200 py-6 text-center text-xs text-zinc-400">
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
                      className={`rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition-shadow space-y-2 ${
                        task.editable ? 'cursor-grab active:cursor-grabbing hover:shadow-md' : 'cursor-default opacity-90'
                      } ${draggedTaskId === task.id ? 'opacity-40' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md uppercase ring-1 ring-inset ${taskPriorityStyles[task.priority]}`}
                        >
                          {taskPriorityLabels[task.priority]}
                        </span>
                        {!task.editable && <Lock className="h-3 w-3 shrink-0 text-zinc-300" />}
                      </div>

                      <p className="text-sm font-medium text-zinc-900 leading-snug">{task.title}</p>

                      {task.project && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                          <FolderKanban className="h-3.5 w-3.5 text-zinc-400" />
                          <span className="truncate">{task.project.name}</span>
                        </div>
                      )}

                      <div className={`flex items-center gap-1.5 text-xs ${elapsed ? 'font-medium text-zinc-600' : 'text-zinc-400'}`}>
                        <Timer className={`h-3.5 w-3.5 ${elapsed ? 'text-zinc-400' : 'text-zinc-300'}`} />
                        <span>{elapsed ?? 'Non démarrée'}</span>
                      </div>

                      {task.assignees.length > 0 && (
                        <div className="flex -space-x-1.5">
                          {task.assignees.map((assignee) => (
                            <div
                              key={assignee.id}
                              title={`${assignee.firstName} ${assignee.lastName}`}
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-semibold text-white ring-2 ring-white"
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
