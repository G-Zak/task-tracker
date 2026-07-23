import { prisma } from '@/lib/prisma'
import { getCurrentUserSession } from '@/src/lib/rbac'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { Role } from '@/src/generated/client'
import { FolderKanban, Users, Calendar, Building2 } from 'lucide-react'
import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ name: string }>
}

export default async function ProjectsPage({ params }: PageProps) {
  const { name: orgName } = await params
  const user = await getCurrentUserSession()

  if (!user) redirect('/authentication')

  const canCreateProject = user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER

  // 1. Récupération des projets avec leurs relations
  const projects = await prisma.project.findMany({
    where: { organisationId: user.organisationId },
    include: {
      client: { select: { name: true } },
      members: { select: { id: true, firstName: true, lastName: true } },
      tasks: { select: { id: true, status: true } },
    },
    orderBy: { startDate: 'desc' },
  })

  // 2. Récupération des clients pour le select du formulaire
  const clients = await prisma.client.findMany({
    where: { organisationId: user.organisationId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  // 3. Récupération des membres de l'équipe
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
    <div className="space-y-8">
      {/* En-tête */}
      <div className="border-b border-zinc-200/80 pb-5">
        <div className="flex items-center gap-2">
          <FolderKanban className="h-6 w-6 text-zinc-700" />
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Projets</h1>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Suivi opérationnel et gestion des livrables de l'organisation.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">
        {/* Colonne Liste des Projets (2 colonnes) */}
        <div className="lg:col-span-2 space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1">
            Projets en cours ({projects.length})
          </span>

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm">
              <FolderKanban className="h-8 w-8 text-zinc-400 mb-2" />
              <h3 className="font-semibold text-zinc-900 text-sm">Aucun projet trouvé</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Commencez par créer un premier projet pour votre équipe.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-zinc-600 uppercase mb-1">
                        {project.status}
                      </span>
                      <h3 className="font-semibold text-zinc-900 text-base">{project.name}</h3>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 bg-zinc-50 px-2.5 py-1 rounded-lg border border-zinc-100">
                      <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                      <span>{project.client?.name || 'Client N/A'}</span>
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-xs text-zinc-600 line-clamp-2">{project.description}</p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                      <span>{project.startDate ? new Date(project.startDate).toLocaleDateString('fr-FR') : '—'}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-zinc-400" />
                      <span>{project.members.length} membre(s)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Colonne Formulaire de Création */}
        <div className="lg:sticky lg:top-8">
          {canCreateProject ? (
            <ProjectForm orgName={orgName} clients={clients} users={users} />
          ) : (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center text-xs text-zinc-500">
              Vous n'avez pas les privilèges suffisants pour créer des projets.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}