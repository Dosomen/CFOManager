import type { MonthlyAggregate, PeriodReport, TrendPoint } from './types'

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mär',
  'Apr',
  'Mai',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Okt',
  'Nov',
  'Dez',
]

/**
 * For income statement (GuV) accounts, the natural balance side is:
 *   Aufwand → Soll
 *   Ertrag  → Haben
 * The economic value is the magnitude on the natural side minus the
 * magnitude on the opposite side. We use Saldo (already netted by the
 * import) so the value is just saldo_soll for Aufwand and saldo_haben
 * for Ertrag. Negative values are possible for unusual corrections.
 */
function aufwandFrom(a: MonthlyAggregate): number {
  return a.sum_saldo_soll - a.sum_saldo_haben
}
function ertragFrom(a: MonthlyAggregate): number {
  return a.sum_saldo_haben - a.sum_saldo_soll
}
function aktivaFrom(a: MonthlyAggregate): number {
  return a.sum_saldo_soll - a.sum_saldo_haben
}
function passivaFrom(a: MonthlyAggregate): number {
  return a.sum_saldo_haben - a.sum_saldo_soll
}

export function buildPeriodReport(
  rows: MonthlyAggregate[],
  jahr: number,
  monat: number
): PeriodReport {
  const matching = rows.filter((r) => r.jahr === jahr && r.monat === monat)
  let ertraege = 0
  let aufwendungen = 0
  let aktiva = 0
  let passiva = 0
  for (const r of matching) {
    if (r.typ === 'Ertrag') ertraege += ertragFrom(r)
    else if (r.typ === 'Aufwand') aufwendungen += aufwandFrom(r)
    else if (r.typ === 'Aktiva') aktiva += aktivaFrom(r)
    else if (r.typ === 'Passiva') passiva += passivaFrom(r)
  }
  const ergebnis = ertraege - aufwendungen
  const ergebnisMarge = ertraege > 0 ? ergebnis / ertraege : null
  return {
    jahr,
    monat,
    ertraege,
    aufwendungen,
    ergebnis,
    ergebnisMarge,
    aktiva,
    passiva,
  }
}

export function buildTrend(rows: MonthlyAggregate[]): TrendPoint[] {
  // Group by (jahr, monat)
  const byPeriod = new Map<string, { jahr: number; monat: number; rows: MonthlyAggregate[] }>()
  for (const r of rows) {
    const key = `${r.jahr}-${r.monat}`
    const bucket = byPeriod.get(key)
    if (bucket) {
      bucket.rows.push(r)
    } else {
      byPeriod.set(key, { jahr: r.jahr, monat: r.monat, rows: [r] })
    }
  }
  const points = Array.from(byPeriod.values())
    .sort((a, b) => a.jahr - b.jahr || a.monat - b.monat)
    .map(({ jahr, monat, rows }) => {
      let umsatz = 0
      let aufwand = 0
      for (const r of rows) {
        if (r.typ === 'Ertrag') umsatz += ertragFrom(r)
        else if (r.typ === 'Aufwand') aufwand += aufwandFrom(r)
      }
      return {
        jahr,
        monat,
        label: `${MONTH_SHORT[monat - 1]} ${String(jahr).slice(-2)}`,
        umsatz,
        ergebnis: umsatz - aufwand,
      }
    })
  return points
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return (current - previous) / Math.abs(previous)
}

export const MONTH_LONG = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
]

export function formatPeriod(jahr: number, monat: number): string {
  return `${MONTH_LONG[monat - 1]} ${jahr}`
}
