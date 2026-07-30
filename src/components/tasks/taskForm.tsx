'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { taskSchema, TaskFormValues } from '@/src/validations/task.schema'
import { createTask } from '@/src/actions/task'
import { TaskStatus, TaskPriority } from '@/src/generated/enums'
import { CheckSquare, Loader2 } from 'lucide-react'

interface SelectOption {
  id: string
  name: string
}

interface TaskFormProps {
  orgSlug: string
  projects: SelectOption[]
  taskTypes: SelectOption[]
  defaultProjectId?: string
  onSuccess?: () => void
}

export function TaskForm({ orgSlug, projects, taskTypes, defaultProjectId = '', onSuccess }: TaskFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, formState: { errors }, reset } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      projectId: defaultProjectId,
      taskTypeId: taskTypes.length > 0 ? taskTypes[0].id : '',
    },
  })

  const onSubmit = (data: TaskFormValues) => {
    startTransition(async () => {
      setError(null)
      const res = await createTask(data, orgSlug)

      if (res.error) {
        setError(res.error)
      } else {
        reset()
        if (onSuccess) onSuccess()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
        <CheckSquare className="h-5 w-5 text-zinc-800" />
        <h3 className="font-semibold text-zinc-900">Nouvelle Tâche</h3>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          {error}
        </div>
      )}

      <div>
        <label className="text-xs font-semibold text-zinc-700">Titre de la tâche *</label>
        <input
          {...register('title')}
          placeholder="ex: Configurer le serveur de base de données"
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
        />
        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-zinc-700">Projet lié *</label>
          <select
            {...register('projectId')}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
          >
            <option value="">Sélectionner un projet...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {errors.projectId && <p className="mt-1 text-xs text-red-600">{errors.projectId.message}</p>}
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-700">Type de tâche</label>
          <select
            {...register('taskTypeId')}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
          >
            <option value="">Sélectionner un type...</option>
            {taskTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {errors.taskTypeId && <p className="mt-1 text-xs text-red-600">{errors.taskTypeId.message}</p>}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-zinc-700">Description</label>
        <textarea
          {...register('description')}
          rows={3}
          placeholder="Détails techniques, livrables attendus..."
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-zinc-700">Statut</label>
          <select
            {...register('status')}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
          >
            {Object.values(TaskStatus).map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-700">Priorité</label>
          <select
            {...register('priority')}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
          >
            {Object.values(TaskPriority).map((pr) => (
              <option key={pr} value={pr}>{pr}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-zinc-700">Date d'échéance</label>
        <input
          type="date"
          {...register('dueDate')}
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
        />
        {errors.dueDate && <p className="mt-1 text-xs text-red-600">{errors.dueDate.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Création de la tâche...
          </>
        ) : (
          'Ajouter la tâche'
        )}
      </button>
    </form>
  )
}
