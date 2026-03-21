const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  AS: 'Activo',
  LI: 'Pasivo',
  EQ: 'Patrimonio Neto',
  EX: 'Resultado Negativo',
  IN: 'Resultado Positivo',
}

const NORMAL_BALANCE_LABELS: Record<'DEBIT' | 'CREDIT', string> = {
  DEBIT: 'Débito',
  CREDIT: 'Crédito',
}

export function getAccountTypeLabel(accountType: string | null | undefined): string {
  if (!accountType) return '—'
  return ACCOUNT_TYPE_LABELS[accountType] ?? accountType
}

export function getNormalBalanceLabel(normalBalance: 'DEBIT' | 'CREDIT'): string {
  return NORMAL_BALANCE_LABELS[normalBalance]
}
