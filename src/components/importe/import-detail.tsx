import { Badge } from '@/components/ui/badge'
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
import type { Database } from '@/lib/types/database'

type ImportRow = Database['public']['Tables']['importe']['Row']

interface SaldoWithKonto {
  eb_soll: number
  eb_haben: number
  vk_soll: number
  vk_haben: number
  saldo_soll: number
  saldo_haben: number
  konten: {
    nummer: string
    bezeichnung: string
    typ: Database['public']['Enums']['konten_typ']
  } | null
}

interface ImportDetailProps {
  importRow: ImportRow
  salden: SaldoWithKonto[]
}

const monthLabels = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
]

function formatMoney(n: number): string {
  return n.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusLabel(s: ImportRow['status']): string {
  if (s === 'erfolgreich') return de.importe.list.statusErfolgreich
  if (s === 'ueberschrieben') return de.importe.list.statusUeberschrieben
  return de.importe.list.statusFehlgeschlagen
}

function StatusBadge({ status }: { status: ImportRow['status'] }) {
  if (status === 'erfolgreich') {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
        {statusLabel(status)}
      </Badge>
    )
  }
  if (status === 'ueberschrieben') {
    return <Badge variant="secondary">{statusLabel(status)}</Badge>
  }
  return <Badge variant="destructive">{statusLabel(status)}</Badge>
}

export function ImportDetail({ importRow, salden }: ImportDetailProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {de.importe.detail.title}
        </h1>
        <p className="text-slate-500 mt-1">
          {monthLabels[importRow.periode_monat - 1]} {importRow.periode_jahr}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{de.importe.detail.meta}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <MetaField label="Datum" value={formatDateTime(importRow.created_at)} />
          <MetaField
            label="Periode"
            value={`${monthLabels[importRow.periode_monat - 1]} ${importRow.periode_jahr}`}
          />
          <MetaField
            label="Status"
            value={<StatusBadge status={importRow.status} />}
          />
          <MetaField label="Dateiname" value={importRow.dateiname} />
          <MetaField
            label="Konten"
            value={importRow.anzahl_konten.toString()}
          />
          <MetaField
            label="Salden"
            value={importRow.anzahl_salden.toString()}
          />
          <MetaField
            label="Summe Soll"
            value={`${formatMoney(importRow.summe_soll)} €`}
          />
          <MetaField
            label="Summe Haben"
            value={`${formatMoney(importRow.summe_haben)} €`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{de.importe.detail.salden}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Konto</TableHead>
                <TableHead>Bezeichnung</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead className="text-right">EB Soll</TableHead>
                <TableHead className="text-right">EB Haben</TableHead>
                <TableHead className="text-right">VK Soll</TableHead>
                <TableHead className="text-right">VK Haben</TableHead>
                <TableHead className="text-right">Saldo Soll</TableHead>
                <TableHead className="text-right">Saldo Haben</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salden.map((s, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-sm">
                    {s.konten?.nummer ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {s.konten?.bezeichnung ?? '—'}
                  </TableCell>
                  <TableCell>
                    {s.konten?.typ && (
                      <Badge variant="outline" className="font-normal">
                        {s.konten.typ}
                      </Badge>
                    )}
                  </TableCell>
                  <NumCell n={s.eb_soll} />
                  <NumCell n={s.eb_haben} />
                  <NumCell n={s.vk_soll} />
                  <NumCell n={s.vk_haben} />
                  <NumCell n={s.saldo_soll} />
                  <NumCell n={s.saldo_haben} />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function MetaField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <p className="font-medium text-slate-900 mt-0.5">{value}</p>
    </div>
  )
}

function NumCell({ n }: { n: number }) {
  return (
    <TableCell className="text-right tabular-nums text-sm">
      {n > 0 ? formatMoney(n) : '—'}
    </TableCell>
  )
}
