# PROJ-1: Supabase Infrastruktur + Multi-Mandant Auth/Login

## Status: In Progress
**Created:** 2026-05-24
**Last Updated:** 2026-05-24

## Dependencies
- None (Fundament für alle weiteren Features)

## User Stories
1. Als CFO möchte ich mich mit E-Mail + Passwort sicher einloggen, damit nur ich auf die Finanzdaten zugreifen kann.
2. Als neuer User möchte ich nach dem ersten Login geführt meinen ersten Mandanten anlegen, damit ich sofort produktiv werden kann.
3. Als CFO mit mehreren Gesellschaften möchte ich zwischen Mandanten wechseln können, damit ich pro Gesellschaft arbeite.
4. Als CFO möchte ich weitere Mandanten jederzeit hinzufügen, bearbeiten oder löschen, damit ich Konzernveränderungen abbilden kann.
5. Als sicherheitsbewusster CFO möchte ich optional 2FA aktivieren, damit mein Account zusätzlich geschützt ist.
6. Als CFO möchte ich mein Passwort selbst zurücksetzen können, damit ich nicht auf einen Admin warten muss.

## Out of Scope
- **Self-Signup** — Tool ist Invite-Only; User werden im MVP manuell in Supabase angelegt
- **Team-Einladungen, Rollen, Berechtigungen** → PROJ-8
- **SSO** (Google, Microsoft) — eventuell P1
- **Mandant-Stammdaten erweitert** (Logo-Upload, vollständige Adresse, HRB, Steuernummer) → P1 Settings-Erweiterung
- **Audit-Trail** (wer hat wann was geändert) → P2
- **E-Mail-Template-Branding** → P2
- **Inaktivitäts-Timeout** → eventuell P1 wenn regulatorisch gefordert
- **URL-basiertes Mandanten-Routing** (`/{slug}/...`) → P1 Refactor
- **Soft-Delete** für Mandanten — wir machen Hard-Delete mit Bestätigung
- **Super-Admin** / Plattform-Admin
- **API-Keys / Service-Accounts** → wird ggf. mit PROJ-7 (Diamant API) eingeführt

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

**Login & Passwort-Reset**
- [ ] Angenommen ein User-Account existiert, wenn der User gültige E-Mail + Passwort eingibt und auf „Anmelden" klickt, dann wird er eingeloggt und zum Dashboard (oder zum Mandanten-Wizard, falls noch kein Mandant existiert) weitergeleitet.
- [ ] Angenommen ein User-Account existiert, wenn der User ein falsches Passwort eingibt, dann erscheint die generische Fehlermeldung „E-Mail oder Passwort falsch" (ohne zu verraten, ob die E-Mail existiert).
- [ ] Angenommen kein User-Account existiert, wenn der User eine unregistrierte E-Mail eingibt, dann erscheint dieselbe generische Fehlermeldung (Brute-Force-Schutz).
- [ ] Angenommen der User klickt „Passwort vergessen", wenn er seine E-Mail eingibt und absendet, dann wird (falls die E-Mail existiert) ein Reset-Link per E-Mail verschickt; die Bestätigungsmeldung ist generisch („Wenn die Adresse existiert, haben wir dir einen Link gesendet.").
- [ ] Angenommen ein gültiger Reset-Link wurde angeklickt, wenn der User ein neues Passwort (min. 12 Zeichen) eingibt, dann wird das Passwort aktualisiert und der User automatisch eingeloggt.

**Mandanten-Wizard (Onboarding)**
- [ ] Angenommen der User loggt sich zum ersten Mal ein und hat noch keinen Mandanten, wenn er eine geschützte Seite aufruft, dann wird er zum Mandanten-Wizard weitergeleitet und kann erst nach Abschluss weiterarbeiten.
- [ ] Angenommen der User ist im Wizard, wenn er ein Pflichtfeld (Name, Rechtsform) leer lässt und auf „Mandant anlegen" klickt, dann erscheint eine Validierungsfehlermeldung pro Feld; der Mandant wird nicht angelegt.
- [ ] Angenommen der User füllt alle Pflichtfelder aus, wenn er auf „Mandant anlegen" klickt, dann wird der Mandant gespeichert, als aktiver Mandant gesetzt und der User landet im (leeren) Dashboard.

