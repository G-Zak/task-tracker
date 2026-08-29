export function isOwnedByOrg<T extends { organisationId: string } | null | undefined>(
    record: T,
    organisationId: string
): record is NonNullable<T> {
    return !!record && record.organisationId === organisationId
}

export function ownershipErrorMessage(label: string): string {
    return `${label} introuvable ou accès refusé.`
}
