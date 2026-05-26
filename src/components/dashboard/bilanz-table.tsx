import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { de } from '@/lib/messages/de'
import type { PeriodReport } from '@/lib/reports/types'

function formatEur(n: number): string {
  return (
    n.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' €'
  )
}

export function BilanzTable({ report }: { report: PeriodReport }) {
  const diff = report.aktiva - report.passiva
  const balanced = Math.abs(diff) < 0.5

  return (
    <Card>
      <CardHeader>
        <CardTitle>{de.dashboard.bilanz.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="text-slate-700">{de.dashboard.bilanz.aktiva}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatEur(report.aktiva)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-slate-700">{de.dashboard.bilanz.passiva}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatEur(report.passiva)}
              </TableCell>
            </TableRow>
            <TableRow className="bg-slate-50">
              <TableCell className="font-semibold text-slate-900">
                {de.dashboard.bilanz.differenz}
              </TableCell>
              <TableCell
                className={
                  'text-right tabular-nums font-semibold ' +
                  (balanced ? 'text-emerald-700' : 'text-amber-700')
                }
              >
                {balanced ? '✓ ' : ''}
                {formatEur(diff)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
