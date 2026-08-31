import { getCurrentUserSession } from '@/src/lib/rbac'
import { getClientSummaries } from '@/src/services/client.service'
import { ClientCreateModal } from '@/src/components/clients/ClientCreateModal'
import { ClientFilters } from '@/src/components/clients/ClientFilters'
import { DeleteClientButton } from '@/components/clients/DeleteClientButton'
import { Pagination } from '@/src/components/ui/Pagination'
import { Role } from '@/src/generated/client'
import { Building2, FolderKanban, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ q?: string; atRisk?: string; page?: string }>
}

const VIEWER_ROLES: Role[] = [Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_LEADER]
const PAGE_SIZE = 9

export default async function ClientsPage({ params, searchParams }: PageProps) {
  const { slug: orgSlug } = await params
  const { q: searchQuery, atRisk, page: rawPage } = await searchParams

  const user = await getCurrentUserSession()
  if (!user) redirect('/authentication')
  if (!VIEWER_ROLES.includes(user.role)) redirect(`/org/${orgSlug}/dashboard`)

  const canManageClients = user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER
  const atRiskOnly = atRisk === '1'

  const allClients = await getClientSummaries(user.organisationId, searchQuery)

  const filteredClients = atRiskOnly
    ? allClients.filter((client) => client.overdueProjectCount > 0).sort((a, b) => b.overdueProjectCount - a.overdueProjectCount)
    : allClients

  const currentPage = Math.max(1, Number(rawPage) || 1)
  const totalPages = Math.max(1, Math.ceil(filteredClients.length / PAGE_SIZE))
  const clients = filteredClients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* En-tête de page */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-sand-200 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-maroon-100 text-maroon-700">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-heading text-[22px] font-bold tracking-tight text-ink-900">Clients &amp; Partenaires</h1>
            <p className="mt-0.5 text-[12.5px] text-ink-500">
              Portefeuille des comptes commanditaires et suivi des partenariats.
            </p>
          </div>
        </div>

        {canManageClients && <ClientCreateModal orgSlug={orgSlug} />}
      </div>

      <div className="space-y-4">
        <ClientFilters currentSearch={searchQuery} atRiskOnly={atRiskOnly} />

        <div className="font-data flex items-center justify-between px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            Comptes enregistrés ({filteredClients.length})
          </span>
        </div>

        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-sand-200 bg-white p-12 text-center shadow-sm">
            <div className="rounded-full bg-sand-100 p-3 text-ink-500 mb-3">
              {atRiskOnly ? <ShieldAlert className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
            </div>
            <h3 className="font-semibold text-ink-900">
              {atRiskOnly ? 'Aucun client à risque' : 'Aucun client trouvé'}
            </h3>
            <p className="mt-1 text-sm text-ink-500 max-w-sm">
              {atRiskOnly
                ? "Aucun client n'a de projet en retard pour le moment."
                : searchQuery
                  ? `Aucun résultat ne correspond à la recherche "${searchQuery}".`
                  : !canManageClients
                    ? "Aucun client n'est encore enregistré pour cette organisation."
                    : "Aucun client n'est encore enregistré — créez le premier avec le bouton ci-dessus."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
            {clients.map((client) => (
              <div
                key={client.id}
                className="group relative flex flex-col rounded-2xl border border-sand-200 bg-white p-5 shadow-[0_1px_2px_rgba(32,22,25,0.04),0_8px_24px_-12px_rgba(32,22,25,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_10px_rgba(32,22,25,0.06),0_20px_40px_-16px_rgba(32,22,25,0.18)]"
              >
                {canManageClients && (
                  <div className="absolute right-4 top-4">
                    <DeleteClientButton
                      clientId={client.id}
                      clientName={client.name}
                      orgSlug={orgSlug}
                      hasProjects={client.projectCount > 0}
                    />
                  </div>
                )}

                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="font-data flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-steel-100 font-semibold text-steel-700 group-hover:bg-maroon-600 group-hover:text-white transition-colors">
                    {client.name.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0 space-y-1 pr-6">
                    <Link href={`/org/${orgSlug}/clients/${client.id}`} className="hover:underline">
                      <h3 className="font-semibold text-ink-900 leading-snug">{client.name}</h3>
                    </Link>
                    {client.email && <p className="text-xs text-ink-500 truncate">{client.email}</p>}
                  </div>
                </div>

                <div className="font-data mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 border-t border-sand-100">
                  <span className="flex items-center gap-1 text-[11px] text-ink-500">
                    <FolderKanban className="h-3 w-3 text-sand-400" />
                    {client.activeProjectCount} actif{client.activeProjectCount > 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-ink-500">
                    <CheckCircle2 className="h-3 w-3 text-sand-400" />
                    {client.completedProjectCount} terminé{client.completedProjectCount > 1 ? 's' : ''}
                  </span>
                  {client.overdueProjectCount > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-status-critical">
                      <AlertTriangle className="h-3 w-3" />
                      {client.overdueProjectCount} en retard
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination currentPage={currentPage} totalPages={totalPages} total={filteredClients.length} />

        {!canManageClients && (
          <div className="rounded-2xl border border-status-warning-bg bg-status-warning-bg/60 p-4 text-center">
            <p className="text-xs text-status-warning">
              Seuls les Administrateurs et Chefs de Projets peuvent ajouter ou supprimer des comptes clients.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
