import { ProjectStatus } from '@/generated/enums'
import {z} from 'zod'


export const projectSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2, 'le nom du projet doit contenir au moins 2 caractères'),
    description: z.string().optional(),
    startDate: z.string().min(1, 'La date de début est requise'),    
    endDate: z.string().min(1, 'La date de fin est requise'),
    status: z.nativeEnum(ProjectStatus),
    clientId: z.string().min(1, 'Veuillez sélectionner un client'),
    memberIds: z.array(z.string()).min(1, 'Veuillez assigner au moins un membre au projet'),

}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate)
  }
  return true
}, {
  message: 'La date de fin doit être égale ou postérieure à la date de début',
  path: ['endDate'],
})

export type ProjectFormValues = z.infer<typeof projectSchema>