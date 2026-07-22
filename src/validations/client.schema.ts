import {z} from 'zod'


                                    //Validation Contract
                                    
export const clientSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2, 'le nom du client doit contenir au moins 2 caractères'),
    email: z.string().email('Adresse e-mail invalide').min(1, 'Adresse e-mail est requise'),
    

})


export type ClientFormValues = z.infer<typeof clientSchema>

