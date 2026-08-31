'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, Loader2 } from 'lucide-react'
import { clientSchema, ClientFormValues } from '@/src/validations/client.schema'
import { upsertClient } from '@/src/actions/client'
import { useState, useTransition } from 'react'
import { FormAlert, FormField, Input } from '@/src/components/ui/Field'

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-2xl border border-sand-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 border-b border-sand-100 pb-3">
        <Building2 className="h-5 w-5 text-maroon-600" />
        <h3 className="font-semibold text-ink-900">{initialData ? 'Modifier le client' : 'Nouveau client'}</h3>
      </div>

      {error && <FormAlert type="error" message={error} />}

      <FormField label="Nom de l'entreprise" required error={errors.name?.message}>
        <Input {...register('name')} placeholder="Ex: Numspot" />
      </FormField>

      <FormField label="Email de contact" error={errors.email?.message}>
        <Input {...register('email')} type="email" placeholder="contact@numspot.fr" />
      </FormField>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-maroon-600 py-2.5 text-sm font-medium text-white hover:bg-maroon-700 disabled:opacity-50 transition-colors"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPending ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </form>
  )
}
