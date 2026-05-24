# PROJ-1: Supabase Infrastruktur + Multi-Mandant Auth/Login

## Status: Planned
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
_To be added by /architecture_

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
