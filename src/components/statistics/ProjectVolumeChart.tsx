'use client'

import { useEffect, useRef } from 'react'
import { BarChart3 } from 'lucide-react'
import type { ProjectVolumeStat } from '@/src/services/statistics.service'

interface ProjectVolumeChartProps {
    data: ProjectVolumeStat[]
}

export function ProjectVolumeChart({ data }: ProjectVolumeChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const items = data.slice(0, 8)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || items.length === 0) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const dpr = window.devicePixelRatio || 1
        const width = canvas.clientWidth
        const height = canvas.clientHeight
        canvas.width = width * dpr
        canvas.height = height * dpr
        ctx.scale(dpr, dpr)

        const max = Math.max(...items.map((item) => item.count))
        const padLeft = 8
        const padBottom = 34
        const slotWidth = (width - padLeft * 2) / items.length
        const barWidth = Math.min(52, slotWidth - 18)
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const duration = reduceMotion ? 0 : 650
        const start = performance.now()
        let frame: number

        function draw(progress: number) {
            ctx!.clearRect(0, 0, width, height)
            items.forEach((item, index) => {
                const x = padLeft + index * slotWidth + (slotWidth - barWidth) / 2
                const barHeight = (item.count / max) * (height - padBottom - 22) * progress

                ctx!.beginPath()
                ctx!.roundRect(x, height - padBottom - barHeight, barWidth, barHeight, 5)
                ctx!.fillStyle = index === 0 ? '#8A1836' : '#2E4756'
                ctx!.fill()

                ctx!.fillStyle = '#201619'
                ctx!.font = "600 12px 'IBM Plex Mono', ui-monospace, monospace"
                ctx!.textAlign = 'center'
                if (progress > 0.85) ctx!.fillText(String(item.count), x + barWidth / 2, height - padBottom - barHeight - 8)

                ctx!.font = '500 10px Inter, sans-serif'
                ctx!.fillStyle = '#6E5B62'
                const label = item.name.length > 14 ? `${item.name.slice(0, 13)}…` : item.name
                ctx!.fillText(label, x + barWidth / 2, height - padBottom + 16)
            })
        }

        function step(timestamp: number) {
            const elapsed = timestamp - start
            const progress = duration === 0 ? 1 : Math.min(1, elapsed / duration)
            draw(1 - Math.pow(1 - progress, 3))
            if (progress < 1) frame = requestAnimationFrame(step)
        }
        frame = requestAnimationFrame(step)

        return () => cancelAnimationFrame(frame)
    }, [items])

    return (
        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-[0_1px_2px_rgba(32,22,25,0.04),0_8px_24px_-12px_rgba(32,22,25,0.12)] transition-shadow hover:shadow-[0_4px_10px_rgba(32,22,25,0.06),0_20px_40px_-16px_rgba(32,22,25,0.18)]">
            <div className="mb-4 flex items-center gap-2 text-ink-500">
                <BarChart3 className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-wider">Volume par projet</span>
            </div>

            {items.length === 0 ? (
                <p className="text-xs italic text-sand-400">Aucune tâche sur cette période.</p>
            ) : (
                <canvas ref={canvasRef} style={{ width: '100%', height: 200 }} />
            )}
        </div>
    )
}
