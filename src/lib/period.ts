export type Period = 'week' | 'month' | 'quarter' | 'all'

// Fenêtres glissantes plutôt qu'alignées sur le calendrier (mois civil, trimestre civil) :
// plus simple à raisonner, pas de cas limite sur un changement de mois en cours de période.
// Introduit pour les Feuilles de temps (US-032), réutilisé tel quel par le Dashboard
// statistique (US-037) plutôt que redéfini une deuxième fois.
export function periodStart(period: Period, now: Date = new Date()): Date | null {
    if (period === 'all') return null

    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90
    const start = new Date(now)
    start.setDate(start.getDate() - days)
    return start
}
