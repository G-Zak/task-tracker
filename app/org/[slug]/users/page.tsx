import { ComingSoon } from '@/src/components/ui/ComingSoon'
import { UserCog } from 'lucide-react'

export default function UsersPage() {
  return (
    <ComingSoon
      icon={UserCog}
      title="Utilisateurs"
      description="La gestion des comptes et des rôles par un administrateur arrive prochainement."
    />
  )
}
