'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { projectSchema, ProjectFormValues } from '@/src/validations/project.schema'
import { createProject, updateProject } from '@/src/actions/project'
import { ProjectStatus } from '@/src/generated/enums'
import { FolderPlus, Loader2, CheckCircle2 } from 'lucide-react'

interface SelectOption {
  id: string
  name: string
}

interface ProjectFormProps {
  orgSlug: string
  clients: SelectOption[]
  users: { id: string; name: string; role: string }[]
  onSuccess?: () => void
  mode?: 'create' | 'edit'
  project?: ProjectFormValues & { id: string }
  redirectTo?: string
}

export function ProjectForm({
  orgSlug,
  clients,
  users,
  onSuccess,
  mode = 'create',
  project,
  redirectTo,
}: ProjectFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset} = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: project ?? {
      name: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      status: ProjectStatus.PLANNING,
      clientId: '',
      memberIds: [],
    },
  })

  const selectedMemberIds = watch('memberIds') || []

  const toggleMember = (userId: string) => {
    const current = new Set(selectedMemberIds)
    if (current.has(userId)) {
      current.delete(userId)
    } else {
      current.add(userId)
    }
    setValue('memberIds', Array.from(current), { shouldValidate: true })
  }

  const onSubmit = (data: ProjectFormValues) => {
    startTransition(async () => {
      setError(null)
      setSuccess(false)

      const res = mode === 'edit' && project
        ? await updateProject(project.id, data, orgSlug)
        : await createProject(data, orgSlug)

      if ('error' in res) {
        setError(res.error)
        return
      }

      if (mode === 'edit') {
        setSuccess(true)
        if (redirectTo) {
          setTimeout(() => router.push(redirectTo), 800)
        }
      } else {
        reset()
      }

      if (onSuccess) onSuccess()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
        <FolderPlus className="h-5 w-5 text-zinc-800" />
        <h3 className="font-semibold text-zinc-900">
          {mode === 'edit' ? 'Modifier le projet' : 'Nouveau Projet'}
        </h3>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-xs text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          Projet mis à jour avec succès.
        </div>
      )}

      {/* Nom du projet */}
      <div>
        <label className="text-xs font-semibold text-zinc-700">Nom du projet *</label>
        <input
          {...register('name')}
          placeholder="ex: Digital Twin Mining Platform"
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      {/* Client Commanditaire */}
      <div>
        <label className="text-xs font-semibold text-zinc-700">Client commanditaire *</label>
        <select
          {...register('clientId')}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
        >
          <option value="">Sélectionner un client...</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.clientId && <p className="mt-1 text-xs text-red-600">{errors.clientId.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-semibold text-zinc-700">Description</label>
        <textarea
          {...register('description')}
          rows={3}
          placeholder="Objectifs et livrables du projet..."
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
        />
      </div>

      {/* Dates de début et fin */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-zinc-700">Date de début *</label>
          <input
            type="date"
            {...register('startDate')}
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
          />
          {errors.startDate && <p className="mt-1 text-xs text-red-600">{errors.startDate.message}</p>}
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-700">Date de fin estimée</label>
          <input
            type="date"
            {...register('endDate')}
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
          />
          {errors.endDate && <p className="mt-1 text-xs text-red-600">{errors.endDate.message}</p>}
        </div>
      </div>

      {/* Statut initial (Par défaut PLANNING) */}
      <div>
        <label className="text-xs font-semibold text-zinc-700">Statut initial</label>
        <select
          {...register('status')}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
        >
          {Object.values(ProjectStatus).map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      {/* Sélection des membres de l'équipe */}
      <div>
        <label className="text-xs font-semibold text-zinc-700">
          Membres affectés * ({selectedMemberIds.length} sélectionné(s))
        </label>
        <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-zinc-200 p-2 divide-y divide-zinc-100">
          {users.map((u) => {
            const isChecked = selectedMemberIds.includes(u.id)
            return (
              <label
                key={u.id}
                className="flex cursor-pointer items-center justify-between py-2 px-2 hover:bg-zinc-50 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-xs font-medium text-zinc-900">{u.name}</p>
                  <p className="text-[10px] text-zinc-400 capitalize">{u.role}</p>
                </div>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleMember(u.id)}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                />
              </label>
            )
          })}
        </div>
        {errors.memberIds && <p className="mt-1 text-xs text-red-600">{errors.memberIds.message}</p>}
      </div>

      {/* Bouton de soumission */}
      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {mode === 'edit' ? 'Enregistrement...' : 'Création du projet...'}
          </>
        ) : mode === 'edit' ? (
          'Enregistrer les modifications'
        ) : (
          'Créer le projet'
        )}
      </button>
    </form>
  )
}