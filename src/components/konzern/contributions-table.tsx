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
import type { KonzernMandantContribution } from '@/lib/konzern/queries'

function formatEur(n: number): string {
  return (
    n.toLocaleString('de-DE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) + ' €'
  )
}

export function ContributionsTable({
  rows,
}: {
  rows: KonzernMandantContribution[]
}) {
  const totals = rows.reduce(
    (acc, r) => ({
      ertraege: acc.ertraege + r.ertraege,
      aufwendungen: acc.aufwendungen + r.aufwendungen,
      ergebnis: acc.ergebnis + r.ergebnis,
      bank: acc.bank + r.bank,
      forderungen: acc.forderungen + r.forderungen,
      verbindlichkeiten: acc.verbindlichkeiten + r.verbindlichkeiten,
    }),
    {
      ertraege: 0,
      aufwendungen: 0,
      ergebnis: 0,
      bank: 0,
      forderungen: 0,
      verbindlichkeiten: 0,
    }
  )
  return (
    <Card>
      <CardHeader>
        <CardTitle>{de.konzern.contributions.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{de.konzern.contributions.mandant}</TableHead>
              <TableHead className="text-right">{de.konzern.contributions.ertraege}</TableHead>
              <TableHead className="text-right">{de.konzern.contributions.aufwendungen}</TableHead>
              <TableHead className="text-right">{de.konzern.contributions.ergebnis}</TableHead>
              <TableHead className="text-right">{de.konzern.contributions.bank}</TableHead>
              <TableHead className="text-right">{de.konzern.contributions.forderungen}</TableHead>
              <TableHead className="text-right">{de.konzern.contributions.verbindlichkeiten}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.mandant_id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatEur(r.ertraege)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatEur(r.aufwendungen)}
                </TableCell>
                <TableCell
                  className={
                    'text-right tabular-nums ' +
                    (r.ergebnis >= 0 ? 'text-emerald-700' : 'text-red-700')
                  }
                >
                  {formatEur(r.ergebnis)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatEur(r.bank)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatEur(r.forderungen)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatEur(r.verbindlichkeiten)}
                </TableCell>
              </TableRow>
            ))}
            {rows.length > 1 && (
              <TableRow className="bg-slate-50 font-semibold">
                <TableCell>{de.konzern.contributions.total}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatEur(totals.ertraege)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatEur(totals.aufwendungen)}
                </TableCell>
                <TableCell
                  className={
                    'text-right tabular-nums ' +
                    (totals.ergebnis >= 0 ? 'text-emerald-700' : 'text-red-700')
                  }
                >
                  {formatEur(totals.ergebnis)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatEur(totals.bank)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatEur(totals.forderungen)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatEur(totals.verbindlichkeiten)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
