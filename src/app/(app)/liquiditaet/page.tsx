import { createClient } from '@/lib/supabase/server'
import { getActiveMandantId } from '@/lib/mandant/active'
import { getLiquidityRows, getLiquidityDetail } from '@/lib/liquidity/queries'
import { buildSnapshot, buildCashTrend } from '@/lib/liquidity/calculations'
import { formatPeriod } from '@/lib/reports/calculations'
import { CashStatusCards } from '@/components/liquidity/cash-status-cards'
import { CashTrendChart } from '@/components/liquidity/cash-trend-chart'
import { LiquidityDetailTable } from '@/components/liquidity/detail-table'
import { NoDataState } from '@/components/dashboard/no-data-state'
import { de } from '@/lib/messages/de'

export default async function LiquiditaetPage() {
  const supabase = await createClient()
  const mandantId = (await getActiveMandantId())!
  const { data: mandant } = await supabase
    .from('mandanten')
    .select('name')
    .eq('id', mandantId)
    .maybeSingle()

  const rows = await getLiquidityRows(mandantId)

  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{de.liquidity.title}</h1>
          <p className="text-slate-500 mt-1">{mandant?.name}</p>
        </div>
        <NoDataState />
      </div>
    )
  }

  // Most recent period available
  const sorted = [...rows].sort(
    (a, b) => b.jahr - a.jahr || b.monat - a.monat
  )
  const { jahr, monat } = sorted[0]

  const snapshot = buildSnapshot(rows, jahr, monat)
  const trend = buildCashTrend(rows, 3)

  const [forderungenDetail, verbindlichkeitenDetail] = await Promise.all([
    getLiquidityDetail(mandantId, jahr, monat, 'forderungen'),
    getLiquidityDetail(mandantId, jahr, monat, 'verbindlichkeiten'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{de.liquidity.title}</h1>
        <p className="text-slate-500 mt-1">
          <span className="font-medium text-slate-700">{mandant?.name}</span> —{' '}
          {formatPeriod(jahr, monat)}
        </p>
      </div>

      <CashStatusCards snapshot={snapshot} />

      <CashTrendChart data={trend} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LiquidityDetailTable
          title={de.liquidity.detail.forderungenTitle}
          rows={forderungenDetail}
          emptyText={de.liquidity.detail.forderungenEmpty}
        />
        <LiquidityDetailTable
          title={de.liquidity.detail.verbindlichkeitenTitle}
          rows={verbindlichkeitenDetail}
          emptyText={de.liquidity.detail.verbindlichkeitenEmpty}
        />
      </div>
    </div>
  )
}