**Mandanten-Switcher**
- [ ] Angenommen der User hat mindestens einen Mandanten, wenn er die App lädt, dann wird der Name des aktiven Mandanten in der Topbar links angezeigt.
- [ ] Angenommen der User hat mehrere Mandanten, wenn er auf den Switcher klickt, dann öffnet sich ein Dropdown mit allen seinen Mandanten + Option „Neuen Mandant anlegen".
- [ ] Angenommen der User wählt einen anderen Mandanten, wenn er den Eintrag klickt, dann lädt die App mit dem gewählten Mandanten neu; die Auswahl bleibt über Browser-Refresh hinweg erhalten.

**Mandanten-Verwaltung**
- [ ] Angenommen der User ist auf der Seite „Mandanten", wenn er auf „Neuen Mandant anlegen" klickt, dann öffnet sich ein Dialog mit denselben Feldern wie im Onboarding-Wizard.
- [ ] Angenommen ein Mandant existiert, wenn der User auf „Bearbeiten" klickt, dann öffnet sich ein Dialog mit vorausgefüllten Werten; alle Felder sind editierbar.
- [ ] Angenommen ein Mandant existiert, wenn der User auf „Löschen" klickt, dann erscheint ein Bestätigungsdialog, der die Eingabe des Mandantennamens zur Bestätigung verlangt.
- [ ] Angenommen nur ein Mandant existiert, wenn der User die Mandanten-Liste öffnet, dann ist der Löschen-Button für diesen einen Mandanten deaktiviert mit Hinweis „Letzter Mandant kann nicht gelöscht werden".

**Account-Einstellungen & 2FA**
- [ ] Angenommen der User ist eingeloggt, wenn er auf „Account-Einstellungen" klickt, dann sieht er die Bereiche „Passwort ändern" und „Zwei-Faktor-Authentifizierung".
- [ ] Angenommen der User klickt „2FA aktivieren", wenn er den QR-Code mit einer Authenticator-App scannt und einen gültigen 6-stelligen Code eingibt, dann wird 2FA aktiviert und 10 Recovery-Codes werden einmalig angezeigt (zum Notieren/Drucken).
- [ ] Angenommen 2FA ist aktiviert, wenn der User sich neu einloggt, dann wird nach E-Mail/Passwort ein TOTP-Code abgefragt; ohne gültigen Code keine Session.

**Session**
- [ ] Angenommen der User ist eingeloggt, wenn 8 Stunden seit Login vergangen sind, dann wird die Session ungültig und der User beim nächsten Request zum Login weitergeleitet (mit Rücksprung-URL).

## Edge Cases
- **Aktiver Mandant wird gelöscht, während User eingeloggt:** Beim nächsten Request fällt der aktive Mandant auf den ersten in der Liste zurück; existieren keine mehr → Redirect zum Wizard.
- **Mehrere Browser-Tabs, Mandant in Tab A gewechselt:** Tab B zeigt den alten Mandanten bis zum nächsten Reload — MVP akzeptiert das, keine Live-Synchronisation.
- **Brute-Force-Login:** Supabase-Default-Rate-Limit (≈ 5 fehlgeschlagene Versuche / 15 min pro E-Mail); bei Überschreitung Fehlermeldung mit Hinweis auf temporäre Sperrung.
- **2FA-Recovery verloren (kein Authenticator + keine Recovery-Codes):** MVP nur über manuelles Zurücksetzen durch Admin in Supabase; Self-Service-Recovery → P1.
- **Direkter Aufruf einer geschützten URL ohne Session:** Redirect zu `/login?next=<original-url>`; nach erfolgreichem Login zur ursprünglichen URL.
- **User-Account in Supabase gelöscht, während eingeloggt:** Nächster Request liefert 401, Auto-Logout, Login schlägt mit generischer Fehlermeldung fehl.
- **Mandant-Name doppelt:** Doppelte Namen sind erlaubt (Mandant-ID = Identifier); Hinweis-Toast „Es existiert bereits ein Mandant mit diesem Namen — trotzdem speichern?".

