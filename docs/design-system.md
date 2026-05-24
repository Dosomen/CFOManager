# Design System

> Lucanet-inspirierter Look: clean, business-orientiert, datenfokussiert.
> Basis: Tailwind CSS + shadcn/ui Defaults mit gezielten Anpassungen.

## Designprinzipien

1. **Daten zuerst** — UI tritt zurück, Zahlen und Trends stehen im Vordergrund.
2. **Whitespace großzügig** — keine überladenen Dashboards; klare Hierarchie.
3. **Konsistenz vor Kreativität** — gleiche Komponenten für gleiche Aktionen, überall.
4. **Lesbarkeit** — Tabular Numbers für alle Geldbeträge; rechtsbündig in Tabellen.
5. **Vertrauen** — Enterprise-tauglicher Look (kein Startup-Spielzeug, keine Verspielheit).

## Farbpalette

### Primary (Brand Blue)
- `primary-50`  `#EFF6FF`
- `primary-100` `#DBEAFE`
- `primary-500` `#3B82F6`  — Haupt-Akzent (CTA, Links)
- `primary-600` `#2563EB`  — Hover/Active
- `primary-700` `#1D4ED8`  — gedrückt / Fokus

### Neutral (Slate)
- `slate-50`   `#F8FAFC` — App-Hintergrund
- `slate-100`  `#F1F5F9` — Karten-Hintergrund sekundär
- `slate-200`  `#E2E8F0` — Borders, Trennlinien
- `slate-500`  `#64748B` — Sekundär-Text
- `slate-700`  `#334155` — Primär-Text
- `slate-900`  `#0F172A` — Headings

### Semantic
- `success` `#10B981` — positive Trends, Gewinn
- `warning` `#F59E0B` — Hinweise, Schwellwerte
- `danger`  `#EF4444` — negative Trends, Verlust, Fehler
- `info`    `#06B6D4` — neutrale Hinweise

### Charts (qualitative Skala für Reports)
`#2563EB` `#0891B2` `#10B981` `#F59E0B` `#EF4444` `#8B5CF6` `#EC4899` `#64748B`

## Typografie

- **Schriftart:** Inter (Variable Font) — Fallback: -apple-system, system-ui
- **Tabular Numbers:** `font-variant-numeric: tabular-nums` für alle Zahlen und Beträge
- **Skala:**
  - `text-xs` 12px — Tabellen-Captions, Meta
  - `text-sm` 14px — Body sekundär, Tabellenzellen
  - `text-base` 16px — Body primär
  - `text-lg` 18px — Sub-Headings
  - `text-xl` 20px — Card Titles
  - `text-2xl` 24px — Section Headings
  - `text-3xl` 30px — Page Titles
  - `text-4xl` 36px — KPI-Werte
- **Gewicht:** 400 Body, 500 Sub-Heading, 600 Heading, 700 KPI-Werte

## Spacing & Layout

- **Grid:** 8px-Basis (Tailwind Defaults: `space-y-4`, `gap-6`, `p-8`)
- **Container:** `max-w-7xl` für Hauptinhalt, `max-w-screen-2xl` für Dashboards
- **Sidebar:** 240px (collapsed: 64px)
- **Topbar:** 56px
- **Karten:** `rounded-lg` (8px), Border `border-slate-200`, Shadow `shadow-sm`

## Komponenten-Patterns

- **Dashboard-Cards:** weiß auf `slate-50`-Hintergrund, dünne Border, kleine Schatten
- **Tabellen:** Zebra-Streifen aus, Header `bg-slate-50`, Zellen `border-b border-slate-100`
- **Charts:** Recharts oder Tremor; Achsen `slate-500`, Gridlines `slate-200`, gefüllte Bereiche mit Opacity 0.1–0.2
- **Buttons:** shadcn-Defaults; Primary = `primary-600`, Secondary = `slate-100` Outline
- **Forms:** Labels über Inputs (nicht daneben), Validierungs-Fehler unter dem Feld in `danger`
- **Mandanten-Switcher:** Dropdown in Topbar links neben dem App-Titel
- **Status-Badges:** rund, kleine Schrift, semantische Farben mit 10% Opacity-Hintergrund

## Dark Mode

Nicht im MVP. P2-Feature. Tokens sind bereits so benannt, dass eine spätere Dark-Variante leicht ergänzt werden kann.

## Iconography

- Library: [Lucide](https://lucide.dev) (bereits in shadcn/ui)
- Standardgröße: 16px in Tabellen, 20px in Buttons, 24px in Sidebar
- Stroke: 1.5px

## Referenzen

- Lucanet (https://www.lucanet.com/de/) — Vorlage für Layout-Patterns
- shadcn/ui (https://ui.shadcn.com) — Komponenten-Basis
