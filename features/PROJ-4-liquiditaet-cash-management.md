# PROJ-4: Liquiditätsplanung & Cash Management

## Status: In Progress
**Created:** 2026-05-26
**Last Updated:** 2026-05-26

## Dependencies
- **Requires PROJ-1** (Auth + Multi-Mandant)
- **Requires PROJ-2** (Diamant-Import) — konten + salden Datenquelle

## User Stories
1. Als CFO möchte ich auf einen Blick wissen, wie liquide das Unternehmen aktuell ist (Bank, Forderungen, Verbindlichkeiten).
2. Als CFO möchte ich den Liquiditätsverlauf der letzten Monate sehen, um Cash-Burn oder -Wachstum zu erkennen.
3. Als CFO möchte ich eine grobe Prognose für die nächsten 3 Monate, damit ich frühzeitig Engpässe sehe.
4. Als CFO möchte ich auf einer Detail-Ebene sehen, welche Konten zu Forderungen und Verbindlichkeiten beitragen.

## Out of Scope (P1+)
- Forecast basierend auf konkreten Forderungsziel/Zahlungsziel pro Rechnung → braucht Buchungsjournal (PROJ-2-V2)
- Bank-Konten getrennt darstellen (mehrere Bankkonten) → P1
- Cash-Pool / mehrere Mandanten → PROJ-6 Konsolidierung
- „What-if" Szenarien (manuelle Annahmen) → P2
- Tagesgenaue Liquidität → braucht Daily Banking Data → P2
- Direkte Bankanbindung (HBCI/FinTS) → später

## Acceptance Criteria

**Format:** Angenommen / Wenn / Dann

- [ ] Angenommen Konten in den SKR03-Bereichen 1000-1299/1400-1599/1600-1799 sind vorhanden, wenn ich `/liquiditaet` öffne, dann sehe ich vier KPI-Karten (Bank, Forderungen, Verbindlichkeiten, Netto-Liquidität).
- [ ] Angenommen Daten für ≥ 2 Monate existieren, wenn ich die Seite öffne, dann sehe ich einen 12-Monats-Trend-Chart mit Bank- und Netto-Linie.
- [ ] Angenommen Daten für ≥ 2 Monate existieren, wenn der Chart gerendert wird, dann sind die nächsten 3 Monate als „Prognose" hellgrau hinterlegt, basierend auf der durchschnittlichen Monatsveränderung.
- [ ] Angenommen kein Import existiert, wenn ich die Seite öffne, dann sehe ich den Empty-State (gleicher wie auf Dashboard) mit CTA zu Import.
- [ ] Angenommen ich bin auf der Liquiditäts-Seite, dann sehe ich darunter zwei Tabellen mit Forderungen und Verbindlichkeiten breakdown pro Konto.
- [ ] Angenommen Netto-Liquidität ist negativ, wenn die KPI-Karte rendert, dann ist sie rot hervorgehoben.

## Edge Cases
- **Nur 1 Monat Daten** → Forecast wird leer (braucht ≥ 2 Monate zum Diff-bilden).
- **Year-rollover im Forecast** (Dez → Jan): Funktioniert via Monat-Increment-Logik.
- **Bank-Saldo negativ** (Überziehung): Wird als negativer Wert dargestellt, KPI-Karte bleibt aber grau.
- **Forderungen oder Verbindlichkeiten leer** für die Periode → Detail-Tabelle zeigt Empty-State.

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Konto-Nummer-basierte Buckets (SKR03-Ranges) statt konten_typ | Die SKR03-Ranges Bank/Forderungen/Verbindlichkeiten sind feiner als der konten_typ (Aktiva/Passiva). |
| In-JS-Aggregation statt eigene DB-View | Konto-Bucket-Logik ist domain-specific (SKR03), gehört nicht in die DB. ~600 salden-Rows sind klein genug. |
| Forecast: Mittelwert der letzten 3 Monatsdiffs | Einfachste sinnvolle Heuristik. Anspruchsvollere Forecasts → PROJ-5 (xP&A) oder P1-Erweiterung. |
| Recharts `ReferenceArea` für Prognose-Markierung | Visuelles Signal: Prognose ist anders als Ist. |

## Implementation Notes

**Library:**
- `src/lib/liquidity/types.ts` — `LiquidityBucket`, `LiquidityRow`, `LiquiditySnapshot`, `CashTrendPoint`
- `src/lib/liquidity/calculations.ts` — pure functions: `bucketFromKontoNummer`, `buildSnapshot`, `buildCashTrend` (mit Forecast)
- `src/lib/liquidity/queries.ts` — `getLiquidityRows` (alle Perioden, mandant-scoped), `getLiquidityDetail` (pro Bucket für eine Periode)

**Components:**
- `src/components/liquidity/cash-status-cards.tsx` — 4 KPI-Karten
- `src/components/liquidity/cash-trend-chart.tsx` — Recharts mit ReferenceArea für Prognose
- `src/components/liquidity/detail-table.tsx` — generische Detail-Tabelle pro Bucket

**Page:** `src/app/(app)/liquiditaet/page.tsx`

**Sidebar:** „Liquidität"-Eintrag (Wallet-Icon) zwischen Dashboard und Mandanten

**Tests:** 17 neue Unit-Tests in `calculations.test.ts` → 122 / 122 grün.

**Verification:** `npx tsc --noEmit` clean, `npm test --run` 122/122, dev-server hot-reloaded und antwortet auf `/liquiditaet`.
