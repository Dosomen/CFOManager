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

export function GuvTable({ report }: { report: PeriodReport }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{de.dashboard.guv.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="text-slate-700">{de.dashboard.guv.ertraege}</TableCell>
              <TableCell className="text-right tabular-nums text-emerald-700 font-medium">
                {formatEur(report.ertraege)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-slate-700">
                {de.dashboard.guv.aufwendungen}
              </TableCell>
              <TableCell className="text-right tabular-nums text-red-700">
                − {formatEur(report.aufwendungen)}
              </TableCell>
            </TableRow>
            <TableRow className="bg-slate-50">
              <TableCell className="font-semibold text-slate-900">
                {de.dashboard.guv.ergebnis}
              </TableCell>
              <TableCell
                className={
                  'text-right tabular-nums font-semibold ' +
                  (report.ergebnis >= 0 ? 'text-emerald-700' : 'text-red-700')
                }
              >
                {report.ergebnis >= 0 ? '+' : ''}
                {formatEur(report.ergebnis)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
