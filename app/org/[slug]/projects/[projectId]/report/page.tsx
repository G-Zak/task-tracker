import { prisma } from '@/lib/prisma'
import { getCurrentUserSession } from '@/src/lib/rbac'
import { Role } from '@/src/generated/client'
import { ProjectReportView } from '@/src/components/reports/ProjectReportView'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ slug: string; projectId: string }>
}

export default async function ProjectReportPage({ params }: PageProps) {
  const { slug: orgSlug, projectId } = await params

  const user = await getCurrentUserSession()
  if (!user) redirect('/authentication')
  // Même acteur que le critère d'acceptation ("ADMIN ou PROJECT_MANAGER") — cohérent avec la
  // garde déjà appliquée à l'action de génération elle-même, pas seulement côté serveur silencieux.
  if (user.role !== Role.ADMIN && user.role !== Role.PROJECT_MANAGER) redirect(`/org/${orgSlug}/dashboard`)

  const project = await prisma.project.findFirst({
    where: { id: projectId, organisationId: user.organisationId },
    select: { id: true, name: true },
  })
  if (!project) notFound()

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 border-b border-zinc-200/80 pb-5">
        <Link
          href={`/org/${orgSlug}/projects/${projectId}`}
          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-zinc-700" />
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Rapport IA — {project.name}</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Synthèse d&apos;avancement, de risques et de recommandations, générée à la demande.
          </p>
        </div>
      </div>

      <ProjectReportView projectId={project.id} projectName={project.name} />
    </div>
  )
}
