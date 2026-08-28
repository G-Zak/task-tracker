import { taskStatusLabels, projectStatusLabels } from '@/src/lib/labels'
import type { ProjectReport } from '@/src/services/report.service'

function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function buildReportMarkdown(report: ProjectReport): string {
    const lines: string[] = []

    lines.push(`# Rapport de projet — ${report.projectName}`)
    lines.push('')
    lines.push(`**Client :** ${report.clientName ?? '—'}  `)
    lines.push(`**Statut :** ${projectStatusLabels[report.projectStatus]}  `)
    lines.push(`**Généré le :** ${new Date(report.generatedAt).toLocaleString('fr-FR')}`)
    lines.push('')

    lines.push('## Avancement')
    lines.push('')
    lines.push(`- Tâches totales : ${report.totalTasks}`)
    lines.push(`- Progression : ${report.progressRate === null ? 'aucune donnée' : `${report.progressRate}% terminées`}`)
    for (const status of Object.keys(report.tasksByStatus) as Array<keyof typeof report.tasksByStatus>) {
        lines.push(`  - ${taskStatusLabels[status]} : ${report.tasksByStatus[status]}`)
    }
    if (report.startDate) lines.push(`- Début : ${formatDate(report.startDate)}`)
    if (report.endDate) lines.push(`- Échéance : ${formatDate(report.endDate)}${report.isProjectOverdue ? ' (dépassée)' : ''}`)
    lines.push('')

    lines.push('## Risques')
    lines.push('')
    lines.push(`- Taux de respect des délais : ${report.onTimeRate === null ? 'aucune donnée' : `${report.onTimeRate}%`}`)
    lines.push(`- Tâches en retard (${report.overdueTasks.length}) :`)
    if (report.overdueTasks.length === 0) {
        lines.push('  - Aucune')
    } else {
        for (const task of report.overdueTasks) lines.push(`  - ${task.title} — ${task.detail}`)
    }
    lines.push(`- Tâches bloquées (${report.blockedTasks.length}) :`)
    if (report.blockedTasks.length === 0) {
        lines.push('  - Aucune')
    } else {
        for (const task of report.blockedTasks) lines.push(`  - ${task.title} — ${task.detail}`)
    }
    lines.push('')

    lines.push('## Recommandations')
    lines.push('')
    lines.push(report.recommendations)
    lines.push('')

    return lines.join('\n')
}
