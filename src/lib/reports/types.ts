import type { Database } from '@/lib/types/database'

export type KontenTyp = Database['public']['Enums']['konten_typ']

export interface MonthlyAggregate {
  jahr: number
  monat: number
  typ: KontenTyp
  sum_eb_soll: number
  sum_eb_haben: number
  sum_vk_soll: number
  sum_vk_haben: number
  sum_saldo_soll: number
  sum_saldo_haben: number
  anzahl_konten: number
}

export interface PeriodReport {
  jahr: number
  monat: number
  // GuV
  ertraege: number
  aufwendungen: number
  ergebnis: number
  ergebnisMarge: number | null // null when ertraege == 0
  // Bilanz
  aktiva: number
  passiva: number
}

export interface TrendPoint {
  jahr: number
  monat: number
  label: string // "Jan 2026"
  umsatz: number
  ergebnis: number
}

export interface AvailablePeriod {
  jahr: number
  monat: number
}
