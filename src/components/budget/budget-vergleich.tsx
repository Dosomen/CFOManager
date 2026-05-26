import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { de } from '@/lib/messages/de'
import type { BudgetRow, BudgetSummary } from '@/lib/budget/types'

function formatEur(n: number): string {
  return (
    n.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' €'
  )
}

function formatPct(n: number | null): string {
  if (n == null) return '—'
  const sign = n > 0 ? '+' : ''
  return sign + (n * 100).toFixed(1) + '%'
}

function abweichungColor(typ: BudgetRow['typ'], abs: number): string {
  // For Ertrag, positive abweichung = better (more than budget)
  // For Aufwand, positive abweichung = worse (more cost than budget)
  if (Math.abs(abs) < 0.5) return 'text-slate-500'
  const good = typ === 'Ertrag' ? abs > 0 : abs < 0
  return good ? 'text-emerald-700' : 'text-red-700'
}

export function BudgetSummaryCards({ summary }: { summary: BudgetSummary }) {
  const tiles = [
    {
      label: 'Erträge IST / Budget',
      ist: summary.ertraege_ist,
      budget: summary.ertraege_budget,
      typ: 'Ertrag' as const,
    },
    {
      label: 'Aufwendungen IST / Budget',
      ist: summary.aufwendungen_ist,
      budget: summary.aufwendungen_budget,
      typ: 'Aufwand' as const,
    },
    {
      label: 'Ergebnis IST / Budget',
      ist: summary.ergebnis_ist,
      budget: summary.ergebnis_budget,
      typ: 'Ertrag' as const,
    },
  ]
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {tiles.map((t) => {
        const abs = t.ist - t.budget
        const pct = t.budget !== 0 ? abs / Math.abs(t.budget) : null
        return (
          <Card key={t.label} className="p-5">
            <p className="text-sm text-slate-500">{t.label}</p>
            <p className="text-2xl font-semibold tabular-nums mt-2 text-slate-900">
              {formatEur(t.ist)}
            </p>
            <p className="text-xs text-slate-500 tabular-nums mt-0.5">
              Budget: {formatEur(t.budget)}
            </p>
            <p className={'text-sm mt-2 tabular-nums ' + abweichungColor(t.typ, abs)}>
              {abs > 0 ? '+' : ''}
              {formatEur(abs)} ({formatPct(pct)})
            </p>
          </Card>
        )
      })}
    </div>
  )
}

export function BudgetVergleichTable({ rows }: { rows: BudgetRow[] }) {
  const ertraege = rows.filter((r) => r.typ === 'Ertrag')
  const aufwendungen = rows.filter((r) => r.typ === 'Aufwand')

  return (
    <Card>
      <CardHeader>
        <CardTitle>{de.budget.compare.tableTitle}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Konto</TableHead>
              <TableHead>Bezeichnung</TableHead>
              <TableHead className="text-right">{de.budget.compare.istYtd}</TableHead>
              <TableHead className="text-right">{de.budget.compare.budgetYtd}</TableHead>
              <TableHead className="text-right">{de.budget.compare.diff}</TableHead>
              <TableHead className="text-right w-[80px]">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ertraege.length > 0 && (
              <TableRow className="bg-slate-50">
                <TableCell colSpan={6} className="font-semibold text-slate-700">
                  {de.budget.editor.ertraegeSection}
                </TableCell>
              </TableRow>
            )}
            {ertraege.map((r) => (
              <Row key={r.konto_id} r={r} />
            ))}
            {aufwendungen.length > 0 && (
              <TableRow className="bg-slate-50">
                <TableCell colSpan={6} className="font-semibold text-slate-700">
                  {de.budget.editor.aufwendungenSection}
                </TableCell>
              </TableRow>
            )}
            {aufwendungen.map((r) => (
              <Row key={r.konto_id} r={r} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function Row({ r }: { r: BudgetRow }) {
  return (
    <TableRow>
      <TableCell className="font-mono text-sm">{r.nummer}</TableCell>
      <TableCell className="text-sm">{r.bezeichnung}</TableCell>
      <TableCell className="text-right tabular-nums text-sm">
        {formatEur(r.ist_ytd)}
      </TableCell>
      <TableCell className="text-right tabular-nums text-sm">
        {formatEur(r.budget_ytd)}
      </TableCell>
      <TableCell
        className={'text-right tabular-nums text-sm ' + abweichungColor(r.typ, r.abweichung_absolut)}
      >
        {r.abweichung_absolut > 0 ? '+' : ''}
        {formatEur(r.abweichung_absolut)}
      </TableCell>
      <TableCell
        className={'text-right tabular-nums text-sm ' + abweichungColor(r.typ, r.abweichung_absolut)}
      >
        {formatPct(r.abweichung_prozent)}
      </TableCell>
    </TableRow>
  )
}
