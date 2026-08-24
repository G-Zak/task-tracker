import { z } from 'zod'

export const profileSchema = z
    .object({
        firstName: z.string().trim().min(2, 'Le prénom doit contenir au moins 2 caractères'),
        lastName: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères'),
        email: z.string().trim().email('Adresse e-mail invalide'),
        currentPassword: z.string().optional().or(z.literal('')),
        newPassword: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères').optional().or(z.literal('')),
        confirmPassword: z.string().optional().or(z.literal('')),
    })
    .refine((data) => !data.newPassword || data.newPassword === data.confirmPassword, {
        message: 'Les mots de passe ne correspondent pas',
        path: ['confirmPassword'],
    })
    .refine((data) => !data.newPassword || !!data.currentPassword, {
        message: 'Veuillez indiquer votre mot de passe actuel pour le modifier',
        path: ['currentPassword'],
    })

export type ProfileFormValues = z.infer<typeof profileSchema>
