'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'

import { createTask, updateTask } from '@/actions/task'
import { taskSchema, type TaskFormValues } from '@/validations/task.schema'
import { TaskPriority, TaskStatus } from '@/generated/enums'
import { taskPriorityLabels, taskPriorityOptions, taskStatusLabels, taskStatusOptions } from '@/lib/labels'
import { FormAlert, FormField, Input, Select, Textarea } from '@/components/ui/Field'
import { MemberPicker } from '@/components/ui/MemberPicker'

interface Option {
    id: string
    name: string
}

interface TaskFormProps {
    orgSlug: string
    projects: Option[]
    taskTypes: { id: string; name: string; color: string | null }[]
    members: { id: string; name: string; role: string }[]
    mode?: 'create' | 'edit'
    task?: TaskFormValues & { id: string }
    defaultProjectId?: string
    redirectTo?: string
}

export function TaskForm({
    orgSlug,
    projects,
    taskTypes,
    members,
    mode = 'create',
    task,
    defaultProjectId,
    redirectTo,
}: TaskFormProps) {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<TaskFormValues>({
        resolver: zodResolver(taskSchema),
        defaultValues: task ?? {
            title: '',
            description: '',
            status: TaskStatus.TODO,
            priority: TaskPriority.MEDIUM,
            projectId: defaultProjectId ?? '',
            taskTypeId: '',
            dueDate: '',
            assigneeIds: [], 
        },
    })

    const selectedAssignees = watch('assigneeIds') ?? []

    const onSubmit = (values: TaskFormValues) => {
        startTransition(async () => {
            setError(null)

            const result = mode === 'edit' && task 
                ? await updateTask(task.id, values, orgSlug) 
                : await createTask(values, orgSlug)

            if ('error' in result) {
                setError(result.error)
                return
            }

            if (mode === 'create') reset()

            router.refresh()

            if (redirectTo) router.push(redirectTo)
            else if (result.action === 'create') {
                router.push(`/org/${orgSlug}/tasks/${result.data.id}`)
            }
        })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && <FormAlert type="error" message={error} />}

            <FormField label="Titre de la tâche" required error={errors.title?.message}>
                <Input {...register('title')} placeholder="ex: Intégrer l'API de facturation" />
            </FormField>

            <FormField label="Description" error={errors.description?.message}>
                <Textarea {...register('description')} rows={4} placeholder="Contexte, critères d'acceptation, liens utiles..." />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Projet" required error={errors.projectId?.message}>
                    <Select {...register('projectId')}>
                        <option value="">Sélectionner un projet...</option>
                        {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                                {project.name}
                            </option>
                        ))}
                    </Select>
                </FormField>

                <FormField label="Type de tâche" error={errors.taskTypeId?.message}>
                    <Select {...register('taskTypeId')}>
                        <option value="">Aucun type</option>
                        {taskTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                                {type.name}
                            </option>
                        ))}
                    </Select>
                </FormField>

                <FormField label="Statut" error={errors.status?.message}>
                    <Select {...register('status')}>
                        {taskStatusOptions.map((status) => (
                            <option key={status} value={status}>
                                {taskStatusLabels[status]}
                            </option>
                        ))}
                    </Select>
                </FormField>

                <FormField label="Priorité" error={errors.priority?.message}>
                    <Select {...register('priority')}>
                        {taskPriorityOptions.map((priority) => (
                            <option key={priority} value={priority}>
                                {taskPriorityLabels[priority]}
                            </option>
                        ))}
                    </Select>
                </FormField>

                <FormField label="Échéance" error={errors.dueDate?.message}>
                    <Input type="date" {...register('dueDate')} />
                </FormField>

                {/* 
                <FormField label="Charge estimée (heures)" error={errors.estimatedHours?.message} hint="Laisser vide si inconnue.">
                    <Input type="number" step="0.5" min="0" {...register('estimatedHours')} placeholder="ex: 8" />
                </FormField>
                */}        
                
            </div>

            <FormField label={`Assignés (${selectedAssignees.length})`} error={errors.assigneeIds?.message}>
                <MemberPicker
                    members={members}
                    selectedIds={selectedAssignees}
                    onChange={(ids) => setValue('assigneeIds', ids, { shouldValidate: true })}
                />
            </FormField>

            <button
                type="submit"
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === 'edit' ? 'Enregistrer les modifications' : 'Créer la tâche'}
            </button>
        </form>
    )
}