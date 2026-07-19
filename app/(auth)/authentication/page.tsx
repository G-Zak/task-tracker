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
		<div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
			<div className="w-full max-w-md space-y-6 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
				<div className="space-y-2 text-center">
					<h1 className="text-2xl font-bold text-zinc-900">Connexion à TaskTracker</h1>
					<p className="text-sm text-zinc-500">Entrez vos identifiants pour accéder à votre espace</p>
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
							className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
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
							className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
							placeholder="••••••••"
						/>
					</div>

					<button
						type="submit"
						disabled={isPending}
						className="w-full rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:bg-zinc-400"
					>
						{isPending ? 'Connexion en cours...' : 'Se connecter'}
					</button>
				</form>
			</div>
		</div>
	)
}