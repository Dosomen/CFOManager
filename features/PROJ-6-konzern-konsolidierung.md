# PROJ-6: Konzern-Konsolidierung (Multi-Mandant)

## Status: In Progress
**Created:** 2026-05-26
**Last Updated:** 2026-05-26

## Dependencies
- **Requires PROJ-1** (Multi-Mandant) + **PROJ-2** (Konten/Salden) + **PROJ-3** (Reports-Komponenten zur Wiederverwendung)

## User Stories
1. Als CFO eines Konzerns möchte ich eine konsolidierte Sicht über alle meine Mandanten haben — ohne manuelles Excel-Zusammenkopieren.
2. Als CFO möchte ich pro Mandant sehen, wer wieviel zum Konzern-Ergebnis beiträgt (Aufschlüsselungs-Tabelle).
3. Als CFO möchte ich Period-Picker und 12-Monats-Trend auch auf Konzern-Ebene haben.

## Out of Scope (P1+/P2)
- **IC-Eliminierung** (Inter-Company-Buchungen herausrechnen) → P1, sobald wir Konzerngesellschaften kennen und IC-Konten taggen können
- Endkonsolidierung (Equity Pickup, Goodwill-Bilanzierung) → P2
- Währungsumrechnung (Fremdwährungsmandanten) → P2
- Quotenkonsolidierung / Equity-Konsolidierung → P2
- Separater Konzern-Kontenrahmen / Mapping → P2
- Konzernumlagen → später

## Acceptance Criteria
- [ ] Angenommen ich habe Zugriff auf mehrere Mandanten mit Daten, wenn ich /konzern öffne, dann sehe ich aggregierte KPI-Karten + GuV + Bilanz.
- [ ] Angenommen ich öffne /konzern, dann sehe ich einen Hinweis-Banner: „Diese Ansicht summiert ohne IC-Eliminierung".
- [ ] Angenommen mehr als 1 Mandant trägt bei, dann sehe ich eine Aufschlüsselungs-Tabelle „Beiträge pro Mandant" mit Erträge/Aufwendungen/Ergebnis/Bank/Forderungen/Verbindlichkeiten pro Mandant + Konzern-Summenzeile.
- [ ] Angenommen ich wechsle die Periode, dann lädt die Seite mit `?jahr=...&monat=...` neu.
- [ ] Angenommen ich habe nur einen Mandanten, dann zeigt die Seite die gleichen Aggregate wie das normale Dashboard (ohne separate Aufschlüsselungs-Tabelle).
- [ ] Angenommen ich habe gar keinen Mandanten oder keine Daten, dann sehe ich den Empty-State.

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Wiederverwendung der `salden_monthly_by_typ` View ohne `mandant_id`-Filter | RLS via `security_invoker=true` filtert automatisch auf die für den User sichtbaren Mandanten — keine zusätzliche Sicherheits-Logik nötig. |
| Wiederverwendung von `buildPeriodReport`/`buildTrend`/`KpiCards`/`GuvTable`/`BilanzTable`/`TrendChart` | Die Reports-Lib filtert nicht nach Mandant — sie summiert nur, was reinkommt. Funktioniert identisch für ein-Mandant und Konzern. |
| Eigene `lib/konzern/queries.ts` statt Generalisierung der Reports-Queries | Bewahrt klare Trennung: „/dashboard" = single mandant, „/konzern" = consolidated. Sonst hätten beide Pfade einen `mandantId | null`-Branch. |
| Aufschlüsselungs-Tabelle pro Mandant in eigenem Component | Demos verlangen sichtbaren Beitrag pro Tochter — sonst wirkt es wie ein gewöhnliches Dashboard. |
| Liquidität-Buckets über SKR03-Nummernbereiche (gleich wie /liquiditaet) | Konsistente Klassifizierung; kein neues Mapping zu pflegen. |

## Implementation Notes

**Library:**
- `src/lib/konzern/queries.ts` — `getKonzernMandanten`, `getKonzernAvailablePeriods`, `getKonzernMonthlyAggregates`, `getKonzernTrendAggregates`, `getMandantContributions`

**Components:**
- `src/components/konzern/contributions-table.tsx` — Aufschlüsselungs-Tabelle mit Konzern-Summenzeile

**Page:** `src/app/(app)/konzern/page.tsx` — Server Component, Period-Picker URL-gesteuert wie Dashboard

**Sidebar:** „Konzern"-Eintrag (Building-Icon) zwischen Dashboard und Planung

**Verification:** tsc clean, build green mit 17 Routes (added /konzern).

## Limits

- IC-Eliminierung fehlt → Konzern-Umsätze sind zu hoch wenn Töchter intern Leistungen verrechnen. Demo-tauglich, aber NICHT für rechtliche Berichterstattung.
- Mehrere Währungen werden 1:1 summiert (kein FX). Mandanten müssen in MVP-Stand alle EUR sein.
