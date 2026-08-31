'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { BrandMark } from '@/src/components/branding/BrandMark'

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	useEffect(() => {
		console.error('[error boundary]', error)
	}, [error])

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100/60 px-4">
			<div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-200/80 bg-white p-8 text-center shadow-md">
				<div className="mx-auto flex">
					<BrandMark size="lg" />
				</div>
				<div className="space-y-2">
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
						<AlertTriangle className="h-6 w-6 text-red-600" />
					</div>
					<h1 className="text-2xl font-bold text-zinc-900">Une erreur est survenue</h1>
					<p className="text-sm text-zinc-500">
						Quelque chose s&apos;est mal passé de notre côté. Vous pouvez réessayer, ou revenir à l&apos;accueil si le
						problème persiste.
					</p>
				</div>
				<div className="flex items-center justify-center gap-3">
					<button
						onClick={reset}
						className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
					>
						Réessayer
					</button>
					<a
						href="/authentication"
						className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
					>
						Accueil
					</a>
				</div>
			</div>
		</div>
	)
}
