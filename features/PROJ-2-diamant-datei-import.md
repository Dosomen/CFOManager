# PROJ-2: Diamant Datei-Import (Excel)

> **Hinweis:** Trotz INDEX-Titel im MVP **nur Excel (.xlsx)**, fokussiert auf **Summen-/Saldenliste + Kontenrahmen**. CSV/XML und Buchungsjournal in P1.

## Status: Planned
**Created:** 2026-05-24
**Last Updated:** 2026-05-24

## Dependencies
- **Requires PROJ-1** (Auth + Multi-Mandant) — aktiver Mandant aus Session bestimmt Import-Ziel

## User Stories
1. Als CFO möchte ich monatliche Salden aus Diamant per Excel-Upload importieren, damit ich nicht manuell abtippen muss.
2. Als CFO möchte ich vor dem finalen Import eine Vorschau sehen, damit ich keine fehlerhaften Daten in mein Reporting bringe.
3. Als CFO möchte ich nach Korrekturen in Diamant denselben Monat erneut importieren ohne erst manuell löschen zu müssen.
4. Als CFO möchte ich sehen, welche Imports wann durchgeführt wurden, um Änderungen in meinen Reports nachvollziehen zu können.
5. Als CFO möchte ich, dass kaputte/unvollständige Daten erkannt werden, bevor sie meine Reports verfälschen.

## Out of Scope (P1+)
- **Buchungsjournal** (Einzelbuchungen) → P1
- **OP-Listen** (Debitoren/Kreditoren) → P1
- **CSV-, XML-, DATEV-Format** → P1 (Excel reicht im MVP)
- **Direkter API-Sync** → PROJ-7
- **Andere FiBu-Systeme** (DATEV, SAP) → später
- **Mehrere Monate in einer Datei** → P1
- **Spalten-Mapping-UI** für abweichende Exporte → P1
- **Audit-Log auf Zeilen-Ebene** (wer hat welchen Saldo wann geändert) → P2
- **Versionierung / Diff zwischen Imports** → P2
- **Rollback / Restore** alter Imports → P2

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

**Wizard Schritt 1 — Datei wählen**
- [ ] Angenommen der User ist auf der Seite „Importe", wenn er auf „Neuer Import" klickt, dann öffnet sich der Wizard mit Schritt 1 (Datei-Auswahl).
- [ ] Angenommen der User wählt eine Datei, wenn das Format nicht `.xlsx` ist, dann erscheint sofort die Fehlermeldung „Nur Excel-Dateien (.xlsx) erlaubt".
- [ ] Angenommen der User wählt eine .xlsx-Datei, wenn sie größer als 10 MB ist, dann erscheint „Datei darf höchstens 10 MB groß sein".
- [ ] Angenommen der User wählt eine gültige Datei, wenn er den Monat auswählt (Default: vergangener Monat) und auf „Weiter" klickt, dann wird zu Schritt 2 weitergeleitet.

**Wizard Schritt 2 — Preview & Validierung**
- [ ] Angenommen der User ist in Schritt 2, wenn die Datei valide ist, dann sieht er einen Preview-Block mit erkannten Konten (Anzahl) und Salden (Anzahl) sowie den ersten ~20 Zeilen als Tabelle.
- [ ] Angenommen die Datei hat fehlende Pflicht-Spalten, wenn sie verarbeitet wird, dann ist der Import-Button deaktiviert und die fehlenden Spalten werden namentlich gelistet.
- [ ] Angenommen Daten für den gewählten Monat existieren bereits, wenn die Validierung erfolgreich ist, dann erscheint ein deutlicher Hinweis „Daten für [Monat] existieren bereits — werden überschrieben".
- [ ] Angenommen die Summe Soll ≠ Summe Haben (Plausibilitätsprüfung), wenn die Validierung läuft, dann ist der Import-Button deaktiviert mit dem Hinweis „Soll- und Haben-Summen stimmen nicht überein".

**Wizard Schritt 3 — Import**
- [ ] Angenommen die Validierung ist erfolgreich, wenn der User auf „Import bestätigen" klickt, dann werden alle Salden und neuen Konten **transaktional** geschrieben.
- [ ] Angenommen der Import war erfolgreich, wenn er fertig ist, dann landet der User auf der Importe-Liste mit Toast „Import erfolgreich: X Konten, Y Salden".
- [ ] Angenommen während der DB-Transaktion ein Fehler auftritt, wenn das passiert, dann werden **keine Daten** gespeichert (Rollback) und der User sieht den Fehler.

**Mandanten-Zuordnung**
- [ ] Angenommen der User hat einen aktiven Mandanten, wenn er den Wizard öffnet, dann wird der aktive Mandant prominent angezeigt mit Hinweis „Import wird in [Mandant XY] gespeichert".

**Re-Import**
- [ ] Angenommen Daten für Januar 2026 existieren, wenn der User einen neuen Import für Januar 2026 durchführt, dann werden alle alten Salden dieser Periode gelöscht und durch die neuen ersetzt.
- [ ] Angenommen Konten existieren bereits, wenn ein Re-Import läuft, dann werden Stammdaten aktualisiert (z.B. neue Bezeichnung), die DB-Konto-ID bleibt aber für Referenzen erhalten.

