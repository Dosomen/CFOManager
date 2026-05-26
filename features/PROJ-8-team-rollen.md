# PROJ-8: Team- & Rollenverwaltung

## Status: In Progress
**Created:** 2026-05-26
**Last Updated:** 2026-05-26

## Dependencies
- **Requires PROJ-1** — `mandant_users` Tabelle wird um `rolle` erweitert

## User Stories
1. Als Owner möchte ich Controller via E-Mail einladen, damit sie auf den Mandanten zugreifen können.
2. Als Owner möchte ich Mitglieder entfernen, wenn sie das Team verlassen.
3. Als Mitglied möchte ich sehen, wer sonst Zugriff auf den Mandanten hat.
4. Als Owner möchte ich nicht versehentlich der letzte Owner und damit das Tool sperren — das System verhindert das.

## Out of Scope (P1+)
- Rollen wechseln (Member → Owner Promotion) → P1 (UI fehlt, DB unterstützt es bereits)
- Mandant-übergreifende Rollen → P2
- Granulare Permissions (z.B. read-only) → P2
- Audit-Trail für Einladungen / Entfernungen → P2
- Bulk-Invite mehrerer Adressen → später

## Acceptance Criteria
- [ ] Angenommen ich bin Owner, wenn ich auf /team gehe, dann sehe ich „Mitglied einladen"-Button.
- [ ] Angenommen ich bin Owner, wenn ich eine neue E-Mail einlade, dann erhält die Adresse eine Supabase-Invite-Mail mit Anmeldelink.
- [ ] Angenommen die E-Mail ist bereits Mitglied, wenn ich einlade, dann erscheint eine Fehlermeldung „bereits Mitglied".
- [ ] Angenommen die E-Mail existiert in Supabase aber nicht im Mandanten, wenn ich einlade, dann wird der existierende User dem Mandanten als Mitglied hinzugefügt.
- [ ] Angenommen ich bin Owner und nicht der letzte Owner, wenn ich auf „Entfernen" bei einem Mitglied klicke und bestätige, dann verliert es den Zugriff.
- [ ] Angenommen ich bin Member, wenn ich /team öffne, dann ist der „Einladen"-Button ausgeblendet und „Entfernen" nur für mich selbst aktiviert.
- [ ] Angenommen ich bin der letzte Owner, wenn ich „Entfernen" auf mich selbst klicke, dann ist der Button deaktiviert mit Hinweis „letzter Owner".

## Edge Cases
- **E-Mail bereits in Supabase Auth registriert** (z.B. anderer Mandant): wird ohne erneutes Invite direkt verknüpft.
- **E-Mail-Versand fehlgeschlagen** (SMTP-Limit): User wird in Supabase Auth angelegt, mandant_users-Insert läuft trotzdem; Owner muss manuell informieren.
- **Member entfernt sich selbst**: nach Server-Action `window.location.href = '/dashboard'` → mandant-switch oder Empty-State.

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Enum `mandant_rolle (owner, member)` in `mandant_users` | Erweiterbar (z.B. „viewer", „accountant" in P1); enum statt boolean weil Rollen wachsen. |
| `is_mandant_owner` SECURITY DEFINER Helper | Vermeidet RLS-Rekursion bei Permission-Checks; einheitlich nutzbar in RLS und Server Actions. |
| Server Action mit Admin-Client für Invite | `supabase.auth.admin.inviteUserByEmail` braucht service_role; in Server-only Path (admin.ts) gekapselt. |
| Permission-Check im Server Action statt nur RLS | Ermöglicht explizite Fehlermeldungen („Nur Owner können…"). RLS bleibt als 2. Verteidigungslinie. |
| Letzter-Owner-Schutz in Server Action | Verhindert Lockout. Im UI als deaktivierter Button + Tooltip. |
| Trigger-Update: Creator wird automatisch Owner | Konsistent mit bestehender mandant-Creation-Flow; backfill von Bestandsdaten. |

## Implementation Notes

**Migration:** `supabase/migrations/20260526140000_team_roles.sql`
- Enum `mandant_rolle`
- Column `mandant_users.rolle` (default 'member')
- Backfill: alle bisherigen User mit `created_by = user_id` werden Owner
- Trigger `handle_new_mandant` setzt 'owner' für Creator
- Helper `is_mandant_owner(uuid)` SECURITY DEFINER
- DELETE-Policy erweitert: Self ODER Owner kann löschen

**Library:**
- `src/lib/supabase/admin.ts` — service-role Admin-Client (server-only)
- `src/lib/team/queries.ts` — `getTeamMembers`, `isOwnerOf`
- `src/lib/validators/team.ts` — Invite + Remove Zod-Schemas
- `src/lib/actions/team.ts` — `inviteTeamMemberAction`, `removeTeamMemberAction`

**Components:**
- `src/components/team/team-list.tsx` — Tabelle + Remove-Confirm-Dialog
- `src/components/team/invite-dialog.tsx` — E-Mail-Form, ruft Server Action

**Page:** `src/app/(app)/team/page.tsx` — Server Component lädt Mitglieder + Owner-Status

**Sidebar:** „Team"-Eintrag (Users-Icon) zwischen Importe und Einstellungen

**Verification:** tsc clean, 122/122 tests grün, build 15 routes erfolgreich.

**Pending vor /qa:**
- Supabase E-Mail-Templates für Invite testen
- Limit prüfen: Supabase-SMTP erlaubt nur ~3 Mails/h im Free-Tier → Production-SMTP-Anbieter eventuell konfigurieren
