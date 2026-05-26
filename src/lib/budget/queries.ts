import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { KontoWithBudget } from './types'
import type { Database } from '@/lib/types/database'

/**
 * Returns one row per konto of typ Ertrag/Aufwand for the active mandant
 * with: konto info, yearly budget (or null), and YTD ist value
 * (already sign-corrected so it's a positive number for normal cases).
 */
export async function getKontenWithBudget(
  mandantId: string,
  jahr: number
): Promise<KontoWithBudget[]> {
  const supabase = await createClient()

  // 1) all GuV-relevant konten for this mandant
  const { data: konten } = await supabase
    .from('konten')
    .select('id, nummer, bezeichnung, typ')
    .eq('mandant_id', mandantId)
    .in('typ', ['Ertrag', 'Aufwand'])
    .order('typ', { ascending: true })
    .order('nummer', { ascending: true })

  if (!konten || konten.length === 0) return []

  // 2) budgets for the year
  const { data: budgets } = await supabase
    .from('budgets')
    .select('konto_id, betrag')
    .eq('mandant_id', mandantId)
    .eq('jahr', jahr)

  const budgetMap = new Map<string, number>()
  for (const b of budgets ?? []) {
    budgetMap.set(b.konto_id, b.betrag)
  }

  // 3) IST YTD per konto for the year (sum across months)
  const { data: salden } = await supabase
    .from('salden')
    .select('konto_id, saldo_soll, saldo_haben')
    .eq('mandant_id', mandantId)
    .eq('jahr', jahr)

  // Aggregate per konto. For Ertrag → Haben-Saldo positive, for Aufwand → Soll-Saldo positive.
  type SaldoRow = { konto_id: string; saldo_soll: number; saldo_haben: number }
  const istMap = new Map<string, { soll: number; haben: number }>()
  for (const s of (salden ?? []) as SaldoRow[]) {
    const cur = istMap.get(s.konto_id) ?? { soll: 0, haben: 0 }
    cur.soll += Number(s.saldo_soll)
    cur.haben += Number(s.saldo_haben)
    istMap.set(s.konto_id, cur)
  }

  type Konto = Pick<
    Database['public']['Tables']['konten']['Row'],
    'id' | 'nummer' | 'bezeichnung' | 'typ'
  >

  return konten.map((k: Konto) => {
    const t = istMap.get(k.id)
    const ist =
      k.typ === 'Ertrag'
        ? (t?.haben ?? 0) - (t?.soll ?? 0)
        : (t?.soll ?? 0) - (t?.haben ?? 0)
    return {
      konto_id: k.id,
      nummer: k.nummer,
      bezeichnung: k.bezeichnung,
      typ: k.typ,
      budget_jahr: budgetMap.has(k.id) ? budgetMap.get(k.id)! : null,
      ist_ytd: ist,
    }
  })
}

export async function getAvailableBudgetYears(mandantId: string): Promise<number[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('salden')
    .select('jahr')
    .eq('mandant_id', mandantId)
  const years = new Set<number>()
  for (const r of data ?? []) years.add(r.jahr)
  // Always allow the current year so users can plan ahead
  years.add(new Date().getFullYear())
  return Array.from(years).sort((a, b) => b - a)
}

/**
 * Latest month with data in the given year — used to compute YTD elapsed months.
 */
export async function getLatestMonthInYear(
  mandantId: string,
  jahr: number
): Promise<number> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('salden')
    .select('monat')
    .eq('mandant_id', mandantId)
    .eq('jahr', jahr)
    .order('monat', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data?.monat ?? 0
}
