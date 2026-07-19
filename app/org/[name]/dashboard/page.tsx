'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { logoutAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(async () => {
      const result = await logoutAction()
      if (result.success) {
        router.push('/authentication')
        router.refresh()
      }
    })
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
      <p className="text-zinc-600">Bienvenue dans votre espace organisationnel.</p>
      
      {/* ✅ shadcn/ui Button - disabled state is automatic! */}
      <Button 
        variant="destructive"
        onClick={handleLogout}
        disabled={isPending}
        className="mt-4"
      >
        {isPending ? (
          'Déconnexion en cours...'
        ) : (
          <>
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </>
        )}
      </Button>
    </div>
  )
}