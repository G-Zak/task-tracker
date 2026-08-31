'use client'

import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'

export interface WorkloadChartItem {
    id: string
    name: string
    activeTaskCount: number
}

interface WorkloadChartProps {
    data: WorkloadChartItem[]
    title?: string
    emptyLabel?: string
}

export function WorkloadChart({
    data,
    title = 'Charge de travail par membre',
    emptyLabel = 'Aucune tâche active assignée pour le moment.',
}: WorkloadChartProps) {
    const [revealed, setRevealed] = useState(false)
    useEffect(() => {
        const frame = requestAnimationFrame(() => setRevealed(true))
        return () => cancelAnimationFrame(frame)
    }, [])

    const maxValue = Math.max(1, ...data.map((item) => item.activeTaskCount))

    return (
        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-[0_1px_2px_rgba(32,22,25,0.04),0_8px_24px_-12px_rgba(32,22,25,0.12)] transition-shadow hover:shadow-[0_4px_10px_rgba(32,22,25,0.06),0_20px_40px_-16px_rgba(32,22,25,0.18)]">
            <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-steel-100 text-steel-700 [&_svg]:h-3.5 [&_svg]:w-3.5">
                    <Users />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{title}</span>
            </div>

            {data.length === 0 ? (
                <p className="text-xs italic text-sand-400">{emptyLabel}</p>
            ) : (
                <div className="space-y-3">
                    {data.map((item, index) => {
                        const percentage = (item.activeTaskCount / maxValue) * 100
                        const isHot = item.activeTaskCount === maxValue && maxValue > 3
                        return (
                            <div
                                key={item.id}
                                title={`${item.name} — ${item.activeTaskCount} tâche(s) active(s)`}
                                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"
                            >
                                <div>
                                    <p className="truncate text-[12.5px] font-medium text-ink-700">{item.name}</p>
                                    <div className="mt-1 h-[7px] w-full overflow-hidden rounded-full bg-sand-100">
                                        <div
                                            className={`h-full rounded-full transition-[width] duration-1000 ease-out ${isHot ? 'bg-maroon-600' : 'bg-steel-600'}`}
                                            style={{
                                                width: revealed ? `${percentage}%` : '0%',
                                                transitionDelay: `${index * 60}ms`,
                                            }}
                                        />
                                    </div>
                                </div>
                                <span className="font-data w-6 shrink-0 text-right text-[12.5px] text-ink-500">{item.activeTaskCount}</span>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
