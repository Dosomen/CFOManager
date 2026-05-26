'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveMandantId } from '@/lib/mandant/active'
import { isOwnerOf } from '@/lib/team/queries'
import {
  inviteMemberSchema,
  removeMemberSchema,
} from '@/lib/validators/team'
import { de } from '@/lib/messages/de'
import {
  type ActionResult,
  fieldErrorsFromZod,
  formDataToObject,
} from '@/lib/actions/types'

export async function inviteTeamMemberAction(
  _prev: ActionResult<{ email: string }> | null,
  formData: FormData
): Promise<ActionResult<{ email: string }>> {
  const parsed = inviteMemberSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? de.errors.invalidInput,
      fieldErrors: fieldErrorsFromZod(parsed.error),
    }
  }

  const mandantId = await getActiveMandantId()
  if (!mandantId) return { ok: false, error: de.team.errors.noActiveMandant }

  if (!(await isOwnerOf(mandantId))) {
    return { ok: false, error: de.team.errors.notOwner }
  }

  const admin = createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''

  // Check if a user with this email already exists
  const { data: existing } = await admin.auth.admin.listUsers()
  const existingUser = existing?.users.find(
    (u) => u.email?.toLowerCase() === parsed.data.email.toLowerCase()
  )

  let userId: string
  if (existingUser) {
    // User already exists in Supabase Auth — just link them to the mandant
    userId = existingUser.id
  } else {
    const { data: inviteData, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
        redirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
      })
    if (inviteError || !inviteData?.user) {
      return {
        ok: false,
        error: inviteError?.message ?? de.team.errors.inviteFailed,
      }
    }
    userId = inviteData.user.id
  }

  // Already a member?
  const { count } = await admin
    .from('mandant_users')
    .select('user_id', { count: 'exact', head: true })
    .eq('mandant_id', mandantId)
    .eq('user_id', userId)

  if ((count ?? 0) > 0) {
    return { ok: false, error: de.team.errors.alreadyMember }
  }

  const { error: linkError } = await admin
    .from('mandant_users')
    .insert({ mandant_id: mandantId, user_id: userId, rolle: 'member' })

  if (linkError) {
    return { ok: false, error: linkError.message }
  }

  revalidatePath('/team')
  return { ok: true, data: { email: parsed.data.email } }
}

export async function removeTeamMemberAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = removeMemberSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? de.errors.invalidInput,
    }
  }

  const mandantId = await getActiveMandantId()
  if (!mandantId) return { ok: false, error: de.team.errors.noActiveMandant }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: de.errors.unauthorized }

  // Get target's rolle
  const { data: target } = await supabase
    .from('mandant_users')
    .select('rolle')
    .eq('mandant_id', mandantId)
    .eq('user_id', parsed.data.user_id)
    .maybeSingle()
  if (!target) return { ok: false, error: de.team.errors.memberNotFound }

  // Permission: owner can remove anyone; non-owner can only remove self
  const isOwner = await isOwnerOf(mandantId)
  const isSelf = parsed.data.user_id === user.id
  if (!isOwner && !isSelf) {
    return { ok: false, error: de.team.errors.notOwner }
  }

  // Prevent removing the last owner
  if (target.rolle === 'owner') {
    const { count: ownerCount } = await supabase
      .from('mandant_users')
      .select('user_id', { count: 'exact', head: true })
      .eq('mandant_id', mandantId)
      .eq('rolle', 'owner')
    if ((ownerCount ?? 0) <= 1) {
      return { ok: false, error: de.team.errors.lastOwner }
    }
  }

  const { error } = await supabase
    .from('mandant_users')
    .delete()
    .eq('mandant_id', mandantId)
    .eq('user_id', parsed.data.user_id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/team')
  return { ok: true }
}
