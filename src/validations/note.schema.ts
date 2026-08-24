import { z } from 'zod'

export const noteSchema = z.object({
    content: z.string().trim().min(1, 'Le message ne peut pas être vide').max(2000, 'Message trop long (2000 caractères max)'),
})

export type NoteFormValues = z.infer<typeof noteSchema>
