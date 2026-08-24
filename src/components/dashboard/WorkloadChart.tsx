import { Users } from 'lucide-react'
import type { MemberWorkload } from '@/src/services/dashboard.service'

interface WorkloadChartProps {
    data: MemberWorkload[]
}

export function WorkloadChart({ data }: WorkloadChartProps) {
    const maxValue = Math.max(1, ...data.map((m) => m.activeTaskCount))
    const gridFractions = [0.25, 0.5, 0.75, 1]

    return (
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-2 text-zinc-500 mb-4">
                <Users className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Charge de travail par membre</span>
            </div>

            {data.length === 0 ? (
                <p className="text-xs text-zinc-400 italic">Aucune tâche active assignée pour le moment.</p>
            ) : (
                <div className="space-y-3">
                    {data.map((member) => {
                        const percentage = (member.activeTaskCount / maxValue) * 100
                        return (
                            <div key={member.userId} title={`${member.name} — ${member.activeTaskCount} tâche(s) active(s)`}>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="font-medium text-zinc-700 truncate">{member.name}</span>
                                    <span className="text-zinc-500 tabular-nums shrink-0 ml-2">{member.activeTaskCount}</span>
                                </div>
                                <div className="relative h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                                    {gridFractions.map((fraction) => (
                                        <span
                                            key={fraction}
                                            className="absolute top-0 bottom-0 w-px bg-white/70"
                                            style={{ left: `${fraction * 100}%` }}
                                        />
                                    ))}
                                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
