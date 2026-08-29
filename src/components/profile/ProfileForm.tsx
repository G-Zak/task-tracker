'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { updateProfile } from '@/src/actions/profile'
import { profileSchema, ProfileFormValues } from '@/src/validations/profile.schema'
import { FormAlert, FormField, Input } from '@/components/ui/Field'

interface ProfileFormProps {
    orgSlug: string
    user: {
        firstName: string
        lastName: string
        email: string
    }
}

export function ProfileForm({ orgSlug, user }: ProfileFormProps) {
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [isPending, startTransition] = useTransition()

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    })

    const onSubmit = (values: ProfileFormValues) => {
        startTransition(async () => {
            setError(null)
            setSuccess(false)

            const result = await updateProfile(values, orgSlug)

            if ('error' in result) {
                setError(result.error)
                return
            }

            setSuccess(true)
            reset({ ...values, currentPassword: '', newPassword: '', confirmPassword: '' })
            setTimeout(() => setSuccess(false), 3000)
        })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            {error && <FormAlert type="error" message={error} />}
            {success && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Profil mis à jour avec succès.
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Prénom" required error={errors.firstName?.message}>
                    <Input {...register('firstName')} placeholder="ex: Zakaria" />
                </FormField>

                <FormField label="Nom" required error={errors.lastName?.message}>
                    <Input {...register('lastName')} placeholder="ex: Guennani" />
                </FormField>
            </div>

            <FormField label="E-mail" required error={errors.email?.message}>
                <Input type="email" {...register('email')} placeholder="vous@organisation.com" />
            </FormField>

            <div className="space-y-4 border-t border-zinc-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Changer le mot de passe (facultatif)
                </p>

                <FormField label="Mot de passe actuel" error={errors.currentPassword?.message}>
                    <Input type="password" {...register('currentPassword')} placeholder="Requis pour changer de mot de passe" />
                </FormField>

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Nouveau mot de passe" error={errors.newPassword?.message}>
                        <Input type="password" {...register('newPassword')} placeholder="8 caractères minimum" />
                    </FormField>

                    <FormField label="Confirmer le mot de passe" error={errors.confirmPassword?.message}>
                        <Input type="password" {...register('confirmPassword')} />
                    </FormField>
                </div>
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Enregistrer les modifications
            </button>
        </form>
    )
}
