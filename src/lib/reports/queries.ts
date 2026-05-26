import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { MonthlyAggregate, AvailablePeriod } from './types'

export async function getAvailablePeriods(
  mandantId: string
): Promise<AvailablePeriod[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('salden_monthly_by_typ')
    .select('jahr, monat')
    .eq('mandant_id', mandantId)
    .order('jahr', { ascending: false })
    .order('monat', { ascending: false })

  if (!data) return []
  const seen = new Set<string>()
  const out: AvailablePeriod[] = []
  for (const row of data) {
    if (row.jahr == null || row.monat == null) continue
    const key = `${row.jahr}-${row.monat}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ jahr: row.jahr, monat: row.monat })
  }
  return out
}

export async function getMonthlyAggregates(
  mandantId: string,
  jahr: number,
  monat: number
): Promise<MonthlyAggregate[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('salden_monthly_by_typ')
    .select('*')
    .eq('mandant_id', mandantId)
    .eq('jahr', jahr)
    .eq('monat', monat)
  return (data ?? []) as unknown as MonthlyAggregate[]
}

/**
 * Returns aggregates for up to `months` consecutive periods ending at
 * (year, month). Used by the trend chart.
 */
export async function getTrendAggregates(
  mandantId: string,
  endJahr: number,
  endMonat: number,
  months: number
): Promise<MonthlyAggregate[]> {
  // Compute the start period N months back
  let startMonat = endMonat - (months - 1)
  let startJahr = endJahr
  while (startMonat <= 0) {
    startMonat += 12
    startJahr -= 1
  }

  const supabase = await createClient()
  // Pull rows that fall in the [start, end] window. We use a single OR-range:
  //   (jahr > startJahr AND jahr < endJahr) OR
  //   (jahr = startJahr AND monat >= startMonat) OR
  //   (jahr = endJahr AND monat <= endMonat)
  // For simplicity, fetch all rows for the involved years and filter client-side.
  const { data } = await supabase
    .from('salden_monthly_by_typ')
    .select('*')
    .eq('mandant_id', mandantId)
    .gte('jahr', startJahr)
    .lte('jahr', endJahr)

  const all = (data ?? []) as unknown as MonthlyAggregate[]
  return all.filter((r) => {
    if (r.jahr === startJahr && r.monat < startMonat) return false
    if (r.jahr === endJahr && r.monat > endMonat) return false
    return true
  })
}

export function previousPeriod(
  jahr: number,
  monat: number
): { jahr: number; monat: number } {
  if (monat === 1) return { jahr: jahr - 1, monat: 12 }
  return { jahr, monat: monat - 1 }
}
