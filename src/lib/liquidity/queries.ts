import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { bucketFromKontoNummer } from './calculations'
import type { LiquidityRow, LiquidityBucket } from './types'

interface SaldoRow {
  jahr: number
  monat: number
  saldo_soll: number
  saldo_haben: number
  konten: { nummer: string; typ: string } | null
}

/**
 * Returns one (jahr, monat, bucket) row per period+bucket with the net
 * amount. We aggregate in JS because the konto-nummer ranges are
 * domain-specific (SKR03 liquidity buckets) and live outside the DB.
 */
export async function getLiquidityRows(mandantId: string): Promise<LiquidityRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('salden')
    .select('jahr, monat, saldo_soll, saldo_haben, konten(nummer, typ)')
    .eq('mandant_id', mandantId)

  if (!data) return []

  // Aggregate (jahr, monat, bucket) -> amount
  const map = new Map<string, LiquidityRow>()
  for (const r of data as unknown as SaldoRow[]) {
    if (!r.konten) continue
    const bucket = bucketFromKontoNummer(r.konten.nummer)
    if (bucket === 'sonstige') continue
    // Bank/Forderungen are Aktiva → soll - haben; Verbindlichkeiten are
    // Passiva → haben - soll. Both expressed as positive numbers so the
    // UI can subtract liabilities from assets cleanly.
    const amount =
      bucket === 'verbindlichkeiten'
        ? r.saldo_haben - r.saldo_soll
        : r.saldo_soll - r.saldo_haben

    const key = `${r.jahr}-${r.monat}-${bucket}`
    const existing = map.get(key)
    if (existing) {
      existing.amount += amount
    } else {
      map.set(key, { jahr: r.jahr, monat: r.monat, bucket: bucket as LiquidityBucket, amount })
    }
  }
  return Array.from(map.values())
}

export async function getLiquidityDetail(
  mandantId: string,
  jahr: number,
  monat: number,
  bucket: LiquidityBucket
): Promise<Array<{ nummer: string; bezeichnung: string; amount: number }>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('salden')
    .select('saldo_soll, saldo_haben, konten(nummer, bezeichnung)')
    .eq('mandant_id', mandantId)
    .eq('jahr', jahr)
    .eq('monat', monat)

  if (!data) return []
  type Row = {
    saldo_soll: number
    saldo_haben: number
    konten: { nummer: string; bezeichnung: string } | null
  }
  const out: Array<{ nummer: string; bezeichnung: string; amount: number }> = []
  for (const r of data as unknown as Row[]) {
    if (!r.konten) continue
    if (bucketFromKontoNummer(r.konten.nummer) !== bucket) continue
    const amount =
      bucket === 'verbindlichkeiten'
        ? r.saldo_haben - r.saldo_soll
        : r.saldo_soll - r.saldo_haben
    if (Math.abs(amount) < 0.005) continue
    out.push({ nummer: r.konten.nummer, bezeichnung: r.konten.bezeichnung, amount })
  }
  out.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
  return out
}
