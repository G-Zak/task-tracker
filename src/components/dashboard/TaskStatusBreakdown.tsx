'use client'

import { useEffect, useRef } from 'react'
import { ListChecks } from 'lucide-react'
import type { TaskStatus } from '@/generated/enums'
import { taskStatusLabels, taskStatusOptions } from '@/src/lib/labels'

interface TaskStatusBreakdownProps {
    tasksByStatus: Record<TaskStatus, number>
    totalTasks: number
    className?: string
}

const DONUT_COLORS: Record<TaskStatus, string> = {
    TODO: '#93ABB8',
    IN_PROGRESS: '#8A1836',
    IN_REVIEW: '#2E4756',
    DONE: '#2E7D5B',
    BLOCKED: '#A02E2E',
    CANCELLED: '#DDD3CD',
}

export function TaskStatusBreakdown({ tasksByStatus, totalTasks, className = '' }: TaskStatusBreakdownProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const segments = taskStatusOptions
        .map((status) => ({ status, n: tasksByStatus[status] ?? 0, color: DONUT_COLORS[status] }))
        .filter((s) => s.n > 0)
        .sort((a, b) => b.n - a.n)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || totalTasks === 0) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const dpr = window.devicePixelRatio || 1
        const size = 148
        canvas.width = size * dpr
        canvas.height = size * dpr
        ctx.scale(dpr, dpr)

        const cx = size / 2
        const cy = size / 2
        const rOuter = size / 2 - 6
        const rInner = rOuter * 0.66
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const duration = reduceMotion ? 0 : 700
        const start = performance.now()
        let frame: number

        function draw(progress: number) {
            ctx!.clearRect(0, 0, size, size)
            let angle = -Math.PI / 2
            for (const segment of segments) {
                const sweep = (segment.n / totalTasks) * Math.PI * 2 * progress
                ctx!.beginPath()
                ctx!.arc(cx, cy, rOuter, angle, angle + sweep)
                ctx!.arc(cx, cy, rInner, angle + sweep, angle, true)
                ctx!.closePath()
                ctx!.fillStyle = segment.color
                ctx!.fill()
                angle += sweep
            }
            ctx!.fillStyle = '#201619'
            ctx!.font = "600 18px 'IBM Plex Mono', ui-monospace, monospace"
            ctx!.textAlign = 'center'
            ctx!.fillText(String(Math.round(totalTasks * progress)), cx, cy + 1)
            ctx!.font = "500 8px Inter, sans-serif"
            ctx!.fillStyle = '#6E5B62'
            ctx!.fillText('TÂCHES', cx, cy + 14)
        }

        function step(timestamp: number) {
            const elapsed = timestamp - start
            const progress = duration === 0 ? 1 : Math.min(1, elapsed / duration)
            draw(1 - Math.pow(1 - progress, 3))
            if (progress < 1) frame = requestAnimationFrame(step)
        }
        frame = requestAnimationFrame(step)

        return () => cancelAnimationFrame(frame)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [totalTasks, JSON.stringify(tasksByStatus)])

    return (
        <div className={`rounded-2xl border border-sand-200 bg-white p-5 shadow-[0_1px_2px_rgba(32,22,25,0.04),0_8px_24px_-12px_rgba(32,22,25,0.12)] transition-shadow hover:shadow-[0_4px_10px_rgba(32,22,25,0.06),0_20px_40px_-16px_rgba(32,22,25,0.18)] ${className}`}>
            <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-maroon-100 text-maroon-700 [&_svg]:h-3.5 [&_svg]:w-3.5">
                    <ListChecks />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Répartition des tâches</span>
            </div>

            {totalTasks === 0 ? (
                <p className="mt-4 text-xs italic text-sand-400">Aucune tâche pour le moment.</p>
            ) : (
                <div className="mt-4 flex items-center gap-5">
                    <canvas ref={canvasRef} style={{ width: 148, height: 148 }} className="shrink-0" />
                    <ul className="flex-1 space-y-2">
                        {segments.map((segment) => (
                            <li key={segment.status} className="flex items-center gap-2.5 text-[12.5px]">
                                <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: segment.color }} />
                                <span className="text-ink-700">{taskStatusLabels[segment.status]}</span>
                                <span className="font-data ml-auto font-medium text-ink-900">{segment.n}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
