'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { loginAction } from '@/actions/auth'

export default function AuthenticationPage() {
	const router = useRouter()
	const [state, formAction, isPending] = useActionState(loginAction, null)

	useEffect(() => {
		if (state?.success && state.orgName) {
			router.push(`/org/${state.orgName}/dashboard`)
		}
	}, [state, router])

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100/60 px-4">
			<div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-md">
				<div className="space-y-3 text-center">
					<div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm">
						AT
					</div>
					<div className="space-y-1">
						<h1 className="text-2xl font-bold text-zinc-900">Connexion à TaskTracker</h1>
						<p className="text-sm text-zinc-500">Entrez vos identifiants pour accéder à votre espace</p>
					</div>
				</div>

				<form action={formAction} className="space-y-4">
					{state?.error && <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">{state.error}</div>}

					<div className="space-y-1">
						<label className="text-sm font-medium text-zinc-700" htmlFor="email">
							Email
						</label>
						<input
							id="email"
							name="email"
							type="email"
							required
							className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
							placeholder="admin@abatechnology.com"
						/>
					</div>

					<div className="space-y-1">
						<label className="text-sm font-medium text-zinc-700" htmlFor="password">
							Mot de passe
						</label>
						<input
							id="password"
							name="password"
							type="password"
							required
							className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
							placeholder="••••••••"
						/>
					</div>

					<div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-[11px] leading-relaxed text-zinc-500">
					<p className="mb-1 font-semibold uppercase tracking-wide text-zinc-600">Comptes de demonstration</p>
					<p>admin@abatechnology.com — administrateur</p>
					<p>manager@abatechnology.com — chef de projet</p>
					<p>lead@abatechnology.com — chef d&apos;equipe</p>
					<p>hind@abatechnology.com — collaboratrice</p>
					<p className="mt-1">
						Mot de passe commun : <span className="font-mono font-semibold">admin1234</span>
					</p>
				</div>

					<button
						type="submit"
						disabled={isPending}
						className="w-full rounded-xl bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
					>
						{isPending ? 'Connexion en cours...' : 'Se connecter'}
					</button>
				</form>
			</div>
		</div>
	)
}