import { z } from 'zod'
import { Role } from '@/generated/enums'

export const inviteUserSchema = z.object({
    firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères.'),
    lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères.'),
    email: z.string().email('Adresse e-mail invalide.'),
    role: z.nativeEnum(Role),
})

export type InviteUserFormValues = z.infer<typeof inviteUserSchema>
