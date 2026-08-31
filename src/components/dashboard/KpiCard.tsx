'use client'

import { useEffect, useRef, type ReactNode } from 'react'

type KpiTone = 'default' | 'success' | 'warning' | 'critical'

interface KpiCardProps {
    icon: ReactNode
    label: string
    value: number
    suffix?: string
    hint: string
    tone?: KpiTone
    delayMs?: number
}

const toneClasses: Record<KpiTone, string> = {
    default: 'text-ink-500',
    success: 'text-status-success',
    warning: 'text-status-warning',
    critical: 'text-status-critical',
}

const chipClasses: Record<KpiTone, string> = {
    default: 'bg-sand-100 text-ink-500',
    success: 'bg-status-success-bg text-status-success',
    warning: 'bg-status-warning-bg text-status-warning',
    critical: 'bg-status-critical-bg text-status-critical',
}

export function KpiCard({ icon, label, value, suffix = '', hint, tone = 'default', delayMs = 0 }: KpiCardProps) {
    const ref = useRef<HTMLParagraphElement>(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            el.textContent = `${value}${suffix}`
            return
        }

        const duration = 700
        let start: number | null = null
        let frame: number

        const timeout = setTimeout(() => {
            function step(timestamp: number) {
                if (start === null) start = timestamp
                const progress = Math.min(1, (timestamp - start) / duration)
                const eased = 1 - Math.pow(1 - progress, 3)
                el!.textContent = `${Math.round(value * eased)}${suffix}`
                if (progress < 1) frame = requestAnimationFrame(step)
            }
            frame = requestAnimationFrame(step)
        }, delayMs)

        return () => {
            clearTimeout(timeout)
            if (frame) cancelAnimationFrame(frame)
        }
    }, [value, suffix, delayMs])

    return (
        <div
            className="rounded-2xl border border-sand-200 bg-white p-5 shadow-[0_1px_2px_rgba(32,22,25,0.04),0_8px_24px_-12px_rgba(32,22,25,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_10px_rgba(32,22,25,0.06),0_20px_40px_-16px_rgba(32,22,25,0.18)] opacity-0 animate-[rise_0.5s_cubic-bezier(0.19,1,0.22,1)_forwards]"
            style={{ animationDelay: `${delayMs}ms` }}
        >
            <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{label}</span>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] [&_svg]:h-4 [&_svg]:w-4 ${chipClasses[tone]}`}>
                    {icon}
                </div>
            </div>
            <p ref={ref} className="font-data mt-3 text-[30px] font-medium leading-none tracking-tight text-ink-900">
                0{suffix}
            </p>
            <p className={`mt-2 text-[11.5px] ${tone === 'default' ? 'text-ink-500' : toneClasses[tone]}`}>{hint}</p>
        </div>
    )
}
