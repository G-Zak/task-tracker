'use client'

import { Download } from 'lucide-react'

import type { TimesheetGroup } from '@/src/services/timesheet.service'
import { taskStatusLabels } from '@/src/lib/labels'
import { formatDuration } from '@/src/lib/elapsed-time'

interface ExportCsvButtonProps {
    groups: TimesheetGroup[]
}

function formatDate(date: Date | string) {
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function csvEscape(value: string) {
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function ExportCsvButton({ groups }: ExportCsvButtonProps) {
    const handleExport = () => {
        const header = ['Groupe', 'Tâche', 'Projet', 'Statut', 'Démarrée le', 'Terminée le', 'Durée', 'Durée (minutes)']
        const rows = groups.flatMap((group) =>
            group.entries.map((entry) => [
                group.label,
                entry.title,
                entry.project?.name ?? '—',
                taskStatusLabels[entry.status],
                formatDate(entry.startedAt),
                entry.approvedAt ? formatDate(entry.approvedAt) : 'En cours',
                formatDuration(entry.durationMs),
                String(Math.round(entry.durationMs / 60_000)),
            ])
        )

        const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = url
        link.download = `feuilles-de-temps-${new Date().toISOString().slice(0, 10)}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    return (
        <button
            onClick={handleExport}
            disabled={groups.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-sand-200 bg-white px-3.5 py-2 text-sm font-medium text-ink-700 shadow-sm hover:bg-sand-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
            <Download className="h-4 w-4" />
            Export CSV
        </button>
    )
}
