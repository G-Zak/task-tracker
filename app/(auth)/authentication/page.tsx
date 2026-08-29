import { prisma } from '@/lib/prisma'
import { getCurrentUserSession } from '@/src/lib/rbac'
import { LoginForm } from '@/src/components/auth/LoginForm'

export default async function AuthenticationPage() {
	const session = await getCurrentUserSession()

	let currentUser: { firstName: string; lastName: string; email: string; orgSlug: string } | null = null
	if (session?.id) {
		const organisation = await prisma.organisation.findUnique({ where: { id: session.organisationId } })
		currentUser = {
			firstName: session.firstName,
			lastName: session.lastName,
			email: session.email,
			orgSlug: organisation?.name ?? session.organisationId,
		}
	}

	return <LoginForm currentUser={currentUser} />
}
