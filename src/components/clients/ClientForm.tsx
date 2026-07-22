'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clientSchema, ClientFormValues } from '@/src/validations/client.schema'
import { upsertClient } from '@/src/actions/client'
import { useState, useTransition } from 'react'
                        
                                  // Client Component / RHF + Zod

interface ClientFormProps {
  orgName: string
  initialData?: ClientFormValues | null
  onSuccess?: () => void
}

export function ClientForm({ orgName, initialData, onSuccess }: ClientFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: initialData || { name: '', email: '' }
  })

  const onSubmit = (data: ClientFormValues) => {
    startTransition(async () => {
      setError(null)
      const result = await upsertClient(data, orgName)
      
      if (result.error) {
        setError(result.error)
      } else {
        if (!initialData) reset() // Vide le formulaire si c'est une création
        if (onSuccess) onSuccess()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white p-4 rounded-xl border border-zinc-200">
      <h3 className="font-semibold text-zinc-900">{initialData ? 'Modifier le client' : 'Nouveau client'}</h3>
      
      {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

      <div>
        <label className="text-sm font-medium text-zinc-700">Nom de l'entreprise</label>
        <input 
          {...register('name')} 
          className="w-full mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" 
          placeholder="Ex: Numspot"
        />
        {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-700">Email de contact</label>
        <input 
          {...register('email')} 
          type="email"
          className="w-full mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" 
          placeholder="contact@numspot.fr"
        />
        {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
      </div>

      <button 
        type="submit" 
        disabled={isPending}
        className="w-full rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {isPending ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </form>
  )
}