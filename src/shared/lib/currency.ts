const arsCurrencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
})

export function formatARSAmount(value: string | number | null | undefined): string {
  const amount = typeof value === 'number' ? value : Number(value)
  return arsCurrencyFormatter.format(Number.isFinite(amount) ? amount : 0)
}

export function hasNonZeroAmount(value: string | number | null | undefined): boolean {
  const amount = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(amount) && Math.abs(amount) > 0
}
