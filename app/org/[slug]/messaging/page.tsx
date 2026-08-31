import { prisma } from '@/lib/prisma'
import { getCurrentUserSession, canAccessProject } from '@/src/lib/rbac'
import { ProjectDiscussion } from '@/src/components/projects/ProjectDiscussion'
import { Role } from '@/src/generated/client'
import { MessageSquare, FolderKanban } from 'lucide-react'
import { projectStatusStyles } from '@/src/lib/status-colors'
import { projectStatusLabels } from '@/src/lib/labels'
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
      <div className="flex items-center gap-2.5 border-b border-sand-200 pb-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-maroon-100 text-maroon-700">
          <MessageSquare className="h-4 w-4" />
        </div>
        <div>
          <h1 className="font-heading text-[22px] font-bold tracking-tight text-ink-900">Messagerie</h1>
          <p className="mt-0.5 text-[12.5px] text-ink-500">
            Discussions par projet — {isManagerOrAdmin ? "toute l'organisation" : 'vos projets'}.
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-sand-200 bg-white p-12 text-center shadow-sm">
          <MessageSquare className="h-8 w-8 text-sand-400 mb-2" />
          <h3 className="font-semibold text-ink-900 text-sm">Aucune conversation</h3>
          <p className="mt-1 text-xs text-ink-500 max-w-sm">
            Vous n&apos;êtes membre d&apos;aucun projet pour le moment — rejoignez ou faites-vous
            assigner un projet pour accéder à sa discussion.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
          <div className="lg:col-span-1 rounded-2xl border border-sand-200 bg-white shadow-[0_1px_2px_rgba(32,22,25,0.04)] overflow-hidden">
            <div className="px-4 py-3 border-b border-sand-100 text-xs font-semibold uppercase tracking-wider text-sand-400">
              {projects.length} conversation(s)
            </div>
            <div className="divide-y divide-sand-100 max-h-[32rem] overflow-y-auto">
              {projects.map((project) => {
                const isActive = project.id === activeProjectId
                return (
                  <Link
                    key={project.id}
                    href={`/org/${orgSlug}/messaging?projectId=${project.id}`}
                    className={`flex items-center justify-between gap-2 px-4 py-3 transition-colors ${
                      isActive ? 'bg-maroon-600 text-white' : 'hover:bg-sand-50 text-ink-900'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{project.name}</p>
                      <span
                        className={`font-data inline-block mt-1 rounded-[5px] px-1.5 py-0.5 text-[9px] font-medium ${
                          isActive
                            ? 'bg-white/15 text-white'
                            : projectStatusStyles[project.status] ?? 'bg-sand-100 text-ink-500'
                        }`}
                      >
                        {projectStatusLabels[project.status]}
                      </span>
                    </div>
                    <span
                      className={`font-data shrink-0 text-xs font-medium rounded-full px-2 py-0.5 ${
                        isActive ? 'bg-white/15 text-white' : 'bg-sand-100 text-ink-500'
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
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-sand-200 bg-white p-12 text-center shadow-sm">
                <div>
                  <FolderKanban className="h-8 w-8 text-sand-400 mb-2 mx-auto" />
                  <p className="text-sm text-ink-500">Sélectionnez un projet pour voir sa discussion.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
