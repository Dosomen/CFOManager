'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { saveBudgetsAction } from '@/lib/actions/budgets'
import { projectAnnualFromYtd } from '@/lib/budget/calculations'
import { de } from '@/lib/messages/de'
import type { KontoWithBudget } from '@/lib/budget/types'

interface BudgetEditorProps {
  jahr: number
  konten: KontoWithBudget[]
  monthsElapsed: number
}

function formatEur(n: number): string {
  return (
    n.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' €'
  )
}

export function BudgetEditor({ jahr, konten, monthsElapsed }: BudgetEditorProps) {
  const router = useRouter()
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      konten.map((k) => [k.konto_id, k.budget_jahr != null ? String(k.budget_jahr) : ''])
    )
  )
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  function applyAutofill(growth = 0.05) {
    if (monthsElapsed === 0) {
      toast.error('Keine IST-Daten vorhanden — Auto-Befüllung nicht möglich.')
      return
    }
    const next: Record<string, string> = { ...values }
    for (const k of konten) {
      next[k.konto_id] = String(projectAnnualFromYtd(k.ist_ytd, monthsElapsed, growth))
    }
    setValues(next)
    toast.success(
      `Vorschlag erstellt: hochgerechneter IST × ${((1 + growth) * 100).toFixed(0)}% (${konten.length} Konten)`
    )
  }

  function submit() {
    setServerError(null)
    const entries = konten
      .map((k) => {
        const raw = (values[k.konto_id] ?? '').trim().replace(/\./g, '').replace(',', '.')
        const n = raw === '' ? 0 : Number(raw)
        return { konto_id: k.konto_id, betrag: Number.isFinite(n) ? n : 0 }
      })
      .filter((e) => Number.isFinite(e.betrag))

    startTransition(async () => {
      const result = await saveBudgetsAction({ jahr, entries })
      if (result.ok) {
        toast.success(`Budget für ${jahr} gespeichert (${result.data?.count} Konten).`)
        router.refresh()
      } else {
        setServerError(result.error)
      }
    })
  }

  const ertragKonten = konten.filter((k) => k.typ === 'Ertrag')
  const aufwandKonten = konten.filter((k) => k.typ === 'Aufwand')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={() => applyAutofill(0.05)} disabled={pending}>
          <Sparkles className="size-4" />
          {de.budget.editor.autofill}
        </Button>
        <Button onClick={submit} disabled={pending}>
          {pending ? de.common.loading : de.budget.editor.save}
        </Button>
      </div>

      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Section
        title={de.budget.editor.ertraegeSection}
        konten={ertragKonten}
        values={values}
        onChange={(id, v) => setValues((p) => ({ ...p, [id]: v }))}
        disabled={pending}
      />

      <Section
        title={de.budget.editor.aufwendungenSection}
        konten={aufwandKonten}
        values={values}
        onChange={(id, v) => setValues((p) => ({ ...p, [id]: v }))}
        disabled={pending}
      />
    </div>
  )
}

function Section({
  title,
  konten,
  values,
  onChange,
  disabled,
}: {
  title: string
  konten: KontoWithBudget[]
  values: Record<string, string>
  onChange: (id: string, v: string) => void
  disabled: boolean
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {title}
          <Badge variant="secondary" className="ml-2 font-normal">
            {konten.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Konto</TableHead>
              <TableHead>Bezeichnung</TableHead>
              <TableHead className="text-right w-[160px]">{de.budget.editor.istYtd}</TableHead>
              <TableHead className="text-right w-[180px]">{de.budget.editor.jahresBudget}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {konten.map((k) => (
              <TableRow key={k.konto_id}>
                <TableCell className="font-mono text-sm">{k.nummer}</TableCell>
                <TableCell className="text-sm">{k.bezeichnung}</TableCell>
                <TableCell className="text-right tabular-nums text-sm text-slate-600">
                  {k.ist_ytd === 0 ? '—' : formatEur(k.ist_ytd)}
                </TableCell>
                <TableCell>
                  <Input
                    inputMode="decimal"
                    placeholder="0,00"
                    value={values[k.konto_id] ?? ''}
                    onChange={(e) => onChange(k.konto_id, e.target.value)}
                    disabled={disabled}
                    className="text-right tabular-nums h-8"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