## Technical Requirements
- **Performance:** Login-Roundtrip < 1 s; Mandant-Switch < 500 ms
- **Security:** Passwort min. 12 Zeichen; HTTPS-only; Supabase Auth-Defaults; RLS auf allen Tabellen; alle Mandanten-Tabellen mit `tenant_id`-Spalte und RLS-Policy
- **DSGVO:** Supabase EU-Region (Frankfurt); keine Daten in US-Region; Cookies markiert als `Secure`, `HttpOnly`, `SameSite=Lax`
- **Browser-Support:** Aktuelle 2 Versionen von Chrome, Firefox, Safari, Edge
- **Sprache:** Komplette UI auf Deutsch (Login-Texte, Fehlermeldungen, Wizard, Einstellungen)

## Open Questions
- [ ] Sollen Login-Versuche zusätzlich in einem eigenen Audit-Log gespeichert werden, oder reicht das Supabase-eigene Logging?
- [ ] Sollen wir die Supabase-Default-E-Mail-Templates (Passwort-Reset, 2FA) sofort branded anpassen oder erst in P1?
- [ ] Brauchen wir Impressum/Datenschutz-Footer auf der Login-Seite (rechtliche Pflicht auch für interne Tools)?
- [ ] Welcher Supabase-Plan: Free reicht für MVP, aber Point-in-Time-Recovery gibt es erst ab Pro (25 $/Monat). Vor Echtbetrieb mit Finanzdaten auf Pro upgraden?
- [ ] Status-Field & Last-Updated der Spec hier: 2026-05-24 — sollte aktualisiert werden bei jeder größeren Änderung.

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Invite-Only statt Self-Signup | Internes Tool mit Finanzdaten — keine öffentliche Registrierung. Team-Invites kommen in PROJ-8. | 2026-05-24 |
| E-Mail/Passwort statt SSO im MVP | SSO bedeutet OAuth-App-Registrierung bei Google/MS. MVP-Speed > Komfort. | 2026-05-24 |
| 2FA optional, nicht Pflicht | Pflicht-2FA erfordert Recovery-Flow + Onboarding-Friction. Kann später verschärft werden. | 2026-05-24 |
| Erzwungener Onboarding-Wizard | Ohne Mandant gibt es keine Daten — verhindert verwaiste Accounts. | 2026-05-24 |
| Minimale Pflichtfelder (Name, Rechtsform) | Niedrige Onboarding-Hürde; Stammdaten lassen sich später ergänzen. | 2026-05-24 |
| Topbar-Dropdown statt URL-Routing | Schneller umsetzbar; URL-Routing wäre Refactoring-intensiv. | 2026-05-24 |
| 8 h Session ohne Inaktivitäts-Timeout | Komfort > zusätzliche Sicherheit für MVP; verschärfbar später. | 2026-05-24 |
| Hard-Delete mit Namens-Bestätigung | Einfacher als Soft-Delete; Backup über Supabase. | 2026-05-24 |
| Letzter Mandant nicht löschbar | Verhindert „eingeloggt, aber kein Mandant"-Zustand. | 2026-05-24 |
| Diamant-Mandantennummer optional erfassen | Wird in PROJ-2 für Import-Matching gebraucht; Eingabe jetzt erspart Nachpflege. | 2026-05-24 |

