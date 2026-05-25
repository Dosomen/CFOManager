import type { Database } from '@/lib/types/database'

export type KontenTyp = Database['public']['Enums']['konten_typ']

/**
 * Derives the konto type from an SKR03 chart-of-accounts number.
 *
 * SKR03 ranges:
 *   0000-0799  Anlagevermögen           -> Aktiva
 *   0800-0999  Eigenkapital, Rücklagen, langfristige Darlehen -> Passiva
 *   1000-1599  Finanz-/Vorsteuerkonten  -> Aktiva
 *   1600-1999  Verbindlichkeiten, USt   -> Passiva
 *   2xxx       Abschluss-/Korrektur     -> Passiva
 *   3xxx-4xxx  Aufwand                  -> Aufwand
 *   6xxx-7xxx  Sonstige Aufwendungen    -> Aufwand
 *   8xxx       Erträge                  -> Ertrag
 *   9xxx       Vortrags-/Statistik      -> Aktiva (Default)
 */
export function deriveTypFromSkr03(nummer: string): KontenTyp | null {
  const n = parseInt(nummer, 10)
  if (Number.isNaN(n)) return null
  if (n <= 799) return 'Aktiva'
  if (n <= 999) return 'Passiva'
  if (n <= 1599) return 'Aktiva'
  if (n <= 1999) return 'Passiva'
  if (n <= 2999) return 'Passiva'
  if (n <= 4999) return 'Aufwand'
  if (n >= 6000 && n <= 7999) return 'Aufwand'
  if (n >= 8000 && n <= 8999) return 'Ertrag'
  return 'Aktiva'
}

/**
 * SKR04 (international/IFRS-friendly) — broad ranges only.
 * Full SKR04 mapping is deferred to P1; we cover the common cases here.
 */
export function deriveTypFromSkr04(nummer: string): KontenTyp | null {
  const n = parseInt(nummer, 10)
  if (Number.isNaN(n)) return null
  if (n <= 999) return 'Aktiva' // immaterielle/Sachanlagen
  if (n <= 2999) return 'Aktiva' // Umlaufvermögen
  if (n <= 3999) return 'Passiva' // Eigenkapital + Verbindlichkeiten
  if (n <= 4999) return 'Ertrag' // Betriebliche Erträge
  if (n <= 7999) return 'Aufwand' // Aufwendungen
  return 'Aktiva'
}

export function deriveTyp(nummer: string, kontenrahmen?: string | null): KontenTyp {
  const kr = (kontenrahmen ?? '').toUpperCase()
  const fn = kr.includes('SKR04') ? deriveTypFromSkr04 : deriveTypFromSkr03
  return fn(nummer) ?? 'Aktiva'
}
