import { z } from 'zod'
import { Role } from '@/generated/enums'

export const registerSchema = z.object({
    firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères.'),
    lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères.'),
    email: z.string().email('Adresse e-mail invalide.'),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
    // Inscription libre limitée à USER/VIEWER — voir SELF_SERVICE_ROLES dans auth.service.ts.
    role: z.union([z.literal(Role.USER), z.literal(Role.VIEWER)]),
})

export type RegisterFormValues = z.infer<typeof registerSchema>
