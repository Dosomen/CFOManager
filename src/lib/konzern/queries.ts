import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { MonthlyAggregate, AvailablePeriod } from '@/lib/reports/types'

export interface KonzernMandantContribution {
  mandant_id: string
  name: string
  ertraege: number
  aufwendungen: number
  ergebnis: number
  bank: number
  forderungen: number
  verbindlichkeiten: number
}

/**
 * Mandanten that the calling user has access to. RLS filters automatically.
 */
export async function getKonzernMandanten(): Promise<
  Array<{ id: string; name: string }>
> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('mandanten')
    .select('id, name')
    .order('name', { ascending: true })
  return data ?? []
}

export async function getKonzernAvailablePeriods(): Promise<AvailablePeriod[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('salden_monthly_by_typ')
    .select('jahr, monat')
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

/**
 * Aggregates across all mandanten visible to the caller. The
 * salden_monthly_by_typ view has security_invoker=true so RLS does
 * the filtering for us.
 */
export async function getKonzernMonthlyAggregates(
  jahr: number,
  monat: number
): Promise<MonthlyAggregate[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('salden_monthly_by_typ')
    .select('*')
    .eq('jahr', jahr)
    .eq('monat', monat)
  return (data ?? []) as unknown as MonthlyAggregate[]
}

export async function getKonzernTrendAggregates(
  endJahr: number,
  endMonat: number,
  months: number
): Promise<MonthlyAggregate[]> {
  let startMonat = endMonat - (months - 1)
  let startJahr = endJahr
  while (startMonat <= 0) {
    startMonat += 12
    startJahr -= 1
  }
  const supabase = await createClient()
  const { data } = await supabase
    .from('salden_monthly_by_typ')
    .select('*')
    .gte('jahr', startJahr)
    .lte('jahr', endJahr)

  const all = (data ?? []) as unknown as MonthlyAggregate[]
  return all.filter((r) => {
    if (r.jahr === startJahr && r.monat < startMonat) return false
    if (r.jahr === endJahr && r.monat > endMonat) return false
    return true
  })
}

/**
 * Per-mandant contribution to the consolidated period — useful for
 * the breakdown table on the Konzern page.
 */
export async function getMandantContributions(
  jahr: number,
  monat: number
): Promise<KonzernMandantContribution[]> {
  const supabase = await createClient()

  const { data: mandanten } = await supabase
    .from('mandanten')
    .select('id, name')
    .order('name')

  if (!mandanten) return []

  // Per-mandant aggregates from the view
  const { data: agg } = await supabase
    .from('salden_monthly_by_typ')
    .select('*')
    .eq('jahr', jahr)
    .eq('monat', monat)

  // Per-mandant liquidity from salden joined with konten (for bucket logic)
  const { data: salden } = await supabase
    .from('salden')
    .select('mandant_id, saldo_soll, saldo_haben, konten(nummer)')
    .eq('jahr', jahr)
    .eq('monat', monat)

  const aggByMandant = new Map<string, ReturnType<typeof emptyAgg>>()
  function emptyAgg() {
    return {
      ertraege: 0,
      aufwendungen: 0,
      bank: 0,
      forderungen: 0,
      verbindlichkeiten: 0,
    }
  }

  for (const m of mandanten) aggByMandant.set(m.id, emptyAgg())

  type AggRow = {
    mandant_id: string
    typ: string
    sum_saldo_soll: number
    sum_saldo_haben: number
  }
  for (const r of (agg ?? []) as AggRow[]) {
    const bucket = aggByMandant.get(r.mandant_id) ?? emptyAgg()
    if (r.typ === 'Ertrag')
      bucket.ertraege += Number(r.sum_saldo_haben) - Number(r.sum_saldo_soll)
    else if (r.typ === 'Aufwand')
      bucket.aufwendungen += Number(r.sum_saldo_soll) - Number(r.sum_saldo_haben)
    aggByMandant.set(r.mandant_id, bucket)
  }

  type SaldoRow = {
    mandant_id: string
    saldo_soll: number
    saldo_haben: number
    konten: { nummer: string } | null
  }
  for (const r of (salden ?? []) as SaldoRow[]) {
    if (!r.konten) continue
    const bucket = aggByMandant.get(r.mandant_id) ?? emptyAgg()
    const n = parseInt(r.konten.nummer, 10)
    if (Number.isNaN(n)) continue
    const sollMinus = Number(r.saldo_soll) - Number(r.saldo_haben)
    if (n >= 1000 && n <= 1299) bucket.bank += sollMinus
    else if (n >= 1400 && n <= 1599) bucket.forderungen += sollMinus
    else if (n >= 1600 && n <= 1799) bucket.verbindlichkeiten -= sollMinus
    aggByMandant.set(r.mandant_id, bucket)
  }

  return mandanten.map((m) => {
    const a = aggByMandant.get(m.id) ?? emptyAgg()
    return {
      mandant_id: m.id,
      name: m.name,
      ertraege: a.ertraege,
      aufwendungen: a.aufwendungen,
      ergebnis: a.ertraege - a.aufwendungen,
      bank: a.bank,
      forderungen: a.forderungen,
      verbindlichkeiten: a.verbindlichkeiten,
    }
  })
}
