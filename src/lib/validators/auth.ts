import { z } from 'zod'

const passwordSchema = z
  .string()
  .min(12, 'Passwort muss mindestens 12 Zeichen lang sein.')
  .max(128, 'Passwort darf höchstens 128 Zeichen lang sein.')

const emailSchema = z
  .string()
  .trim()
  .min(1, 'E-Mail erforderlich.')
  .email('Ungültige E-Mail-Adresse.')

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Passwort erforderlich.'),
})

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
})

export const passwordResetConfirmSchema = z.object({
  password: passwordSchema,
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Aktuelles Passwort erforderlich.'),
    newPassword: passwordSchema,
    newPasswordConfirm: z.string(),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    message: 'Die neuen Passwörter stimmen nicht überein.',
    path: ['newPasswordConfirm'],
  })

export const totpCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Bitte gib einen 6-stelligen Code ein.'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type TotpCodeInput = z.infer<typeof totpCodeSchema>
