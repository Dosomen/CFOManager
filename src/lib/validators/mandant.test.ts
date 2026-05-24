import { describe, expect, it } from 'vitest'
import {
  deleteMandantSchema,
  mandantInputSchema,
  switchMandantSchema,
  updateMandantSchema,
} from './mandant'

const UUID = '550e8400-e29b-41d4-a716-446655440000'

describe('mandantInputSchema', () => {
  it('accepts a minimal valid input and applies defaults', () => {
    const result = mandantInputSchema.safeParse({
      name: 'Beispiel GmbH',
      rechtsform: 'GmbH',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.basiswaehrung).toBe('EUR')
      expect(result.data.geschaeftsjahr_start).toBe('01-01')
      expect(result.data.ust_idnr).toBeUndefined()
      expect(result.data.diamant_mandantennummer).toBeUndefined()
    }
  })

  it('trims and rejects empty names', () => {
    expect(
      mandantInputSchema.safeParse({ name: '   ', rechtsform: 'GmbH' }).success
    ).toBe(false)
  })

  it('rejects names longer than 200 characters', () => {
    expect(
      mandantInputSchema.safeParse({
        name: 'a'.repeat(201),
        rechtsform: 'GmbH',
      }).success
    ).toBe(false)
  })

  it('rejects unknown rechtsform values', () => {
    expect(
      mandantInputSchema.safeParse({
        name: 'Test',
        rechtsform: 'Limited',
      }).success
    ).toBe(false)
  })

  it('accepts all valid rechtsform values', () => {
    const all = ['GmbH', 'AG', 'UG', 'GmbH_und_Co_KG', 'Einzelunternehmen', 'Sonstiges']
    for (const rechtsform of all) {
      expect(
        mandantInputSchema.safeParse({ name: 'Test', rechtsform }).success
      ).toBe(true)
    }
  })

  it('rejects non-ISO currency codes', () => {
    expect(
      mandantInputSchema.safeParse({
        name: 'Test',
        rechtsform: 'GmbH',
        basiswaehrung: 'eur',
      }).success
    ).toBe(false)
    expect(
      mandantInputSchema.safeParse({
        name: 'Test',
        rechtsform: 'GmbH',
        basiswaehrung: 'EU',
      }).success
    ).toBe(false)
  })

  it('rejects invalid geschaeftsjahr_start format', () => {
    expect(
      mandantInputSchema.safeParse({
        name: 'Test',
        rechtsform: 'GmbH',
        geschaeftsjahr_start: '13-01',
      }).success
    ).toBe(false)
    expect(
      mandantInputSchema.safeParse({
        name: 'Test',
        rechtsform: 'GmbH',
        geschaeftsjahr_start: '01-32',
      }).success
    ).toBe(false)
    expect(
      mandantInputSchema.safeParse({
        name: 'Test',
        rechtsform: 'GmbH',
        geschaeftsjahr_start: '1-1',
      }).success
    ).toBe(false)
  })

  it('treats empty optional strings as undefined', () => {
    const result = mandantInputSchema.safeParse({
      name: 'Test',
      rechtsform: 'GmbH',
      ust_idnr: '',
      diamant_mandantennummer: '',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.ust_idnr).toBeUndefined()
      expect(result.data.diamant_mandantennummer).toBeUndefined()
    }
  })

  it('rejects ust_idnr shorter than 4 characters', () => {
    expect(
      mandantInputSchema.safeParse({
        name: 'Test',
        rechtsform: 'GmbH',
        ust_idnr: 'DE1',
      }).success
    ).toBe(false)
  })
})

describe('updateMandantSchema', () => {
  it('requires a valid UUID id', () => {
    expect(
      updateMandantSchema.safeParse({
        id: 'not-a-uuid',
        name: 'X',
        rechtsform: 'GmbH',
      }).success
    ).toBe(false)
    expect(
      updateMandantSchema.safeParse({ id: UUID, name: 'X', rechtsform: 'GmbH' }).success
    ).toBe(true)
  })
})

describe('deleteMandantSchema', () => {
  it('requires id and confirmName', () => {
    expect(
      deleteMandantSchema.safeParse({ id: UUID, confirmName: 'X' }).success
    ).toBe(true)
    expect(
      deleteMandantSchema.safeParse({ id: UUID, confirmName: '' }).success
    ).toBe(false)
  })
})

describe('switchMandantSchema', () => {
  it('requires a UUID mandantId', () => {
    expect(switchMandantSchema.safeParse({ mandantId: UUID }).success).toBe(true)
    expect(switchMandantSchema.safeParse({ mandantId: 'x' }).success).toBe(false)
  })
})
