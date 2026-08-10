import { ComingSoon } from '@/src/components/ui/ComingSoon'
import { Clock } from 'lucide-react'

export default function TimesheetsPage() {
  return (
    <ComingSoon
      icon={Clock}
      title="Feuilles de temps"
      description="Le suivi du temps passé par tâche et par projet arrive prochainement."
    />
  )
}
