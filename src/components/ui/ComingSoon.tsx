import { LucideIcon } from 'lucide-react'

interface ComingSoonProps {
  icon: LucideIcon
  title: string
  description: string
}

export function ComingSoon({ icon: Icon, title, description }: ComingSoonProps) {
  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-200/80 pb-5">
        <div className="flex items-center gap-2">
          <Icon className="h-6 w-6 text-zinc-700" />
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{title}</h1>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-16 text-center shadow-sm">
        <div className="rounded-full bg-zinc-100 p-3 text-zinc-500 mb-3">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="font-semibold text-zinc-900">Bientôt disponible</h3>
        <p className="mt-1 text-sm text-zinc-500 max-w-sm">{description}</p>
      </div>
    </div>
  )
}
