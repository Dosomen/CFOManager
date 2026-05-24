'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  deleteMandantSchema,
  mandantFormSchema,
  switchMandantSchema,
  updateMandantSchema,
} from '@/lib/validators/mandant'
import { setActiveMandantId } from '@/lib/mandant/active'
import { de } from '@/lib/messages/de'
import {
  type ActionResult,
  fieldErrorsFromZod,
  formDataToObject,
} from '@/lib/actions/types'

export async function createMandantAction(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const parsed = mandantFormSchema.safeParse(formDataToObject(formData))
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
  if (!user) return { ok: false, error: de.errors.unauthorized }

  const { data, error } = await supabase
    .from('mandanten')
    .insert({
      name: parsed.data.name,
      rechtsform: parsed.data.rechtsform,
      basiswaehrung: parsed.data.basiswaehrung,
      geschaeftsjahr_start: parsed.data.geschaeftsjahr_start,
      ust_idnr: parsed.data.ust_idnr || null,
      diamant_mandantennummer: parsed.data.diamant_mandantennummer || null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { ok: false, error: de.mandant.errors.unexpectedError }
  }

  // Set the freshly-created mandant as active (covers onboarding case).
  await supabase
    .from('user_profiles')
    .update({ active_mandant_id: data.id })
    .eq('user_id', user.id)

  revalidatePath('/', 'layout')
  return { ok: true, data: { id: data.id } }
}

export async function updateMandantAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = updateMandantSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? de.errors.invalidInput,
      fieldErrors: fieldErrorsFromZod(parsed.error),
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('mandanten')
    .update({
      name: parsed.data.name,
      rechtsform: parsed.data.rechtsform,
      basiswaehrung: parsed.data.basiswaehrung,
      geschaeftsjahr_start: parsed.data.geschaeftsjahr_start,
      ust_idnr: parsed.data.ust_idnr || null,
      diamant_mandantennummer: parsed.data.diamant_mandantennummer || null,
    })
    .eq('id', parsed.data.id)

  if (error) return { ok: false, error: de.mandant.errors.unexpectedError }

  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function deleteMandantAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = deleteMandantSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? de.errors.invalidInput,
      fieldErrors: fieldErrorsFromZod(parsed.error),
    }
  }

  const supabase = await createClient()
  const { data: mandant } = await supabase
    .from('mandanten')
    .select('id, name')
    .eq('id', parsed.data.id)
    .maybeSingle()
  if (!mandant) {
    return { ok: false, error: de.mandant.errors.notFound }
  }
  if (mandant.name !== parsed.data.confirmName) {
    return {
      ok: false,
      error: de.mandant.delete.mismatch,
      fieldErrors: { confirmName: de.mandant.delete.mismatch },
    }
  }

  // Prevent deleting the user's last mandant (would strand them in onboarding loop).
  const { count } = await supabase
    .from('mandanten')
    .select('id', { count: 'exact', head: true })
  if ((count ?? 0) <= 1) {
    return { ok: false, error: de.mandant.delete.lastMandant }
  }

  const { error } = await supabase
    .from('mandanten')
    .delete()
    .eq('id', parsed.data.id)
  if (error) return { ok: false, error: de.mandant.errors.unexpectedError }

  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function switchActiveMandantAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = switchMandantSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? de.errors.invalidInput,
    }
  }

  try {
    await setActiveMandantId(parsed.data.mandantId)
    revalidatePath('/', 'layout')
    return { ok: true }
  } catch {
    return { ok: false, error: de.mandant.errors.noAccess }
  }
}
