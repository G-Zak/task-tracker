import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { BrandMark } from '@/src/components/branding/BrandMark'

// Ni error.tsx ni not-found.tsx n'existaient au niveau racine (Application-Analysis-2026-08-28.md
// §3.5) — une ressource réellement absente tombait sur l'écran par défaut de Next.js plutôt que
// sur quelque chose au visuel de l'application.
export default function NotFound() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100/60 px-4">
			<div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-200/80 bg-white p-8 text-center shadow-md">
				<div className="mx-auto flex">
					<BrandMark size="lg" />
				</div>
				<div className="space-y-2">
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
						<FileQuestion className="h-6 w-6 text-zinc-400" />
					</div>
					<h1 className="text-2xl font-bold text-zinc-900">Page introuvable</h1>
					<p className="text-sm text-zinc-500">
						Cette page n&apos;existe pas ou a été déplacée. Vérifiez l&apos;adresse ou revenez à l&apos;accueil.
					</p>
				</div>
				<Link
					href="/authentication"
					className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
				>
					Retour à l&apos;accueil
				</Link>
			</div>
		</div>
	)
}
