import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseDiamantBuffer } from './diamant'

const sampleDir = resolve(__dirname, '../../../samples')

function loadSample(name: string): Uint8Array {
  const path = resolve(sampleDir, name)
  if (!existsSync(path)) {
    throw new Error(
      `Sample file missing: ${path}. Run 'python3 samples/generate-demo-data.py' first.`
    )
  }
  return new Uint8Array(readFileSync(path))
}

describe('parseDiamantBuffer — demo Q1 2026 Herschel GmbH', () => {
  describe.each([1, 2, 3] as const)('month %d', (month) => {
    const buf = loadSample(`diamant-summenliste-2026-${String(month).padStart(2, '0')}.xlsx`)
    const result = parseDiamantBuffer(buf)

    it('reports no errors', () => {
      expect(result.errors).toEqual([])
    })

    it('reads mandant metadata from header block', () => {
      expect(result.mandantHint).toBe('Herschel GmbH')
      expect(result.mandantnrHint).toBe('10001')
      expect(result.kontenrahmen).toBe('SKR03')
    })

    it('parses the period correctly', () => {
      expect(result.periode).toEqual({ jahr: 2026, monat: month })
    })

    it('detects 43 konten and 43 salden', () => {
      expect(result.konten.length).toBe(43)
      expect(result.salden.length).toBe(43)
    })

    it('Soll and Haben sums balance', () => {
      const diff = Math.abs(parseFloat(result.summen.soll) - parseFloat(result.summen.haben))
      expect(diff).toBeLessThan(0.01)
    })

    it('classifies Bank (1200) as Aktiva', () => {
      const k = result.konten.find((c) => c.nummer === '1200')
      expect(k?.typ).toBe('Aktiva')
    })

    it('classifies Umsatzsteuer 19% (1700) as Passiva', () => {
      const k = result.konten.find((c) => c.nummer === '1700')
      expect(k?.typ).toBe('Passiva')
    })

    it('classifies Erlöse 19% (8400) as Ertrag', () => {
      const k = result.konten.find((c) => c.nummer === '8400')
      expect(k?.typ).toBe('Ertrag')
    })

    it('classifies Löhne (4100) as Aufwand', () => {
      const k = result.konten.find((c) => c.nummer === '4100')
      expect(k?.typ).toBe('Aufwand')
    })

    it('emits salden as strings with 2 decimal places', () => {
      for (const s of result.salden) {
        expect(s.eb_soll).toMatch(/^-?\d+\.\d{2}$/)
        expect(s.saldo_haben).toMatch(/^-?\d+\.\d{2}$/)
      }
    })

    it('all salden reference a konto that exists in the same payload', () => {
      const kontoNummern = new Set(result.konten.map((k) => k.nummer))
      for (const s of result.salden) {
        expect(kontoNummern.has(s.konto_nummer)).toBe(true)
      }
    })
  })

  it('stable konto count across months (chart of accounts is the same)', () => {
    const m1 = parseDiamantBuffer(loadSample('diamant-summenliste-2026-01.xlsx'))
    const m3 = parseDiamantBuffer(loadSample('diamant-summenliste-2026-03.xlsx'))
    expect(m1.konten.length).toBe(m3.konten.length)
  })

  it('saldo grows / changes month to month (different data)', () => {
    const m1 = parseDiamantBuffer(loadSample('diamant-summenliste-2026-01.xlsx'))
    const m3 = parseDiamantBuffer(loadSample('diamant-summenliste-2026-03.xlsx'))
    const bank1 = m1.salden.find((s) => s.konto_nummer === '1200')!
    const bank3 = m3.salden.find((s) => s.konto_nummer === '1200')!
    expect(bank1.saldo_soll).not.toBe(bank3.saldo_soll)
  })
})

describe('parseDiamantBuffer — error handling', () => {
  it('returns an error for an empty buffer', () => {
    const result = parseDiamantBuffer(new Uint8Array([]))
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('returns an error for non-Excel bytes', () => {
    const result = parseDiamantBuffer(new TextEncoder().encode('not excel content'))
    expect(result.errors.length).toBeGreaterThan(0)
  })
})
