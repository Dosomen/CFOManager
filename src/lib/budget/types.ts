import type { Database } from '@/lib/types/database'

export type KontenTyp = Database['public']['Enums']['konten_typ']

export interface KontoWithBudget {
  konto_id: string
  nummer: string
  bezeichnung: string
  typ: KontenTyp
  budget_jahr: number | null // null = not yet budgeted
  ist_ytd: number // year-to-date actuals (already sign-corrected)
}

export interface BudgetRow {
  konto_id: string
  nummer: string
  bezeichnung: string
  typ: KontenTyp
  budget: number
  ist_ytd: number
  budget_ytd: number // budget proportional to elapsed months
  abweichung_absolut: number
  abweichung_prozent: number | null
}

export interface BudgetSummary {
  ertraege_budget: number
  ertraege_ist: number
  aufwendungen_budget: number
  aufwendungen_ist: number
  ergebnis_budget: number
  ergebnis_ist: number
}
