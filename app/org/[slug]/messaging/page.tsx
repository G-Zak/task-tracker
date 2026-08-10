import { ComingSoon } from '@/src/components/ui/ComingSoon'
import { MessageSquare } from 'lucide-react'

export default function MessagingPage() {
  return (
    <ComingSoon
      icon={MessageSquare}
      title="Messagerie"
      description="La messagerie interne entre membres de l'organisation arrive prochainement."
    />
  )
}
