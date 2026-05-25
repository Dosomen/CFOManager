'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
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

type ImportRow = Pick<
  Database['public']['Tables']['importe']['Row'],
  | 'id'
  | 'created_at'
  | 'periode_jahr'
  | 'periode_monat'
  | 'dateiname'
  | 'status'
  | 'anzahl_konten'
  | 'anzahl_salden'
  | 'summe_soll'
  | 'summe_haben'
  | 'created_by'
>

interface ImportListProps {
  importe: ImportRow[]
}

const monthLabels = [
  'Jan',
  'Feb',
  'Mär',
  'Apr',
  'Mai',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Okt',
  'Nov',
  'Dez',
]

function formatPeriod(jahr: number, monat: number): string {
  return `${monthLabels[monat - 1]} ${jahr}`
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

function statusLabel(status: ImportRow['status']): string {
  if (status === 'erfolgreich') return de.importe.list.statusErfolgreich
  if (status === 'ueberschrieben') return de.importe.list.statusUeberschrieben
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

export function ImportList({ importe }: ImportListProps) {
  const router = useRouter()

  if (importe.length === 0) {
    return (
      <Card className="p-12 text-center text-slate-500">
        {de.importe.list.empty}
      </Card>
    )
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{de.importe.list.columnDatum}</TableHead>
            <TableHead>{de.importe.list.columnPeriode}</TableHead>
            <TableHead>{de.importe.list.columnDateiname}</TableHead>
            <TableHead>{de.importe.list.columnStatus}</TableHead>
            <TableHead className="text-right">{de.importe.list.columnKonten}</TableHead>
            <TableHead className="text-right">{de.importe.list.columnSalden}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {importe.map((row) => (
            <TableRow
              key={row.id}
              className="cursor-pointer hover:bg-slate-50"
              onClick={() => router.push(`/importe/${row.id}`)}
            >
              <TableCell className="text-slate-700">
                {formatDateTime(row.created_at)}
              </TableCell>
              <TableCell className="font-medium">
                {formatPeriod(row.periode_jahr, row.periode_monat)}
              </TableCell>
              <TableCell className="text-slate-600 max-w-[280px] truncate">
                <Link
                  href={`/importe/${row.id}`}
                  className="hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {row.dateiname}
                </Link>
              </TableCell>
              <TableCell>
                <StatusBadge status={row.status} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.anzahl_konten}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.anzahl_salden}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
