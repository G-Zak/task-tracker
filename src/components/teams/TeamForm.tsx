'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Users } from 'lucide-react'

import { createTeam, updateTeam } from '@/src/actions/team'
import { teamSchema, TeamFormValues } from '@/src/validations/team.schema'
import { FormAlert, FormField, Input, Select, Textarea } from '@/src/components/ui/Field'
import { MemberPicker } from '@/src/components/ui/MemberPicker'

interface TeamFormProps {
    orgSlug: string
    members: { id: string; name: string; role: string }[]
    mode?: 'create' | 'edit'
    team?: TeamFormValues & { id: string }
    onSuccess?: () => void
}

export function TeamForm({ orgSlug, members, mode = 'create', team, onSuccess }: TeamFormProps) {
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<TeamFormValues>({
        resolver: zodResolver(teamSchema),
        defaultValues: team ?? { name: '', description: '', leaderId: '', memberIds: [] },
    })

    const selectedMemberIds = watch('memberIds') ?? []

    const onSubmit = (values: TeamFormValues) => {
        startTransition(async () => {
            setError(null)

            const result = mode === 'edit' && team ? await updateTeam(team.id, values, orgSlug) : await createTeam(values, orgSlug)

            if ('error' in result) {
                setError(result.error)
                return
            }

            if (mode === 'create') reset()
            onSuccess?.()
        })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
                <Users className="h-5 w-5 text-zinc-800" />
                <h3 className="font-semibold text-zinc-900">{mode === 'edit' ? "Modifier l'équipe" : 'Nouvelle équipe'}</h3>
            </div>

            {error && <FormAlert type="error" message={error} />}

            <FormField label="Nom de l'équipe" required error={errors.name?.message}>
                <Input {...register('name')} placeholder="ex: Équipe Infrastructure Cloud" />
            </FormField>

            <FormField label="Description" error={errors.description?.message}>
                <Textarea {...register('description')} rows={3} placeholder="Périmètre et responsabilités de l'équipe..." />
            </FormField>

            <FormField label="Chef d'équipe" hint="Automatiquement ajouté aux membres." error={errors.leaderId?.message}>
                <Select {...register('leaderId')}>
                    <option value="">Aucun chef d&apos;équipe</option>
                    {members.map((member) => (
                        <option key={member.id} value={member.id}>
                            {member.name}
                        </option>
                    ))}
                </Select>
            </FormField>

            <FormField label={`Membres (${selectedMemberIds.length})`} error={errors.memberIds?.message}>
                <MemberPicker
                    members={members}
                    selectedIds={selectedMemberIds}
                    onChange={(ids) => setValue('memberIds', ids, { shouldValidate: true })}
                />
            </FormField>

            <button
                type="submit"
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === 'edit' ? 'Enregistrer les modifications' : "Créer l'équipe"}
            </button>
        </form>
    )
}
