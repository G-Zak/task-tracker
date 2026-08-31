'use client'

import { Download } from 'lucide-react'
import type { OrgStatistics } from '@/src/services/statistics.service'
import { taskStatusLabels, taskStatusOptions, taskPriorityLabels, taskPriorityOptions } from '@/src/lib/labels'
import { formatDuration } from '@/src/lib/elapsed-time'

interface ExportStatisticsButtonProps {
    stats: OrgStatistics
    filterSummary: string
}

function csvEscape(value: string) {
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function row(values: string[]) {
    return values.map(csvEscape).join(',')
}

export function ExportStatisticsButton({ stats, filterSummary }: ExportStatisticsButtonProps) {
    const handleExport = () => {
        const lines: string[] = []

        lines.push(row(['Statistiques', filterSummary]))
        lines.push(row(['Généré le', new Date().toLocaleString('fr-FR')]))
        lines.push('')

        lines.push('Répartition des tâches par statut')
        lines.push(row(['Statut', 'Nombre']))
        for (const status of taskStatusOptions) {
            lines.push(row([taskStatusLabels[status], String(stats.tasksByStatus[status] ?? 0)]))
        }
        lines.push('')

        lines.push('Répartition des tâches par priorité')
        lines.push(row(['Priorité', 'Nombre']))
        for (const priority of taskPriorityOptions) {
            lines.push(row([taskPriorityLabels[priority], String(stats.tasksByPriority[priority] ?? 0)]))
        }
        lines.push('')

        lines.push('Délais')
        lines.push(row(['Indicateur', 'Valeur']))
        lines.push(row(['Tâches évaluées', String(stats.onTimeCount + stats.lateCount)]))
        lines.push(row(['À temps', String(stats.onTimeCount)]))
        lines.push(row(['En retard (terminées)', String(stats.lateCount)]))
        lines.push(row(['Taux de respect', stats.onTimeRate === null ? 'N/A' : `${stats.onTimeRate}%`]))
        lines.push(row(['Tâches actuellement en retard', String(stats.overdueCount)]))
        lines.push(row(['Temps moyen de cycle', stats.avgCompletionMs === null ? 'N/A' : formatDuration(stats.avgCompletionMs)]))
        lines.push('')

        lines.push('Volume par projet')
        lines.push(row(['Projet', 'Tâches']))
        for (const project of stats.projectVolume) {
            lines.push(row([project.name, String(project.count)]))
        }
        lines.push('')

        lines.push('Charge par équipe')
        lines.push(row(['Équipe', 'Tâches actives']))
        for (const team of stats.teamWorkload) {
            lines.push(row([team.name, String(team.activeTaskCount)]))
        }

        const csv = lines.join('\n')
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = url
        link.download = `statistiques-${new Date().toISOString().slice(0, 10)}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    return (
        <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-lg border border-sand-200 bg-white px-3.5 py-2 text-sm font-medium text-ink-700 shadow-sm hover:bg-sand-50 transition-colors"
        >
            <Download className="h-4 w-4" />
            Export CSV
        </button>
    )
}
