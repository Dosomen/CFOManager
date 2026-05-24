'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  changePasswordSchema,
  loginSchema,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
  totpCodeSchema,
} from '@/lib/validators/auth'
import { de } from '@/lib/messages/de'
import {
  type ActionResult,
  fieldErrorsFromZod,
  formDataToObject,
} from '@/lib/actions/types'

export type LoginActionResult =
  | { ok: true; needsMfa: false }
  | { ok: true; needsMfa: true; factorId: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

export async function loginAction(
  _prev: LoginActionResult | null,
  formData: FormData
): Promise<LoginActionResult> {
  const parsed = loginSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? de.errors.invalidInput,
      fieldErrors: fieldErrorsFromZod(parsed.error),
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    if (error.status === 429) {
      return { ok: false, error: de.auth.login.rateLimited }
    }
    return { ok: false, error: de.auth.login.invalidCredentials }
  }

  // If the user has any verified TOTP factor, require a second step.
  const { data: factors } = await supabase.auth.mfa.listFactors()
  const verifiedTotp = factors?.totp.find((f) => f.status === 'verified')
  if (verifiedTotp) {
    return { ok: true, needsMfa: true, factorId: verifiedTotp.id }
  }

  return { ok: true, needsMfa: false }
}

export async function verifyMfaLoginAction(
  factorId: string,
  code: string
): Promise<ActionResult> {
  const parsed = totpCodeSchema.safeParse({ code })
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? de.errors.invalidInput,
    }
  }
  const supabase = await createClient()
  const { data: challenge, error: challengeError } =
    await supabase.auth.mfa.challenge({ factorId })
  if (challengeError || !challenge) {
    return { ok: false, error: de.errors.server }
  }
  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code: parsed.data.code,
  })
  if (verifyError) {
    return { ok: false, error: de.auth.mfa.invalidCode }
  }
  return { ok: true }
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function requestPasswordResetAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = passwordResetRequestSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? de.errors.invalidInput,
      fieldErrors: fieldErrorsFromZod(parsed.error),
    }
  }
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/passwort-zuruecksetzen`,
  })
  // Always return success — prevents account-existence enumeration.
  return { ok: true }
}

export async function resetPasswordAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = passwordResetConfirmSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? de.errors.invalidInput,
      fieldErrors: fieldErrorsFromZod(parsed.error),
    }
  }
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })
  if (error) {
    return { ok: false, error: de.auth.passwordReset.invalidToken }
  }
  return { ok: true }
}

export async function changePasswordAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? de.errors.invalidInput,
      fieldErrors: fieldErrorsFromZod(parsed.error),
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) {
    return { ok: false, error: de.errors.unauthorized }
  }

  // Reverify current password — Supabase has no native "verify password" API.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  })
  if (signInError) {
    return {
      ok: false,
      error: de.auth.login.invalidCredentials,
      fieldErrors: { currentPassword: de.auth.login.invalidCredentials },
    }
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  })
  if (updateError) {
    return { ok: false, error: de.errors.server }
  }
  return { ok: true }
}

// --- 2FA setup ---

export async function enrollTotpAction(): Promise<
  ActionResult<{ factorId: string; qrCodeSvg: string; secret: string }>
> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
  if (error || !data) {
    return { ok: false, error: de.errors.server }
  }
  return {
    ok: true,
    data: {
      factorId: data.id,
      qrCodeSvg: data.totp.qr_code,
      secret: data.totp.secret,
    },
  }
}

export async function verifyTotpEnrollmentAction(
  factorId: string,
  code: string
): Promise<ActionResult> {
  const parsed = totpCodeSchema.safeParse({ code })
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? de.errors.invalidInput,
    }
  }
  const supabase = await createClient()
  const { data: challenge, error: challengeError } =
    await supabase.auth.mfa.challenge({ factorId })
  if (challengeError || !challenge) {
    return { ok: false, error: de.errors.server }
  }
  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code: parsed.data.code,
  })
  if (verifyError) {
    return { ok: false, error: de.auth.mfa.invalidCode }
  }
  return { ok: true }
}

export async function unenrollTotpAction(factorId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.mfa.unenroll({ factorId })
  if (error) return { ok: false, error: de.errors.server }
  return { ok: true }
}

export async function listMfaFactorsAction(): Promise<
  ActionResult<{ factors: Array<{ id: string; status: 'verified' | 'unverified' }> }>
> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error || !data) return { ok: false, error: de.errors.server }
  return {
    ok: true,
    data: {
      factors: data.totp.map((f) => ({
        id: f.id,
        status: f.status === 'verified' ? 'verified' : 'unverified',
      })),
    },
  }
}
