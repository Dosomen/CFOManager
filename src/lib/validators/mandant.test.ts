import { describe, expect, it } from 'vitest'
import {
  deleteMandantSchema,
  mandantFormSchema,
  switchMandantSchema,
  updateMandantSchema,
} from './mandant'

const UUID = '550e8400-e29b-41d4-a716-446655440000'

const baseValid = {
  name: 'Beispiel GmbH',
  rechtsform: 'GmbH' as const,
  basiswaehrung: 'EUR',
  geschaeftsjahr_start: '01-01',
  ust_idnr: '',
  diamant_mandantennummer: '',
}

describe('mandantFormSchema', () => {
  it('accepts a minimal valid input with empty optional fields', () => {
    expect(mandantFormSchema.safeParse(baseValid).success).toBe(true)
  })

  it('trims and rejects empty names', () => {
    expect(
      mandantFormSchema.safeParse({ ...baseValid, name: '   ' }).success
    ).toBe(false)
  })

  it('rejects names longer than 200 characters', () => {
    expect(
      mandantFormSchema.safeParse({ ...baseValid, name: 'a'.repeat(201) }).success
    ).toBe(false)
  })

  it('rejects unknown rechtsform values', () => {
    expect(
      mandantFormSchema.safeParse({ ...baseValid, rechtsform: 'Limited' as never })
        .success
    ).toBe(false)
  })

  it('accepts all valid rechtsform values', () => {
    const all = [
      'GmbH',
      'AG',
      'UG',
      'GmbH_und_Co_KG',
      'Einzelunternehmen',
      'Sonstiges',
    ] as const
    for (const rechtsform of all) {
      expect(
        mandantFormSchema.safeParse({ ...baseValid, rechtsform }).success
      ).toBe(true)
    }
  })

  it('rejects non-ISO currency codes', () => {
    expect(
      mandantFormSchema.safeParse({ ...baseValid, basiswaehrung: 'eur' }).success
    ).toBe(false)
    expect(
      mandantFormSchema.safeParse({ ...baseValid, basiswaehrung: 'EU' }).success
    ).toBe(false)
  })

  it('rejects invalid geschaeftsjahr_start format', () => {
    expect(
      mandantFormSchema.safeParse({
        ...baseValid,
        geschaeftsjahr_start: '13-01',
      }).success
    ).toBe(false)
    expect(
      mandantFormSchema.safeParse({
        ...baseValid,
        geschaeftsjahr_start: '01-32',
      }).success
    ).toBe(false)
    expect(
      mandantFormSchema.safeParse({
        ...baseValid,
        geschaeftsjahr_start: '1-1',
      }).success
    ).toBe(false)
  })

  it('treats empty optional strings as "not set"', () => {
    const result = mandantFormSchema.safeParse({
      ...baseValid,
      ust_idnr: '',
      diamant_mandantennummer: '',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.ust_idnr).toBe('')
      expect(result.data.diamant_mandantennummer).toBe('')
    }
  })

  it('rejects ust_idnr shorter than 4 characters when provided', () => {
    expect(
      mandantFormSchema.safeParse({ ...baseValid, ust_idnr: 'DE1' }).success
    ).toBe(false)
  })

  it('rejects diamant_mandantennummer longer than 50 characters', () => {
    expect(
      mandantFormSchema.safeParse({
        ...baseValid,
        diamant_mandantennummer: 'a'.repeat(51),
      }).success
    ).toBe(false)
  })
})

describe('updateMandantSchema', () => {
  it('requires a valid UUID id', () => {
    expect(
      updateMandantSchema.safeParse({ ...baseValid, id: 'not-a-uuid' }).success
    ).toBe(false)
    expect(updateMandantSchema.safeParse({ ...baseValid, id: UUID }).success).toBe(
      true
    )
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
