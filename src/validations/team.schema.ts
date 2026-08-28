import { z } from 'zod'

export const teamSchema = z.object({
    name: z.string().min(2, "Le nom de l'équipe doit contenir au moins 2 caractères."),
    description: z.string().max(2000, 'Description trop longue.').optional(),
    leaderId: z.string().optional(),
    memberIds: z.array(z.string()).optional(),
})

export type TeamFormValues = z.infer<typeof teamSchema>
