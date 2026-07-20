import { getCurrentUserSession } from '@/src/lib/rbac'
import { navigationConfig } from '@/src/config/navigation'
import { Sidebar } from '@/src/components/ui/Sidebar'
import { Role } from '@/src/generated/client'
import { redirect } from 'next/navigation'

interface OrgLayoutProps {
  children: React.ReactNode
  params: Promise<{ name: string }>
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const user = await getCurrentUserSession()
  const { name: orgName } = await params

  // Si pas de session valide, le middleware/proxy a dû intercepter, mais sécurité renforcée ici
  if (!user || !user.role) {
    redirect('/authentication')
  }

  // Filtrer la navigation au niveau du serveur selon le rôle de l'utilisateur
  const filteredNavigation = navigationConfig.filter((item) =>
    item.allowedRoles.includes(user.role as Role)
  )

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-zinc-50">
      {/* Injection de la Sidebar partagée */}
      <Sidebar items={filteredNavigation} orgName={orgName} />

      {/* Zone principale de rendu du contenu */}
      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 w-full max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  )
}