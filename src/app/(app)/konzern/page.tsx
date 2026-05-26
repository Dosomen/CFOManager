import {
  getKonzernAvailablePeriods,
  getKonzernMandanten,
  getKonzernMonthlyAggregates,
  getKonzernTrendAggregates,
  getMandantContributions,
} from '@/lib/konzern/queries'
import {
  buildPeriodReport,
  buildTrend,
  formatPeriod,
} from '@/lib/reports/calculations'
import { previousPeriod } from '@/lib/reports/queries'
import { KpiCards } from '@/components/dashboard/kpi-cards'
import { PeriodPicker } from '@/components/dashboard/period-picker'
import { GuvTable } from '@/components/dashboard/guv-table'
import { BilanzTable } from '@/components/dashboard/bilanz-table'
import { TrendChart } from '@/components/dashboard/trend-chart'
import { NoDataState } from '@/components/dashboard/no-data-state'
import { ContributionsTable } from '@/components/konzern/contributions-table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2 } from 'lucide-react'
import { de } from '@/lib/messages/de'

interface Props {
  searchParams: Promise<{ jahr?: string; monat?: string }>
}

export default async function KonzernPage({ searchParams }: Props) {
  const params = await searchParams
  const mandanten = await getKonzernMandanten()
  const available = await getKonzernAvailablePeriods()

  if (mandanten.length === 0 || available.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{de.konzern.title}</h1>
          <p className="text-slate-500 mt-1">{de.konzern.subtitle}</p>
        </div>
        <NoDataState />
      </div>
    )
  }

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

  const [currentRows, trendRows, contributions] = await Promise.all([
    getKonzernMonthlyAggregates(selected.jahr, selected.monat),
    getKonzernTrendAggregates(selected.jahr, selected.monat, 12),
    getMandantContributions(selected.jahr, selected.monat),
  ])

  const prev = previousPeriod(selected.jahr, selected.monat)
  const hasPrev = available.some((p) => p.jahr === prev.jahr && p.monat === prev.monat)
  const prevRows = hasPrev
    ? await getKonzernMonthlyAggregates(prev.jahr, prev.monat)
    : []

  const currentReport = buildPeriodReport(currentRows, selected.jahr, selected.monat)
  const prevReport = hasPrev ? buildPeriodReport(prevRows, prev.jahr, prev.monat) : null
  const trend = buildTrend(trendRows)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="size-6 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight">{de.konzern.title}</h1>
          </div>
          <p className="text-slate-500 mt-1">
            {de.konzern.subtitle.replace('{n}', String(mandanten.length))} —{' '}
            {formatPeriod(selected.jahr, selected.monat)}
          </p>
        </div>
        <PeriodPicker selected={selected} available={available} />
      </div>

      <Alert>
        <AlertDescription>
          <strong>{de.konzern.disclaimer.title}:</strong> {de.konzern.disclaimer.body}
        </AlertDescription>
      </Alert>

      <KpiCards current={currentReport} previous={prevReport} />

      <TrendChart data={trend} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GuvTable report={currentReport} />
        <BilanzTable report={currentReport} />
      </div>

      {mandanten.length > 1 && <ContributionsTable rows={contributions} />}
    </div>
  )
}