### Technical Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Supabase Auth statt eigene Auth (NextAuth/custom) | Login, Reset, Rate-Limit, 2FA out-of-the-box; spart Wochen Entwicklung | 2026-05-24 |
| Supabase Cloud, Region Frankfurt (eu-central-1) | DSGVO-Pflicht für Finanzdaten; US-Region würde EU-Datentransfer-Recht verletzen | 2026-05-24 |
| `@supabase/ssr` (HttpOnly Cookies) statt Browser-Client + localStorage | XSS-resistente Session; Server Components lesen Session direkt | 2026-05-24 |
| Next.js Server Actions statt eigene REST-Routen | Weniger Code, type-safe Ende-zu-Ende, funktioniert ohne JS-Client | 2026-05-24 |
| Middleware-basierter Auth-Check | Zentrale Logik verhindert vergessene Per-Page-Checks | 2026-05-24 |
| Row Level Security auf DB-Ebene | Defense in Depth — auch wenn Application-Code fehlt, blockiert die DB den Zugriff | 2026-05-24 |
| Aktiver Mandant in `user_profiles.active_mandant_id` (DB) statt Cookie | Cross-Device, übersteht Cookie-Clear, Server-readable ohne Extra-Roundtrip | 2026-05-24 |
| M:N Join-Tabelle `mandant_users` (statt User-FK in `mandanten`) | Bereit für PROJ-8 (mehrere User pro Mandant) | 2026-05-24 |
| Hard-Delete mit CASCADE statt Soft-Delete | Einfacher; Supabase Point-in-Time-Recovery als Backup-Netz | 2026-05-24 |
| DB-Trigger: bei Mandant-Insert automatisch `mandant_users`-Eintrag für Creator | Verhindert Race Condition zwischen INSERT und RLS-SELECT direkt nach Anlage | 2026-05-24 |
| Drei Tabellen (mandanten, mandant_users, user_profiles) | Klare Trennung: Stammdaten / Beziehung / Per-User-State | 2026-05-24 |
| React Hook Form + Zod für Forms und Server Actions | Schon installiert; gleiches Schema in Form + Action = single source of truth | 2026-05-24 |
| shadcn/ui `sidebar.tsx` als App-Shell-Basis | Vorhanden, accessible, responsive, einklappbar — kein Eigenbau nötig | 2026-05-24 |
| Deutsche Texte in zentraler `messages/de.ts`-Datei | Vorbereitung auf späteres `next-intl` für P2 Englisch | 2026-05-24 |

---
<!-- Sections below are added by subsequent skills -->

## Implementation Notes (Backend)

**Migration applied:** `supabase/migrations/20260524130000_initial_schema.sql` — pushed to remote (CFO1, Frankfurt) via `supabase db push`.

**Created server-side files:**
- `src/lib/supabase/{server,client,middleware}.ts` — three Supabase clients (Server Components, Browser, Middleware)
- `src/middleware.ts` — auth gating; public routes: `/login`, `/passwort-vergessen`, `/passwort-zuruecksetzen`
- `src/lib/messages/de.ts` — central German UI strings
- `src/lib/validators/{auth,mandant}.ts` — Zod schemas
- `src/lib/actions/types.ts` — shared `ActionResult<T>` + form-data + Zod-error helpers
- `src/lib/actions/auth.ts` — login, logout, password reset, change password, 2FA enroll/verify/unenroll/list, MFA login verify
- `src/lib/actions/mandanten.ts` — create, update, delete, switch active
- `src/lib/mandant/active.ts` — server helper that resolves the active mandant with fallback to first accessible
- `src/lib/types/database.ts` — generated from live schema via `supabase gen types typescript`

**Tests:** 26 unit tests in `src/lib/validators/{auth,mandant}.test.ts` — all passing.

**Dependencies added:** `@supabase/ssr` 0.x, `zod` 4.4.3.

**Deviations from spec/design:**
- Removed placeholder `src/lib/supabase.ts` (was a no-op exporting `null`).
- Active-mandant resolver auto-promotes the first accessible mandant if `active_mandant_id` is stale (instead of forcing the user to pick), so a single-mandant user is never stranded.

**Pending (handed off to `/frontend`):**
- All UI pages (login, password-reset request/confirm, onboarding wizard, dashboard placeholder, mandanten list + CRUD dialogs, account settings + 2FA flow)
- App-shell (sidebar + topbar with mandant switcher and user menu)
- `(app)/layout.tsx` redirect to `/onboarding` when no mandant exists
- `next` query-param handling on the login page after successful auth

## Tech Design (Solution Architect)

### Komponenten-Struktur

```
App-Root
├── (public) — keine Auth nötig
│   ├── /login                       Login-Form (E-Mail + Passwort)
│   ├── /passwort-vergessen          E-Mail-Eingabe für Reset-Link
│   └── /passwort-zuruecksetzen      Neues Passwort setzen (Token aus URL)
│
├── (onboarding) — eingeloggt, aber noch kein Mandant
│   └── /onboarding                  Mandanten-Wizard (Vollbild)
│
└── (app) — eingeloggt + mindestens 1 Mandant (Middleware-geschützt)
    ├── App-Shell
    │   ├── Topbar (links: App-Logo + Mandant-Switcher; rechts: User-Menu)
    │   └── Sidebar (Dashboard, Mandanten, Einstellungen)
    │
    ├── /dashboard                   Leere Platzhalter-Seite (PROJ-3 füllt sie)
    │
    ├── /mandanten                   Liste aller Mandanten des Users
    │   ├── Tabelle (Name, Rechtsform, Währung, GJ-Start, Aktionen)
    │   ├── Dialog: Neuer Mandant   (gleiche Felder wie Wizard)
    │   ├── Dialog: Mandant bearbeiten
    │   └── Dialog: Mandant löschen (mit Namens-Bestätigung)
    │
    └── /einstellungen
        ├── Sektion: Passwort ändern
        └── Sektion: 2FA (Status, Aktivieren-Flow mit QR + Recovery-Codes)
```

