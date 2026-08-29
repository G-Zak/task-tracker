'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { loginAction, logoutAction } from '@/actions/auth'
import { BrandMark } from '@/src/components/branding/BrandMark'

const EXPERTISE = [
	{ label: 'IoT & Systèmes Embarqués', detail: 'Capteurs et objets connectés industriels' },
	{ label: 'Intelligence Artificielle', detail: 'Modèles prédictifs et agents autonomes' },
	{ label: 'Souveraineté Numérique', detail: 'Infrastructures hébergées et maîtrisées' },
	{ label: 'Édge Computing', detail: 'Traitement au plus près de la donnée' },
]

interface LoginFormProps {
	currentUser: { firstName: string; lastName: string; email: string; orgSlug: string } | null
}

export function LoginForm({ currentUser }: LoginFormProps) {
	const router = useRouter()
	const [state, formAction, isPending] = useActionState(loginAction, null)
	const [isLoggingOut, startLogoutTransition] = useTransition()
	const [switchingAccount, setSwitchingAccount] = useState(false)

	useEffect(() => {
		if (state && 'success' in state) {
			router.push(`/org/${state.orgSlug}/dashboard`)
			router.refresh()
		}
	}, [state, router])

	const handleLogout = () => {
		startLogoutTransition(async () => {
			await logoutAction()
			router.refresh()
		})
	}

	const showForm = !currentUser || switchingAccount

	return (
		<div className="flex min-h-screen bg-zinc-100">
			{/* Panneau de marque — masqué sur mobile */}
			<div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
				<div className="pointer-events-none absolute inset-0 opacity-20">
					<div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/20 blur-3xl" />
					<div className="absolute -bottom-32 -right-16 h-[28rem] w-[28rem] rounded-full bg-black/20 blur-3xl" />
				</div>

				<div className="relative z-10 flex items-center gap-3">
					<BrandMark size="lg" className="bg-white text-primary" />
					<div>
						<p className="text-lg font-bold leading-tight">ABA Technology</p>
						<p className="text-xs uppercase tracking-widest text-primary-foreground/70">Groupe NEXTRONIC</p>
					</div>
				</div>

				<div className="relative z-10 space-y-8">
					<h2 className="max-w-md text-3xl font-bold leading-tight">
						Des solutions technologiques sur mesure, pensées pour vos enjeux réels.
					</h2>
					<p className="max-w-md text-sm leading-relaxed text-primary-foreground/80">
						Santé, Industrie X.0, Territoires intelligents, Banque &amp; Assurance — TaskTracker pilote nos projets de
						bout en bout, de la conception à la livraison.
					</p>
					<ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						{EXPERTISE.map((item) => (
							<li key={item.label} className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
								<p className="text-sm font-semibold">{item.label}</p>
								<p className="mt-0.5 text-xs text-primary-foreground/70">{item.detail}</p>
							</li>
						))}
					</ul>
				</div>

				<p className="relative z-10 text-xs text-primary-foreground/60">
					NEXTRONIC — Recherche et développement électronique. Filiale du groupe ABA Technology.
				</p>
			</div>

			{/* Panneau de connexion */}
			<div className="flex w-full flex-1 items-center justify-center px-4 py-12 lg:w-1/2">
				<div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-md">
					<div className="space-y-3 text-center">
						<div className="mx-auto flex lg:hidden">
							<BrandMark size="lg" />
						</div>
						<div className="space-y-1">
							<h1 className="text-2xl font-bold text-zinc-900">Connexion à TaskTracker</h1>
							<p className="text-sm text-zinc-500">Entrez vos identifiants pour accéder à votre espace</p>
						</div>
					</div>

					{currentUser && !switchingAccount ? (
						<div className="space-y-4">
							<div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-center">
								<p className="text-sm text-zinc-600">
									Vous êtes déjà connecté en tant que{' '}
									<span className="font-semibold text-zinc-900">
										{currentUser.firstName} {currentUser.lastName}
									</span>{' '}
									<span className="text-zinc-400">({currentUser.email})</span>.
								</p>
							</div>

							<Link
								href={`/org/${currentUser.orgSlug}/dashboard`}
								className="flex w-full items-center justify-center rounded-xl bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
							>
								Continuer vers le tableau de bord
							</Link>

							<div className="flex items-center justify-center gap-4 text-xs">
								<button
									type="button"
									onClick={() => setSwitchingAccount(true)}
									className="font-medium text-primary hover:underline"
								>
									Se connecter avec un autre compte
								</button>
								<span className="text-zinc-300">·</span>
								<button
									type="button"
									onClick={handleLogout}
									disabled={isLoggingOut}
									className="font-medium text-zinc-500 hover:underline disabled:opacity-50"
								>
									{isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
								</button>
							</div>
						</div>
					) : null}

					{showForm && (
						<form action={formAction} className="space-y-4">
							{currentUser && (
								<p className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
									Se connecter ici remplacera votre session actuelle ({currentUser.email}).
								</p>
							)}

							{state && 'error' in state && (
							<div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">{state.error}</div>
						)}

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

							{!currentUser && (
								<div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-[11px] leading-relaxed text-zinc-500">
									<p className="mb-1 font-semibold uppercase tracking-wide text-zinc-600">Comptes de demonstration</p>
									<p>admin@abatechnology.com — administrateur</p>
									<p>manager@abatechnology.com — chef de projet</p>
									<p>lead@abatechnology.com — chef d&apos;equipe</p>
									<p>user@abatechnology.com — collaborateur</p>
									<p>viewer@abatechnology.com — observateur</p>
									<p className="mt-1">
										Mot de passe commun : <span className="font-mono font-semibold">admin1234</span>
									</p>
								</div>
							)}

							<button
								type="submit"
								disabled={isPending}
								className="w-full rounded-xl bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
							>
								{isPending ? 'Connexion en cours...' : 'Se connecter'}
							</button>

							{currentUser && (
								<button
									type="button"
									onClick={() => setSwitchingAccount(false)}
									className="w-full text-center text-xs font-medium text-zinc-500 hover:underline"
								>
									Annuler
								</button>
							)}

							{!currentUser && (
								<p className="text-center text-xs text-zinc-500">
									Pas encore de compte ?{' '}
									<Link href="/register" className="font-medium text-primary hover:underline">
										Créer un compte
									</Link>
								</p>
							)}
						</form>
					)}
				</div>
			</div>
		</div>
	)
}
