import { getCurrentUserSession } from '@/lib/rbac'
import { LogoutButton } from '@/components/ui/LogoutButton'
import { Role } from '@/generated/client'

export default async function DashboardPage() {
  const user = await getCurrentUserSession()

  if (!user) {
    return <p className="p-8 text-red-500">Erreur : Session introuvable.</p>
  }

  const isAdmin = user.role === Role.ADMIN
  const isManagerOrAdmin = user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
          <p className="text-sm text-zinc-500">
            Espace Organisationnel — <span className="font-semibold text-zinc-700">{user.firstName} {user.lastName}</span> ({user.role})
          </p>
        </div>
        
        <LogoutButton />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900 mb-2">Suivi des Tâches</h2>
          <p className="text-zinc-600 text-sm mb-4">Consultez et gérez l'avancement des flux opérationnels.</p>
          
          {isManagerOrAdmin ? (
            <button className="w-full rounded-lg bg-zinc-950 py-2 text-sm font-medium text-white hover:bg-zinc-800">
              + Ajouter une tâche technique
            </button>
          ) : (
            <p className="text-xs text-zinc-400 italic bg-zinc-50 p-2 rounded border border-zinc-100">
              🔒 Mode lecture seule (Rôle : {user.role}).
            </p>
          )}
        </div>

        {isAdmin && (
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Administration Système</h2>
            <p className="text-red-700 text-sm mb-4">Configuration globale de l'organisation et des membres.</p>
            <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
              Gérer l'organisation
            </button>
          </div>
        )}
      </div>
    </div>
  )
}