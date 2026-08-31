'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Loader2 } from 'lucide-react'

import { registerAction } from '@/actions/auth'
import { registerSchema, RegisterFormValues } from '@/validations/register.schema'
import { Role } from '@/src/generated/enums'
import { roleLabels } from '@/src/lib/labels'
import { BrandMark } from '@/src/components/branding/BrandMark'
import { FormAlert, FormField, Input, Select } from '@/src/components/ui/Field'

const SELF_SERVICE_ROLES = [Role.USER, Role.VIEWER] as const

export default function RegisterPage() {
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const [submitted, setSubmitted] = useState(false)

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<RegisterFormValues>({
		resolver: zodResolver(registerSchema),
		defaultValues: { firstName: '', lastName: '', email: '', password: '', role: Role.USER },
	})

	const onSubmit = (values: RegisterFormValues) => {
		setError(null)
		startTransition(async () => {
			const formData = new FormData()
			formData.set('firstName', values.firstName)
			formData.set('lastName', values.lastName)
			formData.set('email', values.email)
			formData.set('password', values.password)
			formData.set('role', values.role)

			const result = await registerAction(null, formData)
			if ('error' in result && result.error) {
				setError(result.error)
				return
			}
			setSubmitted(true)
		})
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100/60 px-4 py-12">
			<div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-md">
				<div className="space-y-3 text-center">
					<div className="flex justify-center">
						<BrandMark size="lg" />
					</div>
					<div className="space-y-1">
						<h1 className="text-2xl font-bold text-zinc-900">Créer un compte</h1>
						<p className="text-sm text-zinc-500">ABA Technology — accès collaborateur ou client</p>
					</div>
				</div>

				{submitted ? (
					<div className="space-y-5">
						<div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
							<CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
							<p className="text-sm text-emerald-800">
								Votre demande a bien été envoyée. Un administrateur doit approuver votre compte avant que vous
								puissiez vous connecter — vous serez informé une fois l&apos;accès accordé.
							</p>
						</div>
						<Link
							href="/authentication"
							className="flex w-full items-center justify-center rounded-xl bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
						>
							Retour à la connexion
						</Link>
					</div>
				) : (
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						{error && <FormAlert type="error" message={error} />}

						<div className="grid gap-4 sm:grid-cols-2">
							<FormField label="Prénom" required error={errors.firstName?.message}>
								<Input {...register('firstName')} placeholder="Prénom" />
							</FormField>
							<FormField label="Nom" required error={errors.lastName?.message}>
								<Input {...register('lastName')} placeholder="Nom" />
							</FormField>
						</div>

						<FormField label="Adresse e-mail" required error={errors.email?.message}>
							<Input {...register('email')} type="email" placeholder="prenom.nom@exemple.com" />
						</FormField>

						<FormField label="Mot de passe" required error={errors.password?.message}>
							<Input {...register('password')} type="password" placeholder="8 caractères minimum" />
						</FormField>

						<FormField label="Type de compte" required error={errors.role?.message}>
							<Select {...register('role')}>
								{SELF_SERVICE_ROLES.map((role) => (
									<option key={role} value={role}>
										{roleLabels[role]}
									</option>
								))}
							</Select>
						</FormField>
						<p className="-mt-2 text-xs text-zinc-400">
							Choisissez « Observateur » si vous êtes un client suivant l&apos;avancement de vos projets.
						</p>

						<button
							type="submit"
							disabled={isPending}
							className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
						>
							{isPending && <Loader2 className="h-4 w-4 animate-spin" />}
							Envoyer ma demande
						</button>

						<p className="text-center text-xs text-zinc-500">
							Déjà un compte ?{' '}
							<Link href="/authentication" className="font-medium text-primary hover:underline">
								Se connecter
							</Link>
						</p>
					</form>
				)}
			</div>
		</div>
	)
}
