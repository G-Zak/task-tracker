'use client'

import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import type { WeeklyTrendPoint } from '@/src/services/dashboard.service'

interface TaskTrendChartProps {
    data: WeeklyTrendPoint[]
}

const WIDTH = 600
const HEIGHT = 200
const PADDING = { top: 16, right: 8, bottom: 22, left: 8 }
const CHART_WIDTH = WIDTH - PADDING.left - PADDING.right
const CHART_HEIGHT = HEIGHT - PADDING.top - PADDING.bottom
const BASELINE_Y = PADDING.top + CHART_HEIGHT

function formatWeekLabel(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

export function TaskTrendChart({ data }: TaskTrendChartProps) {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null)

    const maxValue = Math.max(1, ...data.map((p) => Math.max(p.created, p.completed)))
    const xStep = data.length > 1 ? CHART_WIDTH / (data.length - 1) : 0

    const xAt = (i: number) => PADDING.left + i * xStep
    const yAt = (value: number) => PADDING.top + CHART_HEIGHT - (value / maxValue) * CHART_HEIGHT

    const linePath = (values: number[]) =>
        values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)},${yAt(v)}`).join(' ')

    const createdPath = linePath(data.map((p) => p.created))
    const completedPath = linePath(data.map((p) => p.completed))
    const completedAreaPath =
        data.length > 0
            ? `${completedPath} L ${xAt(data.length - 1)},${BASELINE_Y} L ${xAt(0)},${BASELINE_Y} Z`
            : ''

    const gridLines = [0.25, 0.5, 0.75].map((fraction) => PADDING.top + CHART_HEIGHT * (1 - fraction))

    const hovered = hoverIndex !== null ? data[hoverIndex] : null

    const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
        if (data.length === 0) return
        const svg = event.currentTarget
        const rect = svg.getBoundingClientRect()
        const relativeX = ((event.clientX - rect.left) / rect.width) * WIDTH
        const index = xStep > 0 ? Math.round((relativeX - PADDING.left) / xStep) : 0
        setHoverIndex(Math.min(data.length - 1, Math.max(0, index)))
    }

    return (
        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-[0_1px_2px_rgba(32,22,25,0.04),0_8px_24px_-12px_rgba(32,22,25,0.12)] transition-shadow hover:shadow-[0_4px_10px_rgba(32,22,25,0.06),0_20px_40px_-16px_rgba(32,22,25,0.18)]">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-sand-100 text-ink-500 [&_svg]:h-3.5 [&_svg]:w-3.5">
                        <TrendingUp />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                        Tâches créées vs. terminées — 8 dernières semaines
                    </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-ink-500">
                    <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-steel-300" /> Créées
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-maroon-600" /> Terminées
                    </span>
                </div>
            </div>

            <div className="relative mt-3">
                <svg
                    viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                    className="w-full h-auto touch-none"
                    onPointerMove={handlePointerMove}
                    onPointerLeave={() => setHoverIndex(null)}
                >
                    {gridLines.map((y) => (
                        <line key={y} x1={PADDING.left} y1={y} x2={WIDTH - PADDING.right} y2={y} stroke="currentColor" className="text-sand-100" strokeWidth={1} />
                    ))}

                    <defs>
                        <linearGradient id="trend-completed-fill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8A1836" stopOpacity={0.16} />
                            <stop offset="100%" stopColor="#8A1836" stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    {data.length > 0 && <path d={completedAreaPath} fill="url(#trend-completed-fill)" />}

                    <path d={createdPath} fill="none" stroke="currentColor" className="text-steel-300" strokeWidth={2} />
                    <path d={completedPath} fill="none" stroke="#8A1836" strokeWidth={2} />

                    {data.map((p, i) => (
                        <g key={p.weekStart}>
                            <circle cx={xAt(i)} cy={yAt(p.created)} r={2.5} fill="currentColor" className="text-steel-300" />
                            <circle cx={xAt(i)} cy={yAt(p.completed)} r={2.5} fill="#8A1836" />
                        </g>
                    ))}

                    {/* Points terminaux mis en valeur */}
                    {data.length > 0 && (
                        <circle
                            cx={xAt(data.length - 1)}
                            cy={yAt(data[data.length - 1].completed)}
                            r={4}
                            fill="#8A1836"
                            stroke="white"
                            strokeWidth={1.5}
                        />
                    )}

                    {hoverIndex !== null && (
                        <line
                            x1={xAt(hoverIndex)}
                            y1={PADDING.top}
                            x2={xAt(hoverIndex)}
                            y2={BASELINE_Y}
                            stroke="currentColor"
                            className="text-steel-300"
                            strokeWidth={1}
                            strokeDasharray="3 3"
                        />
                    )}
                </svg>

                {hovered && hoverIndex !== null && (
                    <div
                        className="font-data pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-sand-200 bg-white px-2.5 py-1.5 text-[11px] shadow-lg whitespace-nowrap"
                        style={{
                            left: `${(xAt(hoverIndex) / WIDTH) * 100}%`,
                            top: `${(yAt(Math.max(hovered.created, hovered.completed)) / HEIGHT) * 100}%`,
                        }}
                    >
                        <p className="font-sans font-semibold text-ink-900">{formatWeekLabel(hovered.weekStart)}</p>
                        <p className="text-ink-500">Créées : {hovered.created}</p>
                        <p className="text-ink-500">Terminées : {hovered.completed}</p>
                    </div>
                )}

                <div className="font-data mt-1 flex justify-between text-[10px] text-sand-400">
                    {data.map((p, i) => (
                        <span key={p.weekStart} className={i % 2 === 0 || data.length <= 5 ? '' : 'invisible'}>
                            {formatWeekLabel(p.weekStart)}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    )
}
