import { getCurrentUserSession } from '@/lib/rbac'
import { LogoutButton } from '@/components/ui/LogoutButton'
import { Role } from '@/generated/client'
import { LayoutDashboard, ShieldAlert } from 'lucide-react'

export default async function DashboardPage() {
  const user = await getCurrentUserSession()

  if (!user) {
    return <p className="p-8 text-red-500">Erreur : Session introuvable.</p>
  }

  const isAdmin = user.role === Role.ADMIN
  const isManagerOrAdmin = user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-zinc-200/80 pb-5">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-zinc-700" />
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Dashboard</h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              Espace Organisationnel — <span className="font-semibold text-zinc-700">{user.firstName} {user.lastName}</span> ({user.role})
            </p>
          </div>
        </div>

        <LogoutButton />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all">
          <h2 className="text-lg font-semibold text-zinc-900 mb-2">Suivi des Tâches</h2>
          <p className="text-zinc-600 text-sm mb-4">Consultez et gérez l'avancement des flux opérationnels.</p>

          {isManagerOrAdmin ? (
            <button className="w-full rounded-xl bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              + Ajouter une tâche technique
            </button>
          ) : (
            <p className="text-xs text-zinc-400 italic bg-zinc-50 p-2 rounded-lg border border-zinc-100">
              🔒 Mode lecture seule (Rôle : {user.role}).
            </p>
          )}
        </div>

        {isAdmin && (
          <div className="rounded-2xl border border-red-200/60 bg-red-50/50 p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="h-4 w-4 text-red-700" />
              <h2 className="text-lg font-semibold text-red-900">Administration Système</h2>
            </div>
            <p className="text-red-700 text-sm mb-4">Configuration globale de l'organisation et des membres.</p>
            <button className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">
              Gérer l'organisation
            </button>
          </div>
        )}
      </div>
    </div>
  )
}