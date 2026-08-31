'use client'

import { useEffect, useState } from 'react'
import { Flag } from 'lucide-react'
import type { TaskPriority } from '@/generated/enums'
import { taskPriorityLabels, taskPriorityOptions } from '@/src/lib/labels'

interface PriorityBreakdownProps {
    tasksByPriority: Record<TaskPriority, number>
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
    CRITICAL: '#A02E2E',
    HIGH: '#8A1836',
    MEDIUM: '#2E4756',
    LOW: '#A99C94',
}

export function PriorityBreakdown({ tasksByPriority }: PriorityBreakdownProps) {
    const [revealed, setRevealed] = useState(false)
    useEffect(() => {
        const frame = requestAnimationFrame(() => setRevealed(true))
        return () => cancelAnimationFrame(frame)
    }, [])

    const total = taskPriorityOptions.reduce((sum, priority) => sum + (tasksByPriority[priority] ?? 0), 0)
    const maxValue = Math.max(1, ...taskPriorityOptions.map((priority) => tasksByPriority[priority] ?? 0))

    return (
        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-[0_1px_2px_rgba(32,22,25,0.04),0_8px_24px_-12px_rgba(32,22,25,0.12)] transition-shadow hover:shadow-[0_4px_10px_rgba(32,22,25,0.06),0_20px_40px_-16px_rgba(32,22,25,0.18)]">
            <div className="mb-4 flex items-center gap-2 text-ink-500">
                <Flag className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-wider">Tâches par priorité</span>
            </div>

            {total === 0 ? (
                <p className="text-xs italic text-sand-400">Aucune tâche sur cette période.</p>
            ) : (
                <div className="space-y-3">
                    {taskPriorityOptions.map((priority, index) => {
                        const count = tasksByPriority[priority] ?? 0
                        const percentage = (count / maxValue) * 100
                        return (
                            <div key={priority} className="grid grid-cols-[80px_1fr_28px] items-center gap-3">
                                <span className="text-[12.5px] font-medium text-ink-700">{taskPriorityLabels[priority]}</span>
                                <div className="h-[18px] overflow-hidden rounded-md bg-sand-100">
                                    <div
                                        className="h-full rounded-md transition-[width] duration-1000 ease-out"
                                        style={{
                                            width: revealed ? `${percentage}%` : '0%',
                                            backgroundColor: PRIORITY_COLORS[priority],
                                            transitionDelay: `${index * 70}ms`,
                                        }}
                                    />
                                </div>
                                <span className="font-data text-right text-[12.5px] text-ink-500">{count}</span>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
