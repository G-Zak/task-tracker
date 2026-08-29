'use server'

import { cookies } from 'next/headers'

import { validateCredentials, registerAccount } from '@/services/auth.service'
import { registerSchema } from '@/validations/register.schema'
import { Role } from '@/generated/client'
import { authorizeRole } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import { encodeSession } from '@/lib/session'
import { isRateLimited, recordFailedAttempt, clearAttempts } from '@/lib/rate-limit'
import { catchActionError } from '@/lib/action-error'

export async function loginAction(prevState: any, formData: FormData) {
	const email = formData.get('email') as string
	const password = formData.get('password') as string

	if (!email || !password) {
		return { error: 'Veullez remplir tous les champs.' }
	}

	const rateLimitKey = email.toLowerCase().trim()
	if (isRateLimited(rateLimitKey)) {
		return { error: 'Trop de tentatives de connexion pour ce compte. Réessayez dans quelques minutes.' }
	}

	try {
		const user = await validateCredentials(email, password)

		if (!user) {
			recordFailedAttempt(rateLimitKey)
			return { error: 'Identifiants incorrects.' }
		}

		clearAttempts(rateLimitKey)

		const cookieStore = await cookies()
		cookieStore.set('session_user', encodeSession({
			id: user.id,
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email,
			role: user.role,
			organisationId: user.organisationId,
		}), {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24,
			sameSite: 'strict',
			path: '/',
		})

		// Dérivé de l'organisation réelle plutôt qu'une valeur figée : la seule organisation créée
		// par le seed s'appelle désormais "ABA Technology" (voir prisma/seed.ts), pas la chaîne
		// historique codée en dur ici.
		const organisation = await prisma.organisation.findUnique({ where: { id: user.organisationId } })

		return { success: true, orgSlug: organisation?.name ?? user.organisationId }
	} catch (error) {
		return catchActionError(error, 'Une erreur est survenue lors de la connexion.')
	}
}

export async function registerAction(prevState: any, formData: FormData) {
	const parsed = registerSchema.safeParse({
		firstName: formData.get('firstName'),
		lastName: formData.get('lastName'),
		email: formData.get('email'),
		password: formData.get('password'),
		role: formData.get('role'),
	})

	if (!parsed.success) {
		return { error: parsed.error.issues[0]?.message || 'Données invalides.' }
	}

	try {
		await registerAccount(parsed.data)
		return { success: true }
	} catch (error) {
		return catchActionError(error, "Une erreur est survenue lors de l'inscription.")
	}
}


export async function logoutAction() {
	const cookieStore = await cookies()

	cookieStore.delete('session_user')
	
	return { success: true }
}


export async function createTaskAction(formData: FormData) {
	try{
		const user = await authorizeRole(Role.PROJECT_MANAGER)

		const title = formData.get('title') as string
		const projectId = formData.get('projectId') as string
		const taskTypeId = formData.get('taskTypeId') as string

		if(!title || !projectId || !taskTypeId){
			return {error: 'Veuillez remplir tous les champs.'}
		}

		const newTask = await prisma.task.create({
			data: {
				title,
				status: 'TODO',
				priority: 'MEDIUM',
				projectId,
				taskTypeId,
				organisationId: user.organisationId,
			}
		})

		return { success: true, task: newTask }
	} catch (error) {
		return catchActionError(error, 'Une erreur est survenue lors de la création de la tâche.')
	}
}