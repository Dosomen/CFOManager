import { describe, expect, it } from 'vitest'
import {
  buildPeriodReport,
  buildTrend,
  percentChange,
  formatPeriod,
} from './calculations'
import type { MonthlyAggregate } from './types'

function row(
  partial: Partial<MonthlyAggregate> & { typ: MonthlyAggregate['typ'] }
): MonthlyAggregate {
  return {
    jahr: 2026,
    monat: 3,
    sum_eb_soll: 0,
    sum_eb_haben: 0,
    sum_vk_soll: 0,
    sum_vk_haben: 0,
    sum_saldo_soll: 0,
    sum_saldo_haben: 0,
    anzahl_konten: 0,
    ...partial,
  }
}

describe('buildPeriodReport', () => {
  it('computes GuV from Ertrag and Aufwand rows', () => {
    const rows = [
      row({ typ: 'Ertrag', sum_saldo_haben: 165500, sum_saldo_soll: 0 }),
      row({ typ: 'Aufwand', sum_saldo_soll: 132000, sum_saldo_haben: 0 }),
      row({ typ: 'Aktiva', sum_saldo_soll: 500000, sum_saldo_haben: 0 }),
      row({ typ: 'Passiva', sum_saldo_haben: 500000, sum_saldo_soll: 0 }),
    ]
    const r = buildPeriodReport(rows, 2026, 3)
    expect(r.ertraege).toBe(165500)
    expect(r.aufwendungen).toBe(132000)
    expect(r.ergebnis).toBe(33500)
    expect(r.ergebnisMarge).toBeCloseTo(33500 / 165500, 4)
    expect(r.aktiva).toBe(500000)
    expect(r.passiva).toBe(500000)
  })

  it('returns 0s for a period with no data', () => {
    const r = buildPeriodReport([], 2026, 6)
    expect(r.ertraege).toBe(0)
    expect(r.aufwendungen).toBe(0)
    expect(r.ergebnis).toBe(0)
    expect(r.ergebnisMarge).toBeNull()
    expect(r.aktiva).toBe(0)
    expect(r.passiva).toBe(0)
  })

  it('ignores rows from other periods', () => {
    const rows = [
      row({ jahr: 2026, monat: 3, typ: 'Ertrag', sum_saldo_haben: 100 }),
      row({ jahr: 2026, monat: 2, typ: 'Ertrag', sum_saldo_haben: 999 }),
    ]
    const r = buildPeriodReport(rows, 2026, 3)
    expect(r.ertraege).toBe(100)
  })
})

describe('buildTrend', () => {
  it('groups rows by (jahr, monat) and orders chronologically', () => {
    const rows = [
      row({ jahr: 2026, monat: 3, typ: 'Ertrag', sum_saldo_haben: 165 }),
      row({ jahr: 2026, monat: 3, typ: 'Aufwand', sum_saldo_soll: 132 }),
      row({ jahr: 2026, monat: 1, typ: 'Ertrag', sum_saldo_haben: 170 }),
      row({ jahr: 2026, monat: 1, typ: 'Aufwand', sum_saldo_soll: 130 }),
      row({ jahr: 2026, monat: 2, typ: 'Ertrag', sum_saldo_haben: 153 }),
      row({ jahr: 2026, monat: 2, typ: 'Aufwand', sum_saldo_soll: 128 }),
    ]
    const points = buildTrend(rows)
    expect(points.map((p) => p.monat)).toEqual([1, 2, 3])
    expect(points[0].umsatz).toBe(170)
    expect(points[0].ergebnis).toBe(40)
    expect(points[2].umsatz).toBe(165)
    expect(points[2].ergebnis).toBe(33)
    expect(points[0].label).toBe('Jan 26')
  })
})

describe('percentChange', () => {
  it('computes positive change correctly', () => {
    expect(percentChange(120, 100)).toBeCloseTo(0.2)
  })
  it('computes negative change correctly', () => {
    expect(percentChange(80, 100)).toBeCloseTo(-0.2)
  })
  it('returns null when previous is zero', () => {
    expect(percentChange(50, 0)).toBeNull()
  })
})

describe('formatPeriod', () => {
  it('formats month and year in German long form', () => {
    expect(formatPeriod(2026, 1)).toBe('Januar 2026')
    expect(formatPeriod(2026, 12)).toBe('Dezember 2026')
  })
})
