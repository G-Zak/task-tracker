import { getCurrentUserSession } from '@/src/lib/rbac'
import { navigationConfig } from '@/src/config/navigation'
import { Sidebar } from '@/src/components/ui/Sidebar'
import { Role } from '@/src/generated/client'
import { prisma } from '@/lib/prisma'
import { getNextDeadline } from '@/src/services/dashboard.service'
import { redirect } from 'next/navigation'

interface OrgLayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const user = await getCurrentUserSession()
  const { slug: rawSlug } = await params
  const orgSlug = decodeURIComponent(rawSlug)

  if (!user || !user.role) {
    redirect('/authentication')
  }

  const organisation = await prisma.organisation.findUnique({ where: { id: user.organisationId } })
  const expectedSlug = organisation?.name ?? user.organisationId
  if (orgSlug !== expectedSlug) {
    redirect(`/org/${encodeURIComponent(expectedSlug)}/dashboard`)
  }

  const filteredNavigation = navigationConfig.filter((item) =>
    item.allowedRoles.includes(user.role as Role)
  )

  const nextDeadline = await getNextDeadline(user.organisationId, user.id)

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-sand-0">
      <Sidebar
        items={filteredNavigation}
        orgSlug={orgSlug}
        user={{ firstName: user.firstName, lastName: user.lastName, role: user.role as Role }}
        nextDeadline={nextDeadline}
      />

      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 w-full max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  )
}
