import { createClient } from '@/lib/supabase/server'
import { getActiveMandantId } from '@/lib/mandant/active'
import {
  getAvailablePeriods,
  getMonthlyAggregates,
  getTrendAggregates,
  previousPeriod,
} from '@/lib/reports/queries'
import {
  buildPeriodReport,
  buildTrend,
  formatPeriod,
} from '@/lib/reports/calculations'
import { KpiCards } from '@/components/dashboard/kpi-cards'
import { PeriodPicker } from '@/components/dashboard/period-picker'
import { GuvTable } from '@/components/dashboard/guv-table'
import { BilanzTable } from '@/components/dashboard/bilanz-table'
import { TrendChart } from '@/components/dashboard/trend-chart'
import { NoDataState } from '@/components/dashboard/no-data-state'
import { de } from '@/lib/messages/de'

interface Props {
  searchParams: Promise<{ jahr?: string; monat?: string }>
}

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()
  const mandantId = (await getActiveMandantId())!
  const { data: mandant } = await supabase
    .from('mandanten')
    .select('name')
    .eq('id', mandantId)
    .maybeSingle()

  const available = await getAvailablePeriods(mandantId)

  if (available.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {de.dashboard.title}
          </h1>
          <p className="text-slate-500 mt-1">
            {de.dashboard.subtitle}: <span className="font-medium">{mandant?.name}</span>
          </p>
        </div>
        <NoDataState />
      </div>
    )
  }

  // Resolve selected period — URL params or default to most recent
  const requestedJahr = params.jahr ? Number(params.jahr) : null
  const requestedMonat = params.monat ? Number(params.monat) : null
  const fallback = available[0]
  const validRequested =
    requestedJahr != null &&
    requestedMonat != null &&
    available.some((p) => p.jahr === requestedJahr && p.monat === requestedMonat)
  const selected = validRequested
    ? { jahr: requestedJahr!, monat: requestedMonat! }
    : fallback

  const [currentRows, trendRows] = await Promise.all([
    getMonthlyAggregates(mandantId, selected.jahr, selected.monat),
    getTrendAggregates(mandantId, selected.jahr, selected.monat, 12),
  ])

  const prev = previousPeriod(selected.jahr, selected.monat)
  const hasPrev = available.some((p) => p.jahr === prev.jahr && p.monat === prev.monat)
  const prevRows = hasPrev
    ? await getMonthlyAggregates(mandantId, prev.jahr, prev.monat)
    : []

  const currentReport = buildPeriodReport(currentRows, selected.jahr, selected.monat)
  const prevReport = hasPrev ? buildPeriodReport(prevRows, prev.jahr, prev.monat) : null
  const trend = buildTrend(trendRows)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {de.dashboard.title}
          </h1>
          <p className="text-slate-500 mt-1">
            <span className="font-medium text-slate-700">{mandant?.name}</span> —{' '}
            {formatPeriod(selected.jahr, selected.monat)}
          </p>
        </div>
        <PeriodPicker selected={selected} available={available} />
      </div>

      <KpiCards current={currentReport} previous={prevReport} />

      <TrendChart data={trend} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GuvTable report={currentReport} />
        <BilanzTable report={currentReport} />
      </div>
    </div>
  )
}
