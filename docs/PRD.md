# Product Requirements Document

## Vision
Ein Self-Service-Tool für CFOs und Finanzleiter im deutschen Mittelstand, das Finanzdaten aus Diamant Software automatisiert importiert und in Reporting, Planung, Liquiditätsmanagement und Konzern-Konsolidierung übersetzt. Lucanet-Funktionalität in einer schlankeren, modernen Cloud-Lösung — ohne Implementierungs-Marathon.

## Target Users
**Primär:** CFOs und Finanzleiter in mittelständischen Unternehmen (50–1000 MA), die heute Diamant Software für die Buchhaltung nutzen und Reports/Forecasts manuell in Excel bauen.

**Pain Points:**
- Diamant liefert Roh-Daten, aber kein Management-Reporting
- Excel-Konsolidierung mehrerer Mandanten ist fehleranfällig und zeitintensiv
- Liquiditätsplanung wird in separater Datei gepflegt, oft nicht aktuell
- Lucanet ist mächtig, aber teuer (>50k€/Jahr) und für viele Mittelständler überdimensioniert

## Core Features (Roadmap)

| Priorität | ID | Feature | Status |
|-----------|----|---------|--------|
| P0 (MVP) | PROJ-1 | Supabase Infrastruktur + Multi-Mandant Auth/Login | Architected |
| P0 (MVP) | PROJ-2 | Diamant Datei-Import (CSV/Excel/XML) | Roadmap |
| P0 (MVP) | PROJ-3 | Reporting & Dashboards (GuV, Bilanz, KPIs) | Roadmap |
| P1 | PROJ-4 | Liquiditätsplanung & Cash Management | Roadmap |
| P1 | PROJ-5 | Planung & Forecasting (xP&A) | Roadmap |
| P1 | PROJ-6 | Konzern-Konsolidierung (Multi-Mandant) | Roadmap |
| P1 | PROJ-7 | Diamant REST-API Live-Sync | Roadmap |
| P1 | PROJ-8 | Team- & Rollenverwaltung | Roadmap |
| P2 | PROJ-9 | ESG-Reporting (ESRS, GHG) | Roadmap |
| P2 | PROJ-10 | Tax Compliance & Reporting | Roadmap |
| P2 | PROJ-11 | Lease Accounting (IFRS 16) | Roadmap |
| P2 | PROJ-12 | XBRL Tagging & Validation | Roadmap |
| P2 | PROJ-13 | Disclosure Management (AI-gestützt) | Roadmap |

## Success Metrics
- **Time-to-First-Report:** Erstes auswertbares Reporting < 5 Minuten nach Diamant-Import
- **Excel-Reduktion:** Manuelle Excel-Arbeit pro Monatsabschluss um > 70 % reduziert
- **Konsolidierungs-Zeit:** Mandanten-Konsolidierung von Tagen auf Minuten (Knopfdruck)
- **Adoption:** Tägliche Nutzung durch den CFO (nicht nur Monatsabschluss)

## Constraints
- **Tech-Stack:** Next.js 16 (App Router) + TypeScript + Supabase (PostgreSQL, Auth, Storage) + Tailwind + shadcn/ui
- **Hosting:** Vercel; Supabase EU-Region (DSGVO-konform, Finanzdaten dürfen nicht in US-Region)
- **Sprache:** Deutsch (primär); Englisch als P2-Ergänzung
- **Team:** AI-gestützte Einzelperson-Entwicklung
- **Design:** Lucanet-Stil (clean, business, datenfokussiert) — siehe [`docs/design-system.md`](./design-system.md)
- **Datenintegration MVP:** Datei-Upload (CSV/Excel/XML); Live-API-Sync folgt in P1 (PROJ-7)

## Non-Goals
- **Keine Landingpage / kein Marketing-Site** — Tool startet direkt mit Login
- **Kein Multi-Tenant SaaS** — internes Tool, ein Workspace pro Deployment (Multi-Mandant ja, aber nicht Multi-Customer)
- **Kein Ersatz für die Diamant-Buchhaltung** — wir lesen Daten, buchen aber nicht
- **Keine native Mobile App** — Web responsive reicht im MVP
- **Keine Anbindung an andere FiBu-Systeme im MVP** (DATEV, SAP, etc. — eventuell P2)

---

Use `/write-spec` to create detailed feature specifications for each item in the roadmap above.