**Importe-Liste**
- [ ] Angenommen der User ist auf der Importe-Seite, wenn mind. 1 Import existiert, dann sieht er eine Tabelle: Datum, User, Mandant, Periode, Dateiname, Status, Anzahl Konten + Salden.
- [ ] Angenommen kein Import existiert, wenn der User die Seite öffnet, dann sieht er den Empty-State „Noch keine Importe — auf 'Neuer Import' klicken".
- [ ] Angenommen der User klickt auf einen Import in der Tabelle, dann öffnet sich eine Detail-Seite mit allen importierten Konten + Salden (read-only).

## Edge Cases
- **Mehrere Sheets** in der Datei → wir nehmen das erste, mit Warnung im Preview.
- **.xlsm (Macro-Datei)** → abgelehnt, nur .xlsx.
- **Passwort-geschützte Datei** → Fehler „Datei ist passwortgeschützt".
- **Mandant-Switch mitten im Wizard** → Wizard wird zurückgesetzt, Hinweis „Mandant wurde gewechselt, bitte Datei erneut wählen".
- **Network-Fehler beim Upload** → Wizard bleibt bei Schritt 1, gewählte Datei verloren.
- **Konkurrenter Re-Import** in zwei Tabs → letzter gewinnt, kein Locking im MVP.
- **Konto im Re-Import nicht mehr enthalten** → bleibt in der DB (mit den vorherigen Salden); nicht automatisch löschen.
- **Sonderzeichen / Umlaute** in Konto-Bezeichnungen → werden korrekt importiert (UTF-8).
- **Saldo 0** → wird trotzdem importiert (Konto-Existenz ist relevant für Reports).

## Technical Requirements
- **Performance:** Import von 1.000 Konten + 1.000 Salden < 5 s (inkl. Upload + Validierung + DB-Write)
- **Datei-Limit:** max 10 MB
- **Security:** nur `.xlsx`, kein `.xlsm`/`.xltm` (Macros = Sicherheitsrisiko)
- **DSGVO:** Datei wird nicht persistent gespeichert; nur die extrahierten Daten landen in der DB
- **Browser:** Drag-Drop funktional in Chrome, Firefox, Safari, Edge
- **Sprache:** Komplette UI auf Deutsch

## Open Questions
- [ ] Exakte Diamant-Spaltenbezeichnungen — bitte vor `/architecture` eine **Beispiel-Datei** aus Diamant exportieren und teilen
- [ ] Kontenrahmen: SKR03, SKR04 oder custom? Beeinflusst die automatische GuV/Bilanz-Klassifizierung
- [ ] Wird die Eröffnungsbilanz im selben File mitgeliefert, oder separat zu Jahresbeginn?
- [ ] „Periode" in Diamant = Kalendermonat oder Buchungsperiode (relevant bei abweichendem Geschäftsjahr)?
- [ ] Behalten oder löschen — Konten, die im Re-Import nicht mehr enthalten sind?

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Scope: nur Summen-/Saldenliste + Konten | Reicht für GuV/Bilanz/KPI-Reports (PROJ-3); Buchungen sind 10–100× mehr Datenvolumen | 2026-05-24 |
| Excel-only im MVP | Im CFO-Alltag am verbreitetsten, robuster Parser möglich, keine Encoding-Probleme wie bei CSV | 2026-05-24 |
| Eine Datei pro Monat | Klares Modell, einfache Re-Import-Logik; Mehr-Perioden-Files in P1 | 2026-05-24 |
| Mandant aus Session, kein Auto-Match | Konsistent mit App-Multimandant-Konzept; Auto-Match via Diamant-Nr ist riskant | 2026-05-24 |
| Re-Import überschreibt Periode | Idempotent, intuitiv, üblich bei Korrekturen | 2026-05-24 |
| 3-Schritt-Wizard mit Preview | Verhindert teure Fehlimporte; Preview gibt Vertrauen vor irreversiblem Schreiben | 2026-05-24 |
| Strikte Validierung + transaktional | Finanzdaten dürfen nicht inkonsistent landen | 2026-05-24 |
| Import-Historie auf separater Seite | Audit-Wert (CFO: „warum sind die Zahlen anders?"), klein zu bauen | 2026-05-24 |
| 10 MB Datei-Limit | Diamant Summenlisten sind < 1 MB typisch; Puffer schützt vor Fehlauswahl riesiger Dateien | 2026-05-24 |
| `.xlsx` only, kein `.xlsm` | Macros sind Security-Risk | 2026-05-24 |
| Konten beim Re-Import behalten | Verhindert Datenverlust bei verzweifelter Diamant-Konfig (z.B. ausgeblendete Konten); explizites Löschen über DB möglich | 2026-05-24 |

### Technical Decisions
_To be added by /architecture_

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
