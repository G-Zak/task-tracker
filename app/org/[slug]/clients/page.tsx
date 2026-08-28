import { getCurrentUserSession } from '@/src/lib/rbac'
import { getClientSummaries } from '@/src/services/client.service'
import { ClientForm } from '@/components/clients/ClientForm'
import { ClientFilters } from '@/src/components/clients/ClientFilters'
import { DeleteClientButton } from '@/components/clients/DeleteClientButton'
import { Role } from '@/src/generated/client'
import { Building2, FolderKanban, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ q?: string; atRisk?: string }>
}

// Même périmètre que la barre latérale (navigationConfig) pour "Clients" : ADMIN, PROJECT_MANAGER,
// TEAM_LEADER — et désormais appliqué côté serveur, pas seulement en masquant le lien du menu
// (cohérent avec la garde ajoutée sur /teams en US-035).
const VIEWER_ROLES: Role[] = [Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_LEADER]

export default async function ClientsPage({ params, searchParams }: PageProps) {
  const { slug: orgSlug } = await params
  const { q: searchQuery, atRisk } = await searchParams

  const user = await getCurrentUserSession()
  if (!user) redirect('/authentication')
  if (!VIEWER_ROLES.includes(user.role)) redirect(`/org/${orgSlug}/dashboard`)

  const canManageClients = user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER
  const atRiskOnly = atRisk === '1'

  const allClients = await getClientSummaries(user.organisationId, searchQuery)

  const clients = atRiskOnly
    ? allClients.filter((client) => client.overdueProjectCount > 0).sort((a, b) => b.overdueProjectCount - a.overdueProjectCount)
    : allClients

  return (
    <div className="space-y-8">
      {/* En-tête de page */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-zinc-700" />
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Clients & Partenaires</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Portefeuille des comptes commanditaires et suivi des partenariats.
          </p>
        </div>
      </div>

      {/* Grille principale : Liste + Formulaire */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">

        {/* Colonne Liste des Clients (2 Cols sur écran large) */}
        <div className="lg:col-span-2 space-y-4">
          <ClientFilters currentSearch={searchQuery} atRiskOnly={atRiskOnly} />

          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Comptes enregistrés ({clients.length})
            </span>
          </div>

          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm">
              <div className="rounded-full bg-zinc-100 p-3 text-zinc-500 mb-3">
                {atRiskOnly ? <ShieldAlert className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
              </div>
              <h3 className="font-semibold text-zinc-900">
                {atRiskOnly ? 'Aucun client à risque' : 'Aucun client trouvé'}
              </h3>
              <p className="mt-1 text-sm text-zinc-500 max-w-sm">
                {atRiskOnly
                  ? "Aucun client n'a de projet en retard pour le moment."
                  : searchQuery
                    ? `Aucun résultat ne correspond à la recherche "${searchQuery}".`
                    : "Aucun client n'est encore enregistré pour cette organisation."}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="group relative flex items-center justify-between rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 font-semibold text-zinc-700 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {client.name.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <Link href={`/org/${orgSlug}/clients/${client.id}`} className="hover:underline">
                        <h3 className="font-semibold text-zinc-900 leading-none truncate">{client.name}</h3>
                      </Link>
                      {client.email && <p className="text-xs text-zinc-500 truncate">{client.email}</p>}

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                        <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                          <FolderKanban className="h-3 w-3 text-zinc-400" />
                          {client.activeProjectCount} actif{client.activeProjectCount > 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                          <CheckCircle2 className="h-3 w-3 text-zinc-400" />
                          {client.completedProjectCount} terminé{client.completedProjectCount > 1 ? 's' : ''}
                        </span>
                        {client.overdueProjectCount > 0 && (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-red-600">
                            <AlertTriangle className="h-3 w-3" />
                            {client.overdueProjectCount} en retard
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {canManageClients && (
                    <DeleteClientButton
                      clientId={client.id}
                      clientName={client.name}
                      orgSlug={orgSlug}
                      hasProjects={client.projectCount > 0}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Colonne Formulaire (Sticky sur Desktop) */}
        <div className="lg:sticky lg:top-8">
          {canManageClients ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-1 shadow-sm">
              <ClientForm orgSlug={orgSlug} />
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200/60 bg-amber-50/50 p-6 text-center">
              <ShieldAlert className="mx-auto h-8 w-8 text-amber-600 mb-2" />
              <h3 className="font-medium text-amber-900 text-sm">Permissions restreintes</h3>
              <p className="mt-1 text-xs text-amber-700">
                Seuls les Administrateurs et Chefs de Projets peuvent ajouter ou supprimer des comptes clients.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
