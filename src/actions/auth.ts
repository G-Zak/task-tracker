'use server'

import { cookies } from 'next/headers'

import { validateCredentials } from '@/services/auth.service'
import { Role } from '@/generated/client'
import { authorizeRole } from '@/lib/rbac'
import { prisma } from '@/lib/validations/prisma'
import { error } from 'console'

export async function loginAction(prevState: any, formData: FormData) {
	const email = formData.get('email') as string
	const password = formData.get('password') as string

	if (!email || !password) {
		return { error: 'Veullez remplir tous les champs.' }
	}

	try {
		const user = await validateCredentials(email, password)

		if (!user) {
			return { error: 'Identifiants incorrects.' }
		}

		const cookieStore = await cookies()
		cookieStore.set('session_user', JSON.stringify(user), {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24,
			sameSite: 'strict',
			path: '/',
		})

		return { success: true, orgName: 'ABA Technplogy - NEXTRONIC' }
	} catch (error: any) {
		return { error: error.message || 'Une erreur est survenue lors de la connexion.' }
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
	} catch (error: any) {
		return { error: error.message || 'Une erreur est survenue lors de la création de la tâche.' }
	}
}