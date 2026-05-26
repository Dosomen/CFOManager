# Feature Index

> Central tracking for all features. Updated by skills automatically.

## Status Legend
- **Roadmap** - `/init` done, feature identified in feature map, no spec file yet
- **Planned** - `/write-spec` done, full spec written, architecture not yet designed
- **Architected** - `/architecture` done, tech design approved, ready to build
- **In Progress** - `/frontend` or `/backend` active or completed, not yet in QA
- **In Review** - `/qa` active, testing in progress
- **Approved** - `/qa` passed, no critical/high bugs, ready to deploy
- **Deployed** - `/deploy` done, live in production

## Features

| ID | Feature | Priority | Status | Dependencies | Spec | Created |
|----|---------|----------|--------|--------------|------|---------|
| PROJ-1 | Supabase Infrastruktur + Multi-Mandant Auth/Login | P0 | In Review | None | [PROJ-1](./PROJ-1-infrastruktur-auth-multi-mandant.md) | 2026-05-24 |
| PROJ-2 | Diamant Datei-Import (Excel; CSV/XML in P1) | P0 | In Progress | PROJ-1 | [PROJ-2](./PROJ-2-diamant-datei-import.md) | 2026-05-24 |
| PROJ-3 | Reporting & Dashboards (GuV, Bilanz, KPIs) | P0 | In Progress | PROJ-1, PROJ-2 | [PROJ-3](./PROJ-3-reporting-dashboards.md) | 2026-05-24 |
| PROJ-4 | Liquiditätsplanung & Cash Management | P1 | In Progress | PROJ-1, PROJ-2 | [PROJ-4](./PROJ-4-liquiditaet-cash-management.md) | 2026-05-24 |
| PROJ-5 | Planung & Forecasting (xP&A) | P1 | Roadmap | PROJ-1, PROJ-2, PROJ-3 | _pending_ | 2026-05-24 |
| PROJ-6 | Konzern-Konsolidierung (Multi-Mandant) | P1 | Roadmap | PROJ-1, PROJ-2 | _pending_ | 2026-05-24 |
| PROJ-7 | Diamant REST-API Live-Sync | P1 | Roadmap | PROJ-1, PROJ-2 | _pending_ | 2026-05-24 |
| PROJ-8 | Team- & Rollenverwaltung | P1 | In Progress | PROJ-1 | [PROJ-8](./PROJ-8-team-rollen.md) | 2026-05-24 |
| PROJ-9 | ESG-Reporting (ESRS, GHG) | P2 | Roadmap | PROJ-1, PROJ-2 | _pending_ | 2026-05-24 |
| PROJ-10 | Tax Compliance & Reporting | P2 | Roadmap | PROJ-1, PROJ-2 | _pending_ | 2026-05-24 |
| PROJ-11 | Lease Accounting (IFRS 16) | P2 | Roadmap | PROJ-1, PROJ-2 | _pending_ | 2026-05-24 |
| PROJ-12 | XBRL Tagging & Validation | P2 | Roadmap | PROJ-1, PROJ-3 | _pending_ | 2026-05-24 |
| PROJ-13 | Disclosure Management (AI-gestützt) | P2 | Roadmap | PROJ-1, PROJ-3, PROJ-12 | _pending_ | 2026-05-24 |

<!-- Add features above this line -->

## Next Available ID: PROJ-14

## Recommended Build Order

1. **PROJ-1** Infrastruktur & Auth (Fundament für alles)
2. **PROJ-2** Diamant-Import (Daten müssen rein, bevor wir sie anzeigen)
3. **PROJ-3** Reporting & Dashboards (erster sichtbarer Nutzen)
4. **PROJ-4** Liquidität — *MVP-Cutoff erreicht, P1 startet*
5. **PROJ-5** Planung/Forecast
6. **PROJ-6** Konsolidierung
7. **PROJ-7** Diamant API
8. **PROJ-8** Team-Verwaltung — *P1-Cutoff, P2 startet*
9. **PROJ-9** ESG
10. **PROJ-10** Tax
11. **PROJ-11** Lease
12. **PROJ-12** XBRL
13. **PROJ-13** Disclosure
