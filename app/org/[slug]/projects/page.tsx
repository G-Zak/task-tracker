import { prisma } from '@/lib/prisma'
import { getCurrentUserSession } from '@/src/lib/rbac'
import { ProjectCreateModal } from '@/src/components/projects/ProjectCreateModal'
import { ProjectFilters } from '@/src/components/projects/ProjectsFilters'
import { Pagination } from '@/src/components/ui/Pagination'
import { getFilteredProjects } from '@/src/services/project.service'
import { projectFilterSchema } from '@/src/validations/project.schema'
import { Role } from '@/src/generated/client'
import { ProjectStatus } from '@/src/generated/enums'
import { FolderKanban, Users, Calendar, Building2 } from 'lucide-react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { projectStatusStyles } from '@/src/lib/status-colors'
import { projectStatusLabels } from '@/src/lib/labels'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    q?: string
    status?: string
    clientId?: string
    page?: string
  }>
}

export default async function ProjectsPage({
  params,
  searchParams,
}: PageProps) {
  const { slug: orgSlug } = await params
  const rawSearchParams = await searchParams

  const user = await getCurrentUserSession()
  if (!user) redirect('/authentication')

  const canCreateProject =
    user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER

  // Parse and validate filters
  const filters = projectFilterSchema.parse({
    q: rawSearchParams.q,
    status: rawSearchParams.status,
    clientId: rawSearchParams.clientId,
    page: rawSearchParams.page || '1',
  })

  // Fetch projects with filters
  const { projects, pagination } = await getFilteredProjects(
    user.organisationId,
    {
      searchQuery: filters.q,
      status: filters.status,
      clientId: filters.clientId,
      page: filters.page,
      pageSize: 9,
    }
  )

  // Fetch clients for filter dropdown
  const clients = await prisma.client.findMany({
    where: { organisationId: user.organisationId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  // Fetch users for project form
  const rawUsers = await prisma.user.findMany({
    where: { organisationId: user.organisationId },
    select: { id: true, firstName: true, lastName: true, role: true },
  })

  const users = rawUsers.map((u) => ({
    id: u.id,
    name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Utilisateur',
    role: u.role,
  }))

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand-200 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-maroon-100 text-maroon-700">
            <FolderKanban className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-heading text-[22px] font-bold tracking-tight text-ink-900">Projets</h1>
            <p className="mt-0.5 text-[12.5px] text-ink-500">
              Suivi opérationnel et gestion des livrables de l&apos;organisation.
            </p>
          </div>
        </div>

        {canCreateProject && (
          <ProjectCreateModal orgSlug={orgSlug} clients={clients} users={users} />
        )}
      </div>

      <div className="space-y-4">
        {/* Filters */}
        <ProjectFilters
          clients={clients}
          statuses={Object.values(ProjectStatus)}
          currentStatus={filters.status}
          currentClientId={filters.clientId}
          currentSearch={filters.q}
        />

        {/* Results Count */}
        <div className="font-data text-xs font-semibold uppercase tracking-wider text-ink-500 px-1">
          {pagination.count} projet(s) trouvé(s)
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-sand-200 bg-white p-12 text-center shadow-sm">
            <FolderKanban className="h-8 w-8 text-sand-400 mb-2" />
            <h3 className="font-semibold text-ink-900 text-sm">
              Aucun projet trouvé
            </h3>
            <p className="mt-1 text-xs text-ink-500">
              {filters.q || filters.status || filters.clientId
                ? 'Aucun projet ne correspond à vos critères de recherche.'
                : 'Commencez par créer un premier projet pour votre équipe.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/org/${orgSlug}/projects/${project.id}`}
                className="flex flex-col rounded-2xl border border-sand-200 bg-white p-5 shadow-[0_1px_2px_rgba(32,22,25,0.04),0_8px_24px_-12px_rgba(32,22,25,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_10px_rgba(32,22,25,0.06),0_20px_40px_-16px_rgba(32,22,25,0.18)] space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`font-data inline-block rounded-[5px] px-2 py-1 text-[10px] font-medium ${projectStatusStyles[project.status] ?? 'bg-sand-100 text-ink-500'}`}>
                    {projectStatusLabels[project.status]}
                  </span>

                  <div className="flex items-center gap-1.5 text-[11px] text-ink-500 bg-sand-50 px-2 py-1 rounded-lg border border-sand-100 shrink-0">
                    <Building2 className="h-3 w-3 text-sand-400" />
                    <span className="truncate max-w-[9rem]">{project.client?.name || 'Client N/A'}</span>
                  </div>
                </div>

                <h3 className="font-semibold text-ink-900 text-base leading-snug">
                  {project.name}
                </h3>

                {project.description && (
                  <p className="text-xs text-ink-500 line-clamp-2 flex-1">
                    {project.description}
                  </p>
                )}

                <div className="font-data flex items-center justify-between pt-3 border-t border-sand-100 text-[11px] text-ink-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-sand-400" />
                    <span>
                      {project.startDate
                        ? new Date(project.startDate).toLocaleDateString('fr-FR')
                        : '—'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-sand-400" />
                    <span>{project.members.length} membre(s)</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={pagination.current}
          totalPages={pagination.total}
          total={pagination.count}
        />
      </div>
    </div>
  )
}
