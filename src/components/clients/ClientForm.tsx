'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clientSchema, ClientFormValues } from '@/src/validations/client.schema'
import { upsertClient } from '@/src/actions/client'
import { useState, useTransition } from 'react'
                        
                                  // Client Component / RHF + Zod

interface ClientFormProps {
  orgSlug: string
  initialData?: ClientFormValues | null
  onSuccess?: () => void
}

export function ClientForm({ orgSlug, initialData, onSuccess }: ClientFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: initialData || { name: '', email: '' }
  })

  const onSubmit = (data: ClientFormValues) => {
    startTransition(async () => {
      setError(null)
      const result = await upsertClient(data, orgSlug)
      
      if ('error' in result) {
        setError(result.error)
      } else {
        if (!initialData) reset() // Vide le formulaire si c'est une création
        if (onSuccess) onSuccess()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
      <h3 className="font-semibold text-zinc-900">{initialData ? 'Modifier le client' : 'Nouveau client'}</h3>

      {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}

      <div>
        <label className="text-sm font-medium text-zinc-700">Nom de l'entreprise</label>
        <input
          {...register('name')}
          className="w-full mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
          placeholder="Ex: Numspot"
        />
        {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-700">Email de contact</label>
        <input
          {...register('email')}
          type="email"
          className="w-full mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
          placeholder="contact@numspot.fr"
        />
        {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </form>
  )
}