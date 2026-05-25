import { describe, expect, it } from 'vitest'
import { deriveTyp, deriveTypFromSkr03, deriveTypFromSkr04 } from './skr'

describe('deriveTypFromSkr03', () => {
  it.each([
    ['0410', 'Aktiva'], // Geschäftsausstattung
    ['0420', 'Aktiva'], // Büromaschinen
    ['0700', 'Aktiva'], // Maschinen
    ['0800', 'Passiva'], // Gezeichnetes Kapital
    ['0860', 'Passiva'], // Gewinnvortrag
    ['0980', 'Passiva'], // Darlehen
    ['1000', 'Aktiva'], // Kasse
    ['1200', 'Aktiva'], // Bank
    ['1400', 'Aktiva'], // Forderungen
    ['1576', 'Aktiva'], // Vorsteuer
    ['1610', 'Passiva'], // Verb L+L
    ['1700', 'Passiva'], // USt 19
    ['1740', 'Passiva'], // Verb Krankenkassen
    ['3300', 'Aufwand'], // Wareneingang 19%
    ['4100', 'Aufwand'], // Löhne
    ['4210', 'Aufwand'], // Miete
    ['6800', 'Aufwand'], // Geldverkehrskosten
    ['7300', 'Aufwand'], // Zinsaufwand
    ['8400', 'Ertrag'], // Erlöse 19%
    ['8300', 'Ertrag'], // Erlöse 7%
    ['8100', 'Ertrag'], // Zinserträge
  ] as const)('classifies %s as %s', (nummer, expected) => {
    expect(deriveTypFromSkr03(nummer)).toBe(expected)
  })

  it('returns null for non-numeric input', () => {
    expect(deriveTypFromSkr03('ABC')).toBeNull()
  })

  it('falls back to Aktiva for 9xxx (statistical)', () => {
    expect(deriveTypFromSkr03('9000')).toBe('Aktiva')
  })
})

describe('deriveTypFromSkr04', () => {
  it.each([
    ['0700', 'Aktiva'],
    ['2000', 'Aktiva'],
    ['3000', 'Passiva'],
    ['4400', 'Ertrag'],
    ['5300', 'Aufwand'],
    ['6800', 'Aufwand'],
  ] as const)('classifies %s as %s', (nummer, expected) => {
    expect(deriveTypFromSkr04(nummer)).toBe(expected)
  })
})

describe('deriveTyp', () => {
  it('defaults to SKR03 when kontenrahmen is unknown', () => {
    expect(deriveTyp('8400')).toBe('Ertrag')
    expect(deriveTyp('8400', 'SKR03')).toBe('Ertrag')
    expect(deriveTyp('8400', null)).toBe('Ertrag')
  })

  it('switches to SKR04 when kontenrahmen says so', () => {
    expect(deriveTyp('4400', 'SKR04')).toBe('Ertrag')
    // SKR03 would classify 4400 differently (Aufwand)
    expect(deriveTyp('4400', 'SKR03')).toBe('Aufwand')
  })

  it('case-insensitive kontenrahmen match', () => {
    expect(deriveTyp('4400', 'skr04')).toBe('Ertrag')
    expect(deriveTyp('4400', 'Skr04 (Industriekontenrahmen)')).toBe('Ertrag')
  })

  it('falls back to Aktiva for unparseable input', () => {
    expect(deriveTyp('NOTANUMBER')).toBe('Aktiva')
  })
})
