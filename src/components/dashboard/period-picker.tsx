'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { MONTH_LONG } from '@/lib/reports/calculations'
import type { AvailablePeriod } from '@/lib/reports/types'
import { de } from '@/lib/messages/de'

interface PeriodPickerProps {
  selected: { jahr: number; monat: number }
  available: AvailablePeriod[]
}

export function PeriodPicker({ selected, available }: PeriodPickerProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const years = Array.from(new Set(available.map((p) => p.jahr))).sort((a, b) => b - a)
  const monthsForYear = (jahr: number) =>
    available
      .filter((p) => p.jahr === jahr)
      .map((p) => p.monat)
      .sort((a, b) => a - b)
  const currentMonths = monthsForYear(selected.jahr)

  function navigate(jahr: number, monat: number) {
    startTransition(() => {
      router.push(`/dashboard?jahr=${jahr}&monat=${monat}`)
    })
  }

  return (
    <div className="flex items-end gap-3">
      <div className="space-y-1">
        <Label className="text-xs text-slate-500">{de.dashboard.period.year}</Label>
        <Select
          value={String(selected.jahr)}
          onValueChange={(v) => {
            const newYear = Number(v)
            const months = monthsForYear(newYear)
            const newMonat = months.includes(selected.monat)
              ? selected.monat
              : (months[months.length - 1] ?? selected.monat)
            navigate(newYear, newMonat)
          }}
          disabled={pending}
        >
          <SelectTrigger className="w-[110px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-slate-500">{de.dashboard.period.month}</Label>
        <Select
          value={String(selected.monat)}
          onValueChange={(v) => navigate(selected.jahr, Number(v))}
          disabled={pending}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {currentMonths.map((m) => (
              <SelectItem key={m} value={String(m)}>
                {MONTH_LONG[m - 1]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
