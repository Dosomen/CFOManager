import type { LiquidityBucket, LiquidityRow, LiquiditySnapshot, CashTrendPoint } from './types'

const MONTH_SHORT = [
  'Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez',
]

/**
 * SKR03 konto number → liquidity bucket.
 *   1000-1299  → Bank (Kasse + Bank)
 *   1400-1599  → Forderungen (incl. Vorsteuer)
 *   1600-1799  → Verbindlichkeiten (incl. USt)
 *   alles andere → sonstige (ignored for liquidity calcs)
 */
export function bucketFromKontoNummer(nummer: string): LiquidityBucket {
  const n = parseInt(nummer, 10)
  if (Number.isNaN(n)) return 'sonstige'
  if (n >= 1000 && n <= 1299) return 'bank'
  if (n >= 1400 && n <= 1599) return 'forderungen'
  if (n >= 1600 && n <= 1799) return 'verbindlichkeiten'
  return 'sonstige'
}

export function buildSnapshot(rows: LiquidityRow[], jahr: number, monat: number): LiquiditySnapshot {
  const period = rows.filter((r) => r.jahr === jahr && r.monat === monat)
  const find = (b: LiquidityBucket) => period.find((r) => r.bucket === b)?.amount ?? 0
  const bank = find('bank')
  const forderungen = find('forderungen')
  const verbindlichkeiten = find('verbindlichkeiten')
  return {
    jahr,
    monat,
    bank,
    forderungen,
    verbindlichkeiten,
    netto: bank + forderungen - verbindlichkeiten,
  }
}

export function buildCashTrend(rows: LiquidityRow[], forecastMonths = 3): CashTrendPoint[] {
  // Group rows into {jahr,monat} -> snapshot
  const keys = new Set(rows.map((r) => `${r.jahr}-${r.monat}`))
  const periods = Array.from(keys)
    .map((k) => {
      const [jahr, monat] = k.split('-').map(Number)
      return { jahr, monat }
    })
    .sort((a, b) => a.jahr - b.jahr || a.monat - b.monat)

  const points: CashTrendPoint[] = periods.map((p) => {
    const s = buildSnapshot(rows, p.jahr, p.monat)
    return {
      jahr: p.jahr,
      monat: p.monat,
      label: `${MONTH_SHORT[p.monat - 1]} ${String(p.jahr).slice(-2)}`,
      bank: s.bank,
      netto: s.netto,
    }
  })

  // Simple forecast: extrapolate based on average month-over-month change in `bank`
  // over the last 3 known months.
  if (points.length >= 2 && forecastMonths > 0) {
    const recent = points.slice(-3)
    let totalBankChange = 0
    let totalNettoChange = 0
    for (let i = 1; i < recent.length; i++) {
      totalBankChange += recent[i].bank - recent[i - 1].bank
      totalNettoChange += recent[i].netto - recent[i - 1].netto
    }
    const avgBankChange = recent.length > 1 ? totalBankChange / (recent.length - 1) : 0
    const avgNettoChange = recent.length > 1 ? totalNettoChange / (recent.length - 1) : 0

    let last = points[points.length - 1]
    for (let i = 0; i < forecastMonths; i++) {
      const nextMonat = last.monat === 12 ? 1 : last.monat + 1
      const nextJahr = last.monat === 12 ? last.jahr + 1 : last.jahr
      const projected: CashTrendPoint = {
        jahr: nextJahr,
        monat: nextMonat,
        label: `${MONTH_SHORT[nextMonat - 1]} ${String(nextJahr).slice(-2)}`,
        bank: last.bank + avgBankChange,
        netto: last.netto + avgNettoChange,
        projected: true,
      }
      points.push(projected)
      last = projected
    }
  }

  return points
}
