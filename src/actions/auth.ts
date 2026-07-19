'use server'

import { cookies } from 'next/headers'

import { validateCredentials } from '../services/auth.service'

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
	} catch (error) {
		return { error: 'Une erreur est survenue lors de la connexion.' }
	}
}


export async function logoutAction() {
	const cookieStore = await cookies()

	cookieStore.delete('session_user')
	
	return { success: true }
}