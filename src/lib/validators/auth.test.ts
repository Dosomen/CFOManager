import { describe, expect, it } from 'vitest'
import {
  changePasswordSchema,
  loginSchema,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
  totpCodeSchema,
} from './auth'

describe('loginSchema', () => {
  it('accepts a valid email and any non-empty password', () => {
    const result = loginSchema.safeParse({
      email: 'cfo@example.com',
      password: 'whatever',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'x' })
    expect(result.success).toBe(false)
  })

  it('rejects an empty password', () => {
    const result = loginSchema.safeParse({ email: 'cfo@example.com', password: '' })
    expect(result.success).toBe(false)
  })

  it('trims whitespace from email', () => {
    const result = loginSchema.safeParse({
      email: '  cfo@example.com  ',
      password: 'pw',
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.email).toBe('cfo@example.com')
  })
})

describe('passwordResetRequestSchema', () => {
  it('requires a valid email', () => {
    expect(passwordResetRequestSchema.safeParse({ email: 'a@b.de' }).success).toBe(
      true
    )
    expect(passwordResetRequestSchema.safeParse({ email: '' }).success).toBe(false)
  })
})

describe('passwordResetConfirmSchema', () => {
  it('requires at least 12 characters', () => {
    expect(
      passwordResetConfirmSchema.safeParse({ password: 'a'.repeat(11) }).success
    ).toBe(false)
    expect(
      passwordResetConfirmSchema.safeParse({ password: 'a'.repeat(12) }).success
    ).toBe(true)
  })

  it('rejects passwords longer than 128 characters', () => {
    expect(
      passwordResetConfirmSchema.safeParse({ password: 'a'.repeat(129) }).success
    ).toBe(false)
  })
})

describe('changePasswordSchema', () => {
  const valid = {
    currentPassword: 'old-password-12',
    newPassword: 'new-password-123',
    newPasswordConfirm: 'new-password-123',
  }

  it('accepts matching new passwords of sufficient length', () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects mismatching new passwords', () => {
    const result = changePasswordSchema.safeParse({
      ...valid,
      newPasswordConfirm: 'something-else-12',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['newPasswordConfirm'])
    }
  })

  it('rejects new password shorter than 12 characters', () => {
    expect(
      changePasswordSchema.safeParse({
        ...valid,
        newPassword: 'shortpw1234',
        newPasswordConfirm: 'shortpw1234',
      }).success
    ).toBe(false)
  })

  it('requires a current password', () => {
    expect(
      changePasswordSchema.safeParse({ ...valid, currentPassword: '' }).success
    ).toBe(false)
  })
})

describe('totpCodeSchema', () => {
  it('accepts exactly 6 digits', () => {
    expect(totpCodeSchema.safeParse({ code: '123456' }).success).toBe(true)
  })

  it('rejects fewer or more than 6 digits', () => {
    expect(totpCodeSchema.safeParse({ code: '12345' }).success).toBe(false)
    expect(totpCodeSchema.safeParse({ code: '1234567' }).success).toBe(false)
  })

  it('rejects non-numeric characters', () => {
    expect(totpCodeSchema.safeParse({ code: '12345a' }).success).toBe(false)
    expect(totpCodeSchema.safeParse({ code: '12 345' }).success).toBe(false)
  })
})
