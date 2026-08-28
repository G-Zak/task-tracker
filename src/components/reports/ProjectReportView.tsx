'use client'

import { useState, useTransition } from 'react'
import { FileText, Download, RefreshCw, Loader2, AlertTriangle, Target, ListChecks } from 'lucide-react'
import { generateProjectReportAction } from '@/src/actions/report'
import { buildReportMarkdown } from '@/src/lib/report-markdown'
import { taskStatusLabels } from '@/src/lib/labels'
import type { ProjectReport } from '@/src/services/report.service'

interface ProjectReportViewProps {
    projectId: string
    projectName: string
}

function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function ProjectReportView({ projectId, projectName }: ProjectReportViewProps) {
    const [report, setReport] = useState<ProjectReport | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const generate = () => {
        setError(null)
        startTransition(async () => {
            const result = await generateProjectReportAction(projectId)
            if ('error' in result) {
                setError(result.error)
                return
            }
            setReport(result.report)
        })
    }

    const exportMarkdown = () => {
        if (!report) return
        const markdown = buildReportMarkdown(report)
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' })
        const url = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = url
        link.download = `rapport-${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().slice(0, 10)}.md`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    if (!report) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm">
                <div className="rounded-full bg-violet-50 p-3 text-violet-600 mb-3">
                    <FileText className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-zinc-900">Générer un rapport de synthèse</h3>
                <p className="mt-1 max-w-sm text-sm text-zinc-500">
                    Avancement, risques et recommandations pour « {projectName} », générés à la demande à partir des
                    données réelles du projet.
                </p>

                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

                <button
                    onClick={generate}
                    disabled={isPending}
                    className="mt-5 flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Génération en cours... (modèle local, jusqu&apos;à quelques minutes)
                        </>
                    ) : (
                        <>
                            <FileText className="h-4 w-4" />
                            Générer le rapport
                        </>
                    )}
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white px-5 py-4 shadow-sm">
                <p className="text-xs text-zinc-500">Généré le {new Date(report.generatedAt).toLocaleString('fr-FR')}</p>
                <div className="flex items-center gap-2">
                    <button
                        onClick={generate}
                        disabled={isPending}
                        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Régénérer
                    </button>
                    <button
                        onClick={exportMarkdown}
                        className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        <Download className="h-4 w-4" />
                        Exporter en Markdown
                    </button>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-zinc-500">
                        <ListChecks className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Avancement</span>
                    </div>
                    <p className="mt-3 text-3xl font-bold text-zinc-900">
                        {report.progressRate === null ? '—' : `${report.progressRate}%`}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">{report.totalTasks} tâche(s) au total</p>
                    {report.endDate && (
                        <p className={`mt-1 text-xs ${report.isProjectOverdue ? 'font-medium text-red-600' : 'text-zinc-500'}`}>
                            Échéance : {formatDate(report.endDate)}
                            {report.isProjectOverdue ? ' (dépassée)' : ''}
                        </p>
                    )}
                </div>

                <div
                    className={`rounded-2xl border p-6 shadow-sm ${
                        report.overdueTasks.length > 0 || report.blockedTasks.length > 0
                            ? 'border-red-200/60 bg-red-50/50'
                            : 'border-zinc-200/80 bg-white'
                    }`}
                >
                    <div className={`flex items-center gap-2 ${report.overdueTasks.length > 0 ? 'text-red-700' : 'text-zinc-500'}`}>
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Risques</span>
                    </div>
                    <p className="mt-3 text-3xl font-bold text-zinc-900">{report.overdueTasks.length + report.blockedTasks.length}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                        {report.overdueTasks.length} en retard · {report.blockedTasks.length} bloquée(s)
                    </p>
                </div>

                <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-zinc-500">
                        <Target className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Respect des délais</span>
                    </div>
                    <p className="mt-3 text-3xl font-bold text-zinc-900">{report.onTimeRate === null ? '—' : `${report.onTimeRate}%`}</p>
                    <p className="mt-1 text-xs text-zinc-500">Tâches terminées avec échéance</p>
                </div>
            </div>

            {(report.overdueTasks.length > 0 || report.blockedTasks.length > 0) && (
                <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/60">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Détail des risques</span>
                    </div>
                    <div className="divide-y divide-zinc-100">
                        {[...report.overdueTasks, ...report.blockedTasks].map((task, index) => (
                            <div key={index} className="flex items-center justify-between gap-3 px-5 py-3">
                                <span className="text-sm font-medium text-zinc-900">{task.title}</span>
                                <span className="text-xs text-red-600">{task.detail}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-zinc-500 mb-3">
                    <FileText className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Recommandations</span>
                </div>
                <div className="whitespace-pre-wrap text-sm text-zinc-700 leading-relaxed">{report.recommendations}</div>
            </div>

            <p className="text-center text-[11px] text-zinc-400">
                Répartition par statut :{' '}
                {(Object.keys(report.tasksByStatus) as Array<keyof typeof report.tasksByStatus>)
                    .map((status) => `${taskStatusLabels[status]} : ${report.tasksByStatus[status]}`)
                    .join(' · ')}
            </p>
        </div>
    )
}
