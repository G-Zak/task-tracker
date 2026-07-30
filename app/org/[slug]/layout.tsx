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
  const { name: orgSlug } = await params

  if (!user || !user.role) {
    redirect('/authentication')
  }

  const filteredNavigation = navigationConfig.filter((item) =>
    item.allowedRoles.includes(user.role as Role)
  )

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100/60">
      <Sidebar items={filteredNavigation} orgSlug={orgSlug} />

      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 w-full max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  )
}
