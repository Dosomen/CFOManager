# PROJ-5: Planung & Forecasting (xP&A)

## Status: In Progress
**Created:** 2026-05-26
**Last Updated:** 2026-05-26

## Dependencies
- **Requires PROJ-1** + **PROJ-2** (Konten + Salden) + **PROJ-3** (Reports-Lib für Wiederverwendung)

## User Stories
1. Als CFO möchte ich jährliche Budgets pro Konto pflegen, damit ich Soll-Ist-Vergleiche fahren kann.
2. Als CFO möchte ich auf Knopfdruck einen Budgetvorschlag aus dem IST des aktuellen Jahres ableiten (× Wachstumsfaktor), damit ich nicht bei Null starte.
3. Als CFO möchte ich pro Konto und für Erträge/Aufwendungen/Ergebnis insgesamt die Abweichung in absolut und % sehen.

## Out of Scope (P1+)
- Monatlich abweichende Budget-Werte (statt 1/12-Aufteilung) → P1
- Rolling Forecast bis Jahresende → P1
- Mehrere Budget-Versionen pro Jahr → P2
- Budget-Workflow (Approval) → P2
- Excel-Import von Budgets → P1

## Acceptance Criteria
- [ ] Angenommen ich öffne /planung, wenn IST-Daten für das gewählte Jahr existieren, dann sehe ich pro Konto IST (YTD) + leeres Budget-Input.
- [ ] Angenommen ich klicke „Aus Vorjahres-IST × 1,05", wenn IST existiert, dann werden alle Konten mit dem hochgerechneten IST + 5 % vorbelegt.
- [ ] Angenommen ich gebe Budgets ein und klicke „Speichern", dann werden alle Werte transaktional in `budgets` upserted (Konflikt auf konto_id+jahr).
- [ ] Angenommen Budgets sind gepflegt, wenn ich auf den Vergleichs-Tab wechsle, dann sehe ich pro Konto IST-YTD vs. Budget-YTD-anteilig + Abweichung (Ertrag positiv = grün, Aufwand positiv = rot).
- [ ] Angenommen ich öffne /planung ohne IST-Daten, dann sehe ich den Empty-State (gleicher Component wie Dashboard).

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Eine Zeile pro (konto, jahr), `betrag numeric(18,2)` | Einfachstes Modell, deckt 90 % der CFO-Bedürfnisse. Monatlicher Override kommt in P1. |
| Budget-YTD = Budget × (verstrichene Monate / 12) | Saisonalität ignoriert — pragmatischer Default, der für die meisten Mittelständler ausreicht. |
| RLS analog zu konten/salden via `user_has_mandant_access` | Konsistentes Schutz-Pattern. |
| Tabs „Vergleich" / „Editor" auf einer Seite | Schnelles Hin-und-Her ohne separates URL-Routing. |
| Inline-Editor (alle Konten + Inputs in einem Form) | Excel-ähnliche UX für CFOs; ein „Speichern"-Klick reicht. |

## Implementation Notes

**Migration:** `supabase/migrations/20260526150000_create_budgets.sql` — Tabelle `budgets` mit Unique-Constraint (konto_id, jahr), updated_at-Trigger, RLS.

**Library:**
- `src/lib/budget/types.ts` — KontoWithBudget, BudgetRow, BudgetSummary
- `src/lib/budget/calculations.ts` — `buildBudgetRows`, `buildBudgetSummary`, `projectAnnualFromYtd` (für Autofill)
- `src/lib/budget/queries.ts` — `getKontenWithBudget`, `getAvailableBudgetYears`, `getLatestMonthInYear`
- `src/lib/validators/budget.ts` — `saveBudgetsSchema` (z.array of {konto_id, betrag})
- `src/lib/actions/budgets.ts` — `saveBudgetsAction` (UPSERT on conflict konto_id+jahr)

**Components:**
- `src/components/budget/budget-editor.tsx` — Inline-Editor mit Erträge/Aufwendungen-Sektionen, „Aus Vorjahres-IST"-Autofill
- `src/components/budget/budget-vergleich.tsx` — `BudgetSummaryCards` + `BudgetVergleichTable`

**Page:** `src/app/(app)/planung/page.tsx` mit shadcn Tabs (Vergleich / Editor).

**Sidebar:** „Planung"-Eintrag (LineChart-Icon) zwischen Dashboard und Liquidität.
