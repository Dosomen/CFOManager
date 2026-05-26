import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { de } from '@/lib/messages/de'
import type { PeriodReport } from '@/lib/reports/types'
import { percentChange } from '@/lib/reports/calculations'

interface KpiCardsProps {
  current: PeriodReport
  previous: PeriodReport | null
}

function formatCurrency(n: number): string {
  return (
    Math.round(n).toLocaleString('de-DE', {
      maximumFractionDigits: 0,
    }) + ' €'
  )
}

function formatPercent(n: number, withSign = true): string {
  const sign = withSign && n > 0 ? '+' : ''
  return sign + (n * 100).toFixed(1) + '%'
}

interface KpiProps {
  label: string
  value: string
  change: number | null
  inverseColor?: boolean // for Aufwand: higher is bad
}

function KpiCard({ label, value, change, inverseColor }: KpiProps) {
  const trend = change == null ? 'flat' : change > 0.0005 ? 'up' : change < -0.0005 ? 'down' : 'flat'
  const isPositiveBusiness =
    trend === 'flat'
      ? null
      : inverseColor
        ? trend === 'down'
        : trend === 'up'
  return (
    <Card className="p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-3xl font-semibold tabular-nums mt-2 text-slate-900">{value}</p>
      <div className="mt-2 flex items-center gap-1 text-sm h-5">
        {change == null ? (
          <span className="text-slate-400 inline-flex items-center gap-1">
            <Minus className="size-3.5" />
            {de.dashboard.kpi.noPriorPeriod}
          </span>
        ) : (
          <span
            className={
              'inline-flex items-center gap-1 ' +
              (isPositiveBusiness ? 'text-emerald-600' : isPositiveBusiness === false ? 'text-red-600' : 'text-slate-500')
            }
          >
            {trend === 'up' && <ArrowUpRight className="size-3.5" />}
            {trend === 'down' && <ArrowDownRight className="size-3.5" />}
            {trend === 'flat' && <Minus className="size-3.5" />}
            {formatPercent(change)}
            <span className="text-slate-400">{de.dashboard.kpi.vsPrevious}</span>
          </span>
        )}
      </div>
    </Card>
  )
}

export function KpiCards({ current, previous }: KpiCardsProps) {
  const changeUmsatz = previous ? percentChange(current.ertraege, previous.ertraege) : null
  const changeAufwand = previous ? percentChange(current.aufwendungen, previous.aufwendungen) : null
  const changeErgebnis = previous ? percentChange(current.ergebnis, previous.ergebnis) : null
  const changeMarge =
    previous && previous.ergebnisMarge != null && current.ergebnisMarge != null
      ? current.ergebnisMarge - previous.ergebnisMarge
      : null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        label={de.dashboard.kpi.umsatz}
        value={formatCurrency(current.ertraege)}
        change={changeUmsatz}
      />
      <KpiCard
        label={de.dashboard.kpi.aufwand}
        value={formatCurrency(current.aufwendungen)}
        change={changeAufwand}
        inverseColor
      />
      <KpiCard
        label={de.dashboard.kpi.ergebnis}
        value={formatCurrency(current.ergebnis)}
        change={changeErgebnis}
      />
      <KpiCard
        label={de.dashboard.kpi.marge}
        value={
          current.ergebnisMarge == null
            ? '—'
            : (current.ergebnisMarge * 100).toFixed(1) + '%'
        }
        change={changeMarge}
      />
    </div>
  )
}
