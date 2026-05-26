# PROJ-3: Reporting & Dashboards (GuV, Bilanz, KPIs)

## Status: In Progress
**Created:** 2026-05-26
**Last Updated:** 2026-05-26

## Dependencies
- **Requires PROJ-1** (Auth + Multi-Mandant) — Mandant-Filtering
- **Requires PROJ-2** (Diamant-Import) — Datenquelle (konten + salden)

## User Stories
1. Als CFO möchte ich beim Login sofort ein Dashboard mit den wichtigsten KPIs sehen, damit ich den Geschäftsverlauf ohne Excel-Gefriemel überblicken kann.
2. Als CFO möchte ich den Monat wählen können, damit ich Vergangenheit und aktuelle Periode vergleichen kann.
3. Als CFO möchte ich Umsatz und Ergebnis als 12-Monats-Trend sehen, damit ich Saisonalität und Entwicklung erkenne.
4. Als CFO möchte ich Vorperiodenvergleich in den KPI-Karten, damit ich Verbesserungen/Verschlechterungen sofort sehe.
5. Als CFO möchte ich eine GuV- und eine Bilanz-Übersicht, damit ich Erträge/Aufwendungen und Aktiva/Passiva zusammengefasst sehe.

## Out of Scope (P1+)
- Drill-Down pro Konto/Buchung → P1 (braucht Buchungsjournal aus PROJ-2-V2)
- Quartals-/Jahresaggregation in einer einzigen Ansicht → P1
- BWA in „Diamant-Format" mit detaillierter Gliederung → P1
- Export als PDF/Excel → P2
- Soll-Ist-Vergleich → braucht PROJ-5 (Forecasting)
- Mehrere Mandanten gleichzeitig (Konzern-View) → PROJ-6
- Custom-Reports / Dashboard-Editor → später
- Echtzeit-Updates → später

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

- [ ] Angenommen ich habe noch keinen Import durchgeführt, wenn ich /dashboard öffne, dann sehe ich einen Empty-State mit „Daten importieren"-Button.
- [ ] Angenommen ich habe Daten für mindestens einen Monat, wenn ich /dashboard öffne, dann sehe ich den jüngsten Monat mit allen KPIs gefüllt.
- [ ] Angenommen ich habe Daten für mehrere Monate, wenn ich im Period-Picker einen anderen Monat wähle, dann lädt die Seite mit dem gewählten Monat (URL wird zu `?jahr=...&monat=...`).
- [ ] Angenommen ein Vormonat existiert, wenn ich das Dashboard ansehe, dann zeigen die KPI-Karten Veränderung in % gegenüber dem Vormonat.
- [ ] Angenommen Umsatz oder Aufwand sind im Vormonat 0, wenn die KPI-Karte rendert, dann wird statt einer falschen Prozent-Berechnung „kein Vormonat" gezeigt.
- [ ] Angenommen Daten für die letzten 12 Monate existieren, wenn ich den Trend-Chart ansehe, dann sehe ich zwei Linien (Umsatz blau, Ergebnis grün) chronologisch sortiert.
- [ ] Angenommen ich öffne das Dashboard, wenn die Bilanz angezeigt wird, dann zeigt sie Aktiva + Passiva + Differenz (grün wenn ausgeglichen, gelb wenn nicht).

## Edge Cases
- **Periode ohne Daten gewählt (über URL gehackt):** Dashboard fällt auf jüngste verfügbare Periode zurück.
- **Mandant gewechselt:** App-Layout reloaded, jüngste verfügbare Periode des neuen Mandanten wird angezeigt.
- **Vormonat existiert nicht** (z.B. erster Monat): KPI-Karten zeigen „kein Vormonat" statt Prozentveränderung.
- **Aufwand höher als Ertrag (negatives Ergebnis):** KPI-Karte „Ergebnis" wird rot, GuV-Zeile bekommt rotes Vorzeichen.
- **Mandant gewechselt während ungeöffnetes Tab:** Bei Reload zeigt das Dashboard die Daten des neuen aktiven Mandanten (Server-Component-Logik).

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Postgres-View `salden_monthly_by_typ` für Aggregation | Verschiebt SUM/GROUP BY zur DB → eine Query statt 50+ JS-Reduktionen; RLS-konsistent via security_invoker. |
| Recharts für Charts | Standard im React-Ökosystem, gut dokumentiert, ~150 KB. Tremor wäre alternativ aber Overhead. |
| Server Components für Datenabruf, Client nur für Chart + Period-Picker | Minimaler JS-Bundle, schnelles First Render. |
| Period via URL-Search-Params (`?jahr=2026&monat=3`) | Bookmarkable, Browser-Back funktioniert, Server-Component liest direkt. |
| Vorperiodenvergleich = letzter Vormonat | Einfacher als „gleiche Periode Vorjahr" — Vorjahresvergleich ist P1. |
| Pure-function `buildPeriodReport` / `buildTrend` + Unit Tests | Trennt Berechnung von I/O → einfach testbar; 14 neue Unit-Tests. |

## Implementation Notes

**Migration:** `supabase/migrations/20260526120000_create_reporting_view.sql` — eine Aggregations-View mit `security_invoker = true` (RLS inheriting).

**Library:**
- `src/lib/reports/types.ts` — TypeScript-Typen für Aggregate und Reports
- `src/lib/reports/calculations.ts` — pure functions: `buildPeriodReport`, `buildTrend`, `percentChange`, `formatPeriod`
- `src/lib/reports/queries.ts` — Server-side DB-Queries: `getAvailablePeriods`, `getMonthlyAggregates`, `getTrendAggregates`, `previousPeriod`

**Components:**
- `src/components/dashboard/kpi-cards.tsx` — 4 KPIs mit Vorperiodenvergleich
- `src/components/dashboard/period-picker.tsx` — Client, URL-basiertes Routing
- `src/components/dashboard/guv-table.tsx` — Erträge / Aufwendungen / Ergebnis
- `src/components/dashboard/bilanz-table.tsx` — Aktiva / Passiva / Differenz
- `src/components/dashboard/trend-chart.tsx` — Client, Recharts LineChart
- `src/components/dashboard/no-data-state.tsx` — Empty State

**Page:** `src/app/(app)/dashboard/page.tsx` — komplette Neuauflage (war Placeholder).

**Dependency:** `recharts` ~150 KB gzipped.

**Tests:** 8 neue Unit-Tests in `calculations.test.ts` → 105 / 105 grün.

**Verification:** `npx tsc --noEmit` clean, `npm run build` succeeds, alle 13 Routes vorhanden.
