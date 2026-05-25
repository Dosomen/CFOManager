'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  X,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { parseDiamantFile, type DiamantImportData } from '@/lib/parser/diamant'
import {
  checkPeriodExistsAction,
  createImportAction,
} from '@/lib/actions/importe'
import { de } from '@/lib/messages/de'

interface ImportWizardProps {
  activeMandant: { id: string; name: string }
}

type Step = 1 | 2

const MAX_FILE_SIZE = 10 * 1024 * 1024

const monthOptions = [
  { value: 1, label: 'Januar' },
  { value: 2, label: 'Februar' },
  { value: 3, label: 'März' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Dezember' },
]

function defaultPeriod(): { jahr: number; monat: number } {
  const now = new Date()
  // Default to previous month
  now.setMonth(now.getMonth() - 1)
  return { jahr: now.getFullYear(), monat: now.getMonth() + 1 }
}

function formatPeriod(jahr: number, monat: number): string {
  return `${monthOptions[monat - 1].label} ${jahr}`
}

function formatMoney(s: string): string {
  return Number(s).toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function ImportWizard({ activeMandant }: ImportWizardProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>(1)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [parsed, setParsed] = useState<DiamantImportData | null>(null)
  const [parsing, setParsing] = useState(false)
  const [periodExists, setPeriodExists] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [{ jahr, monat }, setPeriod] = useState(defaultPeriod)
  const [dragOver, setDragOver] = useState(false)
  // Snapshot the mandant id at mount so we can detect a switch mid-wizard
  const initialMandantId = useRef(activeMandant.id)

  // If the user switches mandant mid-wizard, reset.
  useEffect(() => {
    if (activeMandant.id !== initialMandantId.current) {
      toast.error(de.importe.errors.mandantChanged)
      setStep(1)
      setFile(null)
      setParsed(null)
      initialMandantId.current = activeMandant.id
    }
  }, [activeMandant.id])

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear()
    return [current - 2, current - 1, current]
  }, [])

  const validateFile = useCallback((f: File): string | null => {
    if (!f.name.toLowerCase().endsWith('.xlsx')) {
      return de.importe.errors.wrongFileType
    }
    if (f.size > MAX_FILE_SIZE) {
      return de.importe.errors.fileTooBig
    }
    return null
  }, [])

  const handleFile = useCallback(
    (f: File) => {
      const err = validateFile(f)
      if (err) {
        setFileError(err)
        setFile(null)
        return
      }
      setFileError(null)
      setFile(f)
    },
    [validateFile]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragOver(false)
      const f = e.dataTransfer.files?.[0]
      if (f) handleFile(f)
    },
    [handleFile]
  )

  const goToStep2 = useCallback(async () => {
    if (!file) return
    setParsing(true)
    setSubmitError(null)
    try {
      const result = await parseDiamantFile(file)
      setParsed(result)
      // If the file's header had a different period, suggest it.
      if (result.periode) {
        setPeriod(result.periode)
      }
      const periodToCheck = result.periode ?? { jahr, monat }
      const exists = await checkPeriodExistsAction(
        periodToCheck.jahr,
        periodToCheck.monat
      )
      setPeriodExists(exists.ok && exists.data?.exists === true)
      setStep(2)
    } catch (e) {
      setFileError(de.importe.errors.parseFailed)
    } finally {
      setParsing(false)
    }
  }, [file, jahr, monat])

  const back = useCallback(() => {
    setStep(1)
    setParsed(null)
    setSubmitError(null)
  }, [])

  const submit = useCallback(() => {
    if (!parsed || !file) return
    setSubmitError(null)
    startTransition(async () => {
      const result = await createImportAction({
        jahr,
        monat,
        dateiname: file.name,
        konten: parsed.konten,
        salden: parsed.salden,
        summe_soll: parsed.summen.soll,
        summe_haben: parsed.summen.haben,
      })
      if (result.ok && result.data) {
        const msg = result.data.was_overwritten
          ? de.importe.wizard.successOverwritten
              .replace('{konten}', String(parsed.konten.length))
              .replace('{salden}', String(parsed.salden.length))
          : de.importe.wizard.success
              .replace('{konten}', String(parsed.konten.length))
              .replace('{salden}', String(parsed.salden.length))
        toast.success(msg)
        router.push('/importe')
        router.refresh()
      } else if (!result.ok) {
        setSubmitError(result.error)
      }
    })
  }, [parsed, file, jahr, monat, router])

  const sumSollNum = parsed ? Number(parsed.summen.soll) : 0
  const sumHabenNum = parsed ? Number(parsed.summen.haben) : 0
  const sumsMatch = parsed ? Math.abs(sumSollNum - sumHabenNum) < 0.01 : false
  const hasErrors = parsed ? parsed.errors.length > 0 : false
  const canSubmit = parsed && !hasErrors && sumsMatch && !pending

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" asChild className="-ml-2">
          <Link href="/importe">
            <ArrowLeft className="size-4" />
            Zurück zur Liste
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{de.importe.wizard.title}</CardTitle>
          <Stepper step={step} />
          <div className="flex items-center gap-2 text-sm text-slate-600 pt-2">
            <Building2 className="size-4 text-slate-500" />
            <span>
              {de.importe.wizard.activeMandantHint.replace(
                '{mandant}',
                activeMandant.name
              )}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <Step1
              file={file}
              fileError={fileError}
              dragOver={dragOver}
              parsing={parsing}
              jahr={jahr}
              monat={monat}
              yearOptions={yearOptions}
              fileInputRef={fileInputRef}
              onSetDragOver={setDragOver}
              onDrop={handleDrop}
              onFile={handleFile}
              onClear={() => {
                setFile(null)
                setFileError(null)
              }}
              onYear={(v) => setPeriod((p) => ({ ...p, jahr: v }))}
              onMonth={(v) => setPeriod((p) => ({ ...p, monat: v }))}
              onNext={goToStep2}
            />
          )}

          {step === 2 && parsed && (
            <Step2
              parsed={parsed}
              jahr={jahr}
              monat={monat}
              periodExists={periodExists}
              submitError={submitError}
              sumsMatch={sumsMatch}
              hasErrors={hasErrors}
              canSubmit={!!canSubmit}
              pending={pending}
              onBack={back}
              onSubmit={submit}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// --- Sub-components --------------------------------------------------

function Stepper({ step }: { step: Step }) {
  const items = [
    { id: 1 as Step, label: de.importe.wizard.step1Title },
    { id: 2 as Step, label: de.importe.wizard.step2Title },
  ]
  return (
    <div className="flex items-center gap-3 pt-3">
      {items.map((item, idx) => (
        <div key={item.id} className="flex items-center gap-3">
          <div
            className={
              'size-7 rounded-full flex items-center justify-center text-xs font-semibold ' +
              (step >= item.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-slate-200 text-slate-500')
            }
          >
            {item.id}
          </div>
          <span
            className={
              'text-sm ' +
              (step === item.id ? 'font-medium text-slate-900' : 'text-slate-500')
            }
          >
            {item.label}
          </span>
          {idx < items.length - 1 && (
            <div className="w-8 h-px bg-slate-200" aria-hidden />
          )}
        </div>
      ))}
    </div>
  )
}

interface Step1Props {
  file: File | null
  fileError: string | null
  dragOver: boolean
  parsing: boolean
  jahr: number
  monat: number
  yearOptions: number[]
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onSetDragOver: (v: boolean) => void
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void
  onFile: (f: File) => void
  onClear: () => void
  onYear: (v: number) => void
  onMonth: (v: number) => void
  onNext: () => void
}

function Step1({
  file,
  fileError,
  dragOver,
  parsing,
  jahr,
  monat,
  yearOptions,
  fileInputRef,
  onSetDragOver,
  onDrop,
  onFile,
  onClear,
  onYear,
  onMonth,
  onNext,
}: Step1Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>{de.importe.wizard.fileLabel}</Label>
        <div
          role="button"
          tabIndex={0}
          aria-label={de.importe.wizard.dropZoneText}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
          }}
          onDragOver={(e) => {
            e.preventDefault()
            onSetDragOver(true)
          }}
          onDragLeave={() => onSetDragOver(false)}
          onDrop={onDrop}
          className={
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ' +
            (dragOver
              ? 'border-primary bg-primary/5'
              : 'border-slate-300 bg-slate-50 hover:bg-slate-100')
          }
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileSpreadsheet className="size-6 text-emerald-600" />
              <div className="text-left">
                <p className="font-medium text-slate-900">{file.name}</p>
                <p className="text-xs text-slate-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  onClear()
                }}
                aria-label="Datei entfernen"
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="size-8 mx-auto text-slate-400" />
              <p className="font-medium text-slate-700">
                {de.importe.wizard.dropZoneText}
              </p>
              <p className="text-xs text-slate-500">
                {de.importe.wizard.dropZoneHint}
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onFile(f)
            }}
          />
        </div>
        {fileError && (
          <Alert variant="destructive">
            <AlertDescription>{fileError}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{de.importe.wizard.yearLabel}</Label>
          <Select value={String(jahr)} onValueChange={(v) => onYear(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{de.importe.wizard.monthLabel}</Label>
          <Select value={String(monat)} onValueChange={(v) => onMonth(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((m) => (
                <SelectItem key={m.value} value={String(m.value)}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!file || parsing}>
          {parsing ? de.common.loading : de.importe.wizard.next}
        </Button>
      </div>
    </div>
  )
}

interface Step2Props {
  parsed: DiamantImportData
  jahr: number
  monat: number
  periodExists: boolean
  submitError: string | null
  sumsMatch: boolean
  hasErrors: boolean
  canSubmit: boolean
  pending: boolean
  onBack: () => void
  onSubmit: () => void
}

function Step2({
  parsed,
  jahr,
  monat,
  periodExists,
  submitError,
  sumsMatch,
  hasErrors,
  canSubmit,
  pending,
  onBack,
  onSubmit,
}: Step2Props) {
  return (
    <div className="space-y-6">
      {/* Detected metadata */}
      <div className="grid grid-cols-2 gap-4">
        <SummaryBox
          label={de.importe.wizard.detectedKonten.replace(
            '{n}',
            String(parsed.konten.length)
          )}
          value={parsed.konten.length}
        />
        <SummaryBox
          label={de.importe.wizard.detectedSalden.replace(
            '{n}',
            String(parsed.salden.length)
          )}
          value={parsed.salden.length}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-slate-500">{de.importe.wizard.periodLabel}</p>
          <p className="font-medium text-slate-900">{formatPeriod(jahr, monat)}</p>
        </div>
        {parsed.kontenrahmen && (
          <div>
            <p className="text-slate-500">Kontenrahmen</p>
            <p className="font-medium text-slate-900">{parsed.kontenrahmen}</p>
          </div>
        )}
      </div>

      {/* Soll/Haben balance check */}
      <div
        className={
          'rounded-lg border p-4 ' +
          (sumsMatch
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-red-50 border-red-200')
        }
      >
        <div className="flex items-start gap-2">
          {sumsMatch ? (
            <CheckCircle2 className="size-5 text-emerald-600 mt-0.5" />
          ) : (
            <XCircle className="size-5 text-red-600 mt-0.5" />
          )}
          <div className="flex-1">
            <p
              className={
                'font-medium ' +
                (sumsMatch ? 'text-emerald-900' : 'text-red-900')
              }
            >
              {sumsMatch ? de.importe.wizard.sumMatch : de.importe.wizard.sumMismatch}
            </p>
            <div className="text-sm mt-1 grid grid-cols-2 gap-x-6 tabular-nums">
              <span className="text-slate-600">
                {de.importe.wizard.sumSoll}: {formatMoney(parsed.summen.soll)} €
              </span>
              <span className="text-slate-600">
                {de.importe.wizard.sumHaben}: {formatMoney(parsed.summen.haben)} €
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Parser errors */}
      {hasErrors && (
        <Alert variant="destructive">
          <AlertTitle>Validierungsfehler</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              {parsed.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Parser warnings */}
      {parsed.warnings.length > 0 && (
        <Alert>
          <AlertDescription>
            <ul className="list-disc pl-5 space-y-1">
              {parsed.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Overwrite warning */}
      {periodExists && !hasErrors && (
        <Alert className="border-amber-300 bg-amber-50">
          <AlertDescription className="text-amber-900">
            ⚠️{' '}
            {de.importe.wizard.overwriteWarning.replace(
              '{period}',
              formatPeriod(jahr, monat)
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Submit error */}
      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* Preview table */}
      {parsed.konten.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">
            {de.importe.wizard.previewTitle}
          </p>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Konto</TableHead>
                  <TableHead>Bezeichnung</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead className="text-right">Saldo Soll</TableHead>
                  <TableHead className="text-right">Saldo Haben</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsed.konten.slice(0, 20).map((k, i) => {
                  const s = parsed.salden[i]
                  return (
                    <TableRow key={k.nummer}>
                      <TableCell className="font-mono text-sm">{k.nummer}</TableCell>
                      <TableCell className="text-sm">{k.bezeichnung}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {k.typ}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {Number(s?.saldo_soll ?? '0') > 0
                          ? formatMoney(s!.saldo_soll)
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {Number(s?.saldo_haben ?? '0') > 0
                          ? formatMoney(s!.saldo_haben)
                          : '—'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          {parsed.konten.length > 20 && (
            <p className="text-xs text-slate-500 text-right">
              ... und {parsed.konten.length - 20} weitere
            </p>
          )}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} disabled={pending}>
          <ArrowLeft className="size-4" />
          {de.importe.wizard.back}
        </Button>
        <Button onClick={onSubmit} disabled={!canSubmit}>
          {pending ? de.common.loading : de.importe.wizard.confirm}
        </Button>
      </div>
    </div>
  )
}

function SummaryBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-3xl font-semibold tabular-nums text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label.replace(/\d+\s*/, '')}</p>
    </div>
  )
}
