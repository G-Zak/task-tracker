'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { logoutAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
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
    <Button 
      variant="destructive"
      onClick={handleLogout}
      disabled={isPending}
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
  )
}