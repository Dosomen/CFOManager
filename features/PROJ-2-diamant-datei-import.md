# PROJ-2: Diamant Datei-Import (Excel)

> **Hinweis:** Trotz INDEX-Titel im MVP **nur Excel (.xlsx)**, fokussiert auf **Summen-/Saldenliste + Kontenrahmen**. CSV/XML und Buchungsjournal in P1.

## Status: In Progress
**Created:** 2026-05-24
**Last Updated:** 2026-05-25

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
| Decision | Rationale | Date |
|----------|-----------|------|
| Parsing im Browser, nicht auf dem Server | Datei kommt nie auf den Server (DSGVO-Plus, kein Storage); Wizard zeigt Preview ohne Roundtrip; Server bekommt geparstes, validiertes JSON | 2026-05-25 |
| Library: `xlsx` (SheetJS Community) | Battle-tested, ~150 KB gzipped, robust gegen Excel-Varianten. ExcelJS doppelt so groß für Read-only-Use-Case | 2026-05-25 |
| Flexible Header-Erkennung (sucht „Konto"-Zeile, nicht hardcoded Zeile 8) | Robust gegen Diamant-Formatvarianten | 2026-05-25 |
| Postgres-Funktion (RPC) für den Import | Echte DB-Transaktion (alte Salden löschen + Konten upserten + neue Salden inserten + Import-Eintrag) → alles oder nichts | 2026-05-25 |
| Numerische Werte als Strings Client→Server, Postgres `numeric` für Storage | Vermeidet JavaScript-Float-Ungenauigkeiten; exakte Finanz-Arithmetik | 2026-05-25 |
| Konten-Typ aus Kontonummer ableiten (SKR03-Bereiche) | Auto-Klassifizierung für GuV/Bilanz-Reports (PROJ-3); Custom-Override → P1 | 2026-05-25 |
| Kontenrahmen aus Datei-Header lesen | Diamant-Exporte enthalten „Kontenrahmen: SKR03/04" als Metadatum; Fallback Default SKR03 | 2026-05-25 |
| Eigene Wizard-Seite `/importe/neu`, kein Modal | Drei Schritte mit Preview brauchen Platz; Browser-Back/Forward soll funktionieren | 2026-05-25 |
| Server Actions, keine REST-Routes | Konsistent mit PROJ-1, type-safe Ende-zu-Ende | 2026-05-25 |
| Drag-and-Drop nativ statt `react-dropzone` | Browser-API reicht für Single-`.xlsx`-Upload; spart 30 KB Bundle | 2026-05-25 |
| 3 Tabellen + 2 Enums (konten, salden, importe; konten_typ, import_status) | Klare Trennung von Stammdaten / Bewegungsdaten / Audit-History | 2026-05-25 |
| RLS mandant-scoped auf allen 3 neuen Tabellen | Defense in depth, konsistent mit PROJ-1-Pattern | 2026-05-25 |

---
<!-- Sections below are added by subsequent skills -->

## Implementation Notes (Backend)

**Migration applied:** `supabase/migrations/20260525120000_create_import_schema.sql` — pushed to remote (CFO1, Frankfurt).

**Created tables + enums:** `konten`, `importe`, `salden`; `konten_typ`, `import_status`.

**Created RPC:** `public.import_salden(p_mandant_id, p_jahr, p_monat, p_dateiname, p_konten jsonb, p_salden jsonb, p_summe_soll numeric, p_summe_haben numeric)` — runs the whole import in one transaction (sanity-check orphan salden, mark prior import as „überschrieben", delete old salden, UPSERT konten, insert new salden, finalise import row).

**Created server code:**
- `src/lib/parser/skr.ts` — SKR03/04 konto-typ derivation
- `src/lib/parser/diamant.ts` — Excel parser (browser + Node testable via `parseDiamantBuffer`)
- `src/lib/validators/import.ts` — Zod schemas for the import payload
- `src/lib/actions/importe.ts` — `createImportAction` (calls the RPC)
- `src/lib/messages/de.ts` — UI strings extended for the Importe area

**Tests:** 97 / 97 unit tests passing (added 21 in `parser/skr.test.ts` + `parser/diamant.test.ts`; the parser tests use the SKR03 demo files from `samples/`).

**Sample data refactor:** Renamed demo konto numbers to match real SKR03 ranges:
- `0810/0820 Geschäftsausstattung/Büromaschinen` → `0410/0420` (Aktiva range)
- `0640 Darlehen` → `0980` (Passiva range)
- `1600 Kasse` → `1000` (Aktiva range)
So that the auto-derived `konten_typ` matches the actual semantics on every row.

**Pending (handed off to `/frontend`):**
- `(app)/importe` Liste mit Empty-State
- `(app)/importe/neu` 3-Schritt-Wizard (Datei + Periode / Preview / Bestätigen)
- `(app)/importe/[id]` Detail-Ansicht
- Sidebar-Eintrag „Importe"
- Drag-and-Drop + Datei-Validierung (`.xlsx`, ≤ 10 MB)

## Tech Design (Solution Architect)

### Komponenten-Struktur

```
Sidebar (erweitert um „Importe")
├── Dashboard
├── Mandanten
├── Importe   ← NEU (zwischen Mandanten und Einstellungen)
└── Einstellungen

(app)/importe                  Liste aller Imports (Tabelle)
├── Empty-State + CTA „Neuer Import"
└── Zeilen → Klick öffnet Detail

(app)/importe/neu              Wizard, 3 Schritte
├── Step 1: Datei + Periode
│   ├── Drag-Drop-Zone (.xlsx, max 10 MB)
│   ├── Monat-Picker (Default: letzter abgeschl. Monat)
│   └── Aktiver Mandant prominent angezeigt
├── Step 2: Preview + Validierung
│   ├── Erkannt: Konten-Anzahl, Salden-Anzahl, Kontenrahmen
│   ├── Plausibilität (Soll = Haben? Spalten OK?)
│   ├── Warnung bei Periode-Konflikt („wird überschrieben")
│   └── Erste ~20 Zeilen als Read-only-Tabelle
└── Step 3: Bestätigen
    └── „Import bestätigen" → Server-Roundtrip → Toast + Redirect

(app)/importe/[id]             Detail-Ansicht (read-only)
├── Metadaten (Datum, User, Periode, Datei, Status, Summen)
└── Konten + Salden als Read-only-Tabelle
```

### Datenmodell

Drei neue Tabellen plus zwei Enums:

**`konten`** — Kontenrahmen pro Mandant
- `mandant_id`, `nummer` (z.B. „1200"), `bezeichnung` („Bank")
- `typ` (Enum `konten_typ`: Aktiva / Passiva / Aufwand / Ertrag — abgeleitet aus SKR03/04-Nummern­bereichen)
- Eindeutig pro (Mandant, Nummer); UPSERT bei Re-Import erlaubt Bezeichnungs-Updates

**`salden`** — Monatliche Salden pro Konto
- `mandant_id`, `konto_id`, `jahr`, `monat`
- Werte: `eb_soll`, `eb_haben`, `vk_soll`, `vk_haben`, `saldo_soll`, `saldo_haben` (alle `numeric`, exakt)
- `import_id` → Verweis auf den Import-Lauf
- Eindeutig pro (Konto, Jahr, Monat)

**`importe`** — Import-Historie
- Wer, wann, welcher Mandant, welche Periode, Dateiname
- `status` (Enum `import_status`: erfolgreich / überschrieben / fehlgeschlagen)
- `anzahl_konten`, `anzahl_salden`, `summe_soll`, `summe_haben` (Audit-Snapshot)

**Automatik (Postgres-Funktion `import_salden`):**
- Atomic-Transaktion: alte `salden` der Periode löschen → vorherigen `importe`-Eintrag auf „überschrieben" setzen → Konten upserten → neue Salden inserten → neuen `importe`-Eintrag mit Status „erfolgreich" anlegen.
- Bei DB-Fehler: kompletter Rollback, keine halben Daten.

**Row Level Security:** alle 3 Tabellen mandant-scoped — User sieht nur Daten der Mandanten, in denen er Mitglied von `mandant_users` ist. Gleiches Pattern wie PROJ-1.

### Daten-Flow „CFO importiert März 2026"

1. CFO klickt **Sidebar → Importe → Neuer Import** → Wizard öffnet sich
2. **Step 1:** Drag-Drop von `diamant-summenliste-2026-03.xlsx`; Wizard zeigt aktiven Mandant, Periode (vorausgewählt: letzter abgeschl. Monat), Datei-Info.
3. Beim „Weiter": Browser parst die Datei via `xlsx`-Library (< 100 ms für ~7 KB).
4. **Step 2:** Wizard zeigt:
   - „42 Konten, 42 Salden, Kontenrahmen SKR03"
   - ✓ „Summe Soll = Summe Haben: 1.155.620,00 €"
   - ⚠️ „Daten für März 2026 existieren bereits — werden überschrieben" (falls vorhanden)
   - Tabelle mit ersten 20 Zeilen
5. **Step 3:** Bei „Import bestätigen":
   - Server Action erhält JSON-Payload (Konten + Salden + Metadaten)
   - Server re-validiert mit Zod (Defense in Depth)
   - Server ruft Postgres-Funktion `import_salden(…)` als eine Transaktion
   - Erfolg → Toast + Redirect `/importe` mit neuem Eintrag oben
   - Fehler → Rollback, Wizard zeigt Fehler, gewählte Datei bleibt

### Parsing-Strategie

- Browser-seitig, ohne Server-Upload (DSGVO-konform, kein Storage)
- Bibliothek: `xlsx` (SheetJS Community), ~150 KB gzipped
- Header-Erkennung sucht die Zeile, die „Konto" und „Bezeichnung" enthält — robust gegen Format­varianten
- Daten ab der Folgezeile bis SUMMEN-Zeile oder erster leerer Zeile
- Werte als Strings extrahiert, Client→Server als Strings, Postgres konvertiert in `numeric` (exakte Finanz-Arithmetik)
- Kontenrahmen aus Header-Metadaten gelesen, Fallback Default SKR03

### Konten-Typ-Erkennung (SKR03)

Aus der Kontonummer ableiten:
- `0000–0599`: Aktiva (Anlagevermögen)
- `0600–0999`: Passiva (Eigenkapital, Darlehen)
- `1000–1599`: Aktiva (Finanz- und Vorsteuer­konten)
- `1600–1999`: Passiva (Verbindlichkeiten, USt)
- `2xxx`: Passiva (Abschluss-/Korrekturkonten)
- `3xxx, 4xxx, 6xxx, 7xxx`: Aufwand
- `8xxx`: Ertrag
- `9xxx`: Sonstige (Default Aktiva)

SKR04 hat andere Bereiche → wird über den Kontenrahmen-Wert aus dem Datei-Header ausgewählt. Custom-Kontenrahmen → User-Override-UI in P1.

### Migration-Plan

Eine neue Migration `20260525xxxxxx_create_import_schema.sql`:
1. Enums `konten_typ`, `import_status`
2. Tabelle `konten` + Indexes + RLS-Policies (SELECT/INSERT/UPDATE/DELETE mandant-scoped)
3. Tabelle `importe` + Indexes + RLS-Policies
4. Tabelle `salden` + Indexes + RLS-Policies
5. Postgres-Funktion `public.import_salden(…)` (SECURITY DEFINER, transaktional)

### Neue Dependencies

- **`xlsx` (SheetJS Community)** — Browser-seitiges Excel-Parsing (~150 KB gzipped)

`@supabase/ssr`, `zod`, `react-hook-form`, `lucide-react`, `sonner` sind bereits installiert.

### Erweiterungspunkte für später

- **CSV/XML/DATEV-Parser** → P1: gleiche Pipeline, anderer Parser-Adapter vor dem JSON-Übergang
- **Mehr-Perioden-Datei** → P1: Wizard erkennt mehrere Monate, lädt batchweise
- **Buchungsjournal** → P1: neue Tabelle `buchungen`, eigener Wizard, Detail-Drill-Down
- **Spalten-Mapping-UI** → P1: für Custom-Diamant-Exporte
- **Diamant API Live-Sync** → PROJ-7: ersetzt Datei-Upload durch Auto-Sync, gleiches Datenmodell
- **Audit-Diff zwischen Imports** → P2: Detail vergleicht zwei Versionen einer Periode

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
