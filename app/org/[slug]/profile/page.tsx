import { prisma } from '@/lib/prisma'
import { getCurrentUserSession } from '@/lib/rbac'
import { getMyAssignedTasks } from '@/src/services/dashboard.service'
import { ProfileForm } from '@/src/components/profile/ProfileForm'
import { ProfileSummary } from '@/src/components/profile/ProfileSummary'
import { roleLabels } from '@/src/lib/labels'
import { User } from 'lucide-react'
import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ProfilePage({ params }: PageProps) {
  const { slug: orgSlug } = await params

  const session = await getCurrentUserSession()
  if (!session) redirect('/authentication')

  const [user, myTasks] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        teams: { select: { id: true, name: true } },
        ledTeams: { select: { id: true, name: true } },
        projects: { select: { id: true, name: true, status: true } },
      },
    }),
    getMyAssignedTasks(session.organisationId, session.id),
  ])

  // Le cookie de session référence un `id` figé au moment de la connexion, jamais revalidé
  // contre la base entre-temps. Si ce compte n'existe plus (supprimé, ou base reseedée avec de
  // nouveaux identifiants), c'est une session périmée — pas une ressource introuvable : on
  // renvoie vers la connexion plutôt qu'un 404 qui ne dit pas à l'utilisateur quoi faire.
  if (!user) redirect('/authentication')

  return (
    <div className="space-y-8">
      <div className="border-b border-zinc-200/80 pb-5">
        <div className="flex items-center gap-2">
          <User className="h-6 w-6 text-zinc-700" />
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Mon profil</h1>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          {roleLabels[user.role]} — membre depuis le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
        </p>
      </div>

      <ProfileForm orgSlug={orgSlug} user={user} />

      <ProfileSummary
        teams={user.teams}
        ledTeams={user.ledTeams}
        projects={user.projects}
        myTasks={myTasks}
      />
    </div>
  )
}
