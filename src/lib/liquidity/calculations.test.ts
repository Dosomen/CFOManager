import { describe, expect, it } from 'vitest'
import {
  bucketFromKontoNummer,
  buildSnapshot,
  buildCashTrend,
} from './calculations'
import type { LiquidityRow } from './types'

describe('bucketFromKontoNummer', () => {
  it.each([
    ['1000', 'bank'], // Kasse
    ['1200', 'bank'], // Bank
    ['1299', 'bank'],
    ['1400', 'forderungen'], // Forderungen
    ['1576', 'forderungen'], // Vorsteuer
    ['1599', 'forderungen'],
    ['1610', 'verbindlichkeiten'], // Verb L+L
    ['1700', 'verbindlichkeiten'], // USt
    ['1799', 'verbindlichkeiten'],
    ['0700', 'sonstige'], // Maschinen
    ['8400', 'sonstige'], // Erlöse
    ['XYZ', 'sonstige'], // unparseable
  ] as const)('classifies %s as %s', (nummer, expected) => {
    expect(bucketFromKontoNummer(nummer)).toBe(expected)
  })
})

describe('buildSnapshot', () => {
  const rows: LiquidityRow[] = [
    { jahr: 2026, monat: 3, bucket: 'bank', amount: 250000 },
    { jahr: 2026, monat: 3, bucket: 'forderungen', amount: 130000 },
    { jahr: 2026, monat: 3, bucket: 'verbindlichkeiten', amount: 90000 },
    { jahr: 2026, monat: 2, bucket: 'bank', amount: 200000 },
  ]

  it('builds the snapshot for the requested period', () => {
    const s = buildSnapshot(rows, 2026, 3)
    expect(s).toEqual({
      jahr: 2026,
      monat: 3,
      bank: 250000,
      forderungen: 130000,
      verbindlichkeiten: 90000,
      netto: 250000 + 130000 - 90000,
    })
  })

  it('returns zeros when no data for the period', () => {
    const s = buildSnapshot(rows, 2026, 12)
    expect(s.bank).toBe(0)
    expect(s.netto).toBe(0)
  })
})

describe('buildCashTrend', () => {
  const rows: LiquidityRow[] = [
    { jahr: 2026, monat: 1, bucket: 'bank', amount: 200000 },
    { jahr: 2026, monat: 1, bucket: 'forderungen', amount: 80000 },
    { jahr: 2026, monat: 1, bucket: 'verbindlichkeiten', amount: 65000 },
    { jahr: 2026, monat: 2, bucket: 'bank', amount: 230000 },
    { jahr: 2026, monat: 2, bucket: 'forderungen', amount: 95000 },
    { jahr: 2026, monat: 2, bucket: 'verbindlichkeiten', amount: 70000 },
    { jahr: 2026, monat: 3, bucket: 'bank', amount: 260000 },
    { jahr: 2026, monat: 3, bucket: 'forderungen', amount: 110000 },
    { jahr: 2026, monat: 3, bucket: 'verbindlichkeiten', amount: 78000 },
  ]

  it('returns historical points sorted chronologically', () => {
    const trend = buildCashTrend(rows, 0)
    expect(trend.map((p) => p.monat)).toEqual([1, 2, 3])
    expect(trend[0].projected).toBeUndefined()
  })

  it('extrapolates forecast points marked as projected', () => {
    const trend = buildCashTrend(rows, 2)
    expect(trend.length).toBe(5)
    expect(trend.slice(0, 3).every((p) => !p.projected)).toBe(true)
    expect(trend.slice(3).every((p) => p.projected === true)).toBe(true)
    // Bank growing by 30k/month → April projected to ~290k
    expect(trend[3].bank).toBeCloseTo(290000)
  })

  it('handles year rollover in forecast', () => {
    const decemberRows: LiquidityRow[] = [
      { jahr: 2026, monat: 11, bucket: 'bank', amount: 100000 },
      { jahr: 2026, monat: 12, bucket: 'bank', amount: 110000 },
    ]
    const trend = buildCashTrend(decemberRows, 2)
    expect(trend[2]).toMatchObject({ jahr: 2027, monat: 1, projected: true })
    expect(trend[3]).toMatchObject({ jahr: 2027, monat: 2, projected: true })
  })
})
