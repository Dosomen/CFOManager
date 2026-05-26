import { z } from 'zod'

export const inviteMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'E-Mail erforderlich.')
    .email('Ungültige E-Mail-Adresse.'),
})

export const removeMemberSchema = z.object({
  user_id: z.uuid('Ungültige User-ID.'),
})

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>
