import { prisma } from '@/lib/prisma'
import { getCurrentUserSession, canAccessProject } from '@/src/lib/rbac'
import { ProjectDiscussion } from '@/src/components/projects/ProjectDiscussion'
import { Role } from '@/src/generated/client'
import { MessageSquare, FolderKanban } from 'lucide-react'
import { projectStatusStyles } from '@/src/lib/status-colors'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ projectId?: string }>
}

export default async function MessagingPage({ params, searchParams }: PageProps) {
  const { slug: orgSlug } = await params
  const { projectId: requestedProjectId } = await searchParams

  const user = await getCurrentUserSession()
  if (!user) redirect('/authentication')

  const isManagerOrAdmin = user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER

  // Un manager voit toutes les conversations de l'organisation ; un collaborateur ne voit
  // que celles des projets dont il est membre — même règle de portée que /projects et /tasks.
  const projects = await prisma.project.findMany({
    where: {
      organisationId: user.organisationId,
      ...(isManagerOrAdmin ? {} : { members: { some: { id: user.id } } }),
    },
    select: {
      id: true,
      name: true,
      status: true,
      _count: { select: { notes: true } },
    },
    orderBy: { name: 'asc' },
  })

  const activeProjectId =
    requestedProjectId && projects.some((p) => p.id === requestedProjectId)
      ? requestedProjectId
      : projects[0]?.id

  const activeProject = activeProjectId
    ? await prisma.project.findUnique({
        where: { id: activeProjectId },
        include: { members: { select: { id: true } } },
      })
    : null

  const canAccessNotes = activeProject ? canAccessProject(user, activeProject.members.map((m) => m.id)) : false

  const notes =
    canAccessNotes && activeProjectId
      ? await prisma.projectNote.findMany({
          where: { projectId: activeProjectId },
          include: {
            author: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        })
      : []

  return (
    <div className="space-y-8">
      <div className="border-b border-zinc-200/80 pb-5">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-zinc-700" />
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Messagerie</h1>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Discussions par projet — {isManagerOrAdmin ? "toute l'organisation" : 'vos projets'}.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm">
          <MessageSquare className="h-8 w-8 text-zinc-400 mb-2" />
          <h3 className="font-semibold text-zinc-900 text-sm">Aucune conversation</h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm">
            Vous n&apos;êtes membre d&apos;aucun projet pour le moment — rejoignez ou faites-vous
            assigner un projet pour accéder à sa discussion.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
          <div className="lg:col-span-1 rounded-2xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {projects.length} conversation(s)
            </div>
            <div className="divide-y divide-zinc-100 max-h-[32rem] overflow-y-auto">
              {projects.map((project) => {
                const isActive = project.id === activeProjectId
                return (
                  <Link
                    key={project.id}
                    href={`/org/${orgSlug}/messaging?projectId=${project.id}`}
                    className={`flex items-center justify-between gap-2 px-4 py-3 transition-colors ${
                      isActive ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-50 text-zinc-900'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{project.name}</p>
                      <span
                        className={`inline-block mt-1 px-1.5 py-0.5 text-[9px] font-semibold rounded uppercase ring-1 ring-inset ${
                          isActive
                            ? 'bg-white/10 text-white ring-white/20'
                            : projectStatusStyles[project.status] ?? 'bg-zinc-100 text-zinc-600 ring-zinc-600/10'
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-semibold rounded-full px-2 py-0.5 ${
                        isActive ? 'bg-white/10 text-white' : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {project._count.notes}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="lg:col-span-2">
            {activeProject && activeProjectId ? (
              <ProjectDiscussion
                projectId={activeProjectId}
                orgSlug={orgSlug}
                notes={notes}
                canPost={canAccessNotes}
                currentUserId={user.id}
                canModerate={isManagerOrAdmin}
              />
            ) : (
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm">
                <div>
                  <FolderKanban className="h-8 w-8 text-zinc-400 mb-2 mx-auto" />
                  <p className="text-sm text-zinc-500">Sélectionnez un projet pour voir sa discussion.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