### Datenmodell

Drei Tabellen in Supabase Postgres:

**`mandanten`** — eine Zeile pro Gesellschaft
- `id` (uuid, PK), `name`, `rechtsform`, `basiswaehrung` (Default `EUR`), `geschaeftsjahr_start` (Default `01-01`)
- Optional: `ust_idnr`, `diamant_mandantennummer`
- Metadaten: `created_at`, `created_by` (FK auf `auth.users`)

**`mandant_users`** — M:N-Join „welcher User darf welchen Mandanten sehen"
- `mandant_id` + `user_id` + `created_at` (Composite PK)
- Im MVP keine Rollen; PROJ-8 ergänzt `rolle`-Spalte

**`user_profiles`** — Per-User-Metadaten
- `user_id` (PK, FK auf `auth.users`), `active_mandant_id` (FK auf `mandanten`, ON DELETE SET NULL)
- Single Source of Truth für „welchen Mandanten sehe ich gerade" — überlebt Geräte/Tabs/Refresh

**DB-Trigger (Automatik):**
- Bei `auth.users`-INSERT → automatisch `user_profiles`-Eintrag (active_mandant_id leer)
- Bei `mandanten`-INSERT → automatisch `mandant_users`-Eintrag für `created_by`
- Bei `mandanten`-DELETE → CASCADE auf `mandant_users`; `user_profiles.active_mandant_id` → NULL

**Row Level Security:**
- `mandanten`: SELECT/UPDATE/DELETE nur wenn User in `mandant_users` für diesen Mandanten; INSERT für alle authentifizierten User
- `mandant_users`: SELECT/INSERT/DELETE nur eigene Zeilen (im MVP)
- `user_profiles`: SELECT/UPDATE nur eigene Zeile

### Daten-Flow „User loggt sich ein"

1. User öffnet `/dashboard` → Middleware: keine Session → Redirect zu `/login?next=/dashboard`
2. User submitted Login-Form → Server Action ruft Supabase Auth → Session-Cookie gesetzt
3. Falls 2FA aktiv: TOTP-Abfrage als zweiter Schritt
4. Server prüft `user_profiles.active_mandant_id`:
   - leer + keine Mandanten → Redirect `/onboarding`
   - leer + ≥ 1 Mandant → ersten als aktiv setzen, Redirect `next`
   - gesetzt → Redirect `next`
5. App-Shell liest aktiven Mandanten serverseitig und zeigt Namen in Topbar

### Supabase-Konfiguration (vor erstem Backend-Run)

- Neues Supabase-Projekt (Region: Frankfurt)
- ENV: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- Auth: E-Mail-Confirmation aus (Invite-Only); Passwort-Mindestlänge 12; MFA-TOTP aktiviert
- Session-Dauer: 8 h (JWT expiry)
- Storage: leer (kein Logo-Upload im MVP)

### Migrations (Reihenfolge)

1. `001_create_mandanten_table`
2. `002_create_mandant_users_join`
3. `003_create_user_profiles_table`
4. `004_create_user_profile_trigger` (on auth.users insert)
5. `005_create_mandant_owner_trigger` (on mandanten insert)
6. `006_setup_rls_policies` (alle drei Tabellen)

### Neue Dependencies

- **`@supabase/ssr`** — Cookie-basierte Session in Server Components & Middleware
- **`zod`** — Schema-Validation für Forms + Server Actions

Bereits vorhanden: `@supabase/supabase-js`, `react-hook-form`, `@hookform/resolvers`, alle shadcn-Komponenten, `lucide-react`.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
