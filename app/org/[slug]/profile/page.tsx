import { ComingSoon } from '@/src/components/ui/ComingSoon'
import { User } from 'lucide-react'

export default function ProfilePage() {
  return (
    <ComingSoon
      icon={User}
      title="Mon profil"
      description="La gestion de votre profil (informations personnelles, mot de passe) arrive prochainement."
    />
  )
}
