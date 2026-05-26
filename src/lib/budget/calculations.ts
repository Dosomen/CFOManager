import type { BudgetRow, BudgetSummary, KontoWithBudget } from './types'

/**
 * Builds the Soll-Ist comparison row per konto.
 *
 * - For Ertrag/Aufwand konten:
 *     budget = jährlicher Betrag (kann 0 sein)
 *     budget_ytd = budget * (monatsAnzahl / 12)
 *     ist_ytd = bereits aus Salden berechnet (positiv)
 * - Abweichung = ist - budget_ytd
 *     positiv für Ertrag = besser; positiv für Aufwand = schlechter
 *
 * Konten ohne Budget werden mit budget=0 angezeigt (User hat noch nichts geplant).
 */
export function buildBudgetRows(
  konten: KontoWithBudget[],
  monthsElapsed: number
): BudgetRow[] {
  return konten.map((k) => {
    const budget = k.budget_jahr ?? 0
    const budget_ytd = budget * (monthsElapsed / 12)
    const ist = k.ist_ytd
    const abweichung_absolut = ist - budget_ytd
    const abweichung_prozent =
      budget_ytd !== 0 ? abweichung_absolut / Math.abs(budget_ytd) : null
    return {
      konto_id: k.konto_id,
      nummer: k.nummer,
      bezeichnung: k.bezeichnung,
      typ: k.typ,
      budget,
      ist_ytd: ist,
      budget_ytd,
      abweichung_absolut,
      abweichung_prozent,
    }
  })
}

export function buildBudgetSummary(rows: BudgetRow[]): BudgetSummary {
  let eb = 0,
    ei = 0,
    ab = 0,
    ai = 0
  for (const r of rows) {
    if (r.typ === 'Ertrag') {
      eb += r.budget_ytd
      ei += r.ist_ytd
    } else if (r.typ === 'Aufwand') {
      ab += r.budget_ytd
      ai += r.ist_ytd
    }
  }
  return {
    ertraege_budget: eb,
    ertraege_ist: ei,
    aufwendungen_budget: ab,
    aufwendungen_ist: ai,
    ergebnis_budget: eb - ab,
    ergebnis_ist: ei - ai,
  }
}

/**
 * For the "Budget aus Vorjahres-IST ableiten"-Button: estimates next-year
 * annual amount from observed YTD actuals (extrapolated to 12 months) plus
 * a growth factor.
 */
export function projectAnnualFromYtd(
  ist_ytd: number,
  monthsElapsed: number,
  growthFactor: number
): number {
  if (monthsElapsed === 0) return 0
  const annualised = (ist_ytd / monthsElapsed) * 12
  return Math.round(annualised * (1 + growthFactor) * 100) / 100
}
