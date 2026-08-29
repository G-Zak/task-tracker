'use server'

import { Role } from '@/src/generated/client'
import { authorizeRole } from '@/src/lib/rbac'
import { catchActionError } from '@/src/lib/action-error'
import { generateProjectReport } from '@/src/services/report.service'

export async function generateProjectReportAction(projectId: string) {
    try {
        const user = await authorizeRole(Role.PROJECT_MANAGER)

        const report = await generateProjectReport(projectId, user.organisationId)
        if (!report) return { error: 'Projet introuvable ou accès refusé.' }

        return { success: true as const, report }
    } catch (error) {
        return catchActionError(error, "Une erreur est survenue lors de la génération du rapport.")
    }
}
