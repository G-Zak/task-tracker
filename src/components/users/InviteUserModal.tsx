'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X, Loader2, UserPlus, Copy, Check, CheckCircle2 } from 'lucide-react'

import { inviteUser } from '@/src/actions/user'
import { inviteUserSchema, InviteUserFormValues } from '@/src/validations/user.schema'
import { Role } from '@/src/generated/enums'
import { roleLabels } from '@/src/lib/labels'
import { FormAlert, FormField, Input, Select } from '@/src/components/ui/Field'

interface InviteUserModalProps {
    orgSlug: string
}

export function InviteUserModal({ orgSlug }: InviteUserModalProps) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const [created, setCreated] = useState<{ email: string; temporaryPassword: string } | null>(null)
    const [copied, setCopied] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<InviteUserFormValues>({
        resolver: zodResolver(inviteUserSchema),
        defaultValues: { firstName: '', lastName: '', email: '', role: Role.USER },
    })

    const close = () => {
        setIsOpen(false)
        setError(null)
        setCreated(null)
        setCopied(false)
        reset()
        if (created) router.refresh()
    }

    const onSubmit = (values: InviteUserFormValues) => {
        startTransition(async () => {
            setError(null)
            const result = await inviteUser(values, orgSlug)

            if ('error' in result) {
                setError(result.error)
                return
            }

            setCreated({ email: values.email, temporaryPassword: result.temporaryPassword })
        })
    }

    const copyPassword = async () => {
        if (!created) return
        await navigator.clipboard.writeText(created.temporaryPassword)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
                <Plus className="h-4 w-4" />
                Inviter un utilisateur
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="relative max-w-lg w-full max-h-[85vh] overflow-y-auto">
                        <button
                            type="button"
                            onClick={close}
                            className="absolute right-3 top-3 z-10 rounded-lg bg-white p-1.5 shadow-sm hover:bg-zinc-100"
                        >
                            <X className="h-5 w-5 text-zinc-500" />
                        </button>

                        {created ? (
                            <div className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                                <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                    <h3 className="font-semibold text-zinc-900">Compte créé</h3>
                                </div>

                                <p className="text-sm text-zinc-600">
                                    Communiquez ce mot de passe temporaire à <strong>{created.email}</strong> — il ne sera plus
                                    affiché après la fermeture de cette fenêtre. L&apos;envoi d&apos;un e-mail automatique n&apos;est
                                    pas encore disponible.
                                </p>

                                <div className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5">
                                    <code className="text-sm font-semibold tracking-wide text-zinc-900">{created.temporaryPassword}</code>
                                    <button
                                        type="button"
                                        onClick={copyPassword}
                                        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
                                    >
                                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                        {copied ? 'Copié' : 'Copier'}
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={close}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                                >
                                    Terminer
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                                <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
                                    <UserPlus className="h-5 w-5 text-zinc-800" />
                                    <h3 className="font-semibold text-zinc-900">Inviter un utilisateur</h3>
                                </div>

                                {error && <FormAlert type="error" message={error} />}

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField label="Prénom" required error={errors.firstName?.message}>
                                        <Input {...register('firstName')} placeholder="Yassine" />
                                    </FormField>
                                    <FormField label="Nom" required error={errors.lastName?.message}>
                                        <Input {...register('lastName')} placeholder="El Amrani" />
                                    </FormField>
                                </div>

                                <FormField label="Adresse e-mail" required error={errors.email?.message}>
                                    <Input {...register('email')} type="email" placeholder="prenom.nom@abatechnology.com" />
                                </FormField>

                                <FormField label="Rôle" required error={errors.role?.message}>
                                    <Select {...register('role')}>
                                        {Object.values(Role).map((role) => (
                                            <option key={role} value={role}>
                                                {roleLabels[role]}
                                            </option>
                                        ))}
                                    </Select>
                                </FormField>

                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                >
                                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Créer le compte
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
