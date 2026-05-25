'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getActiveMandantId } from '@/lib/mandant/active'
import {
  createImportSchema,
  type CreateImportInput,
} from '@/lib/validators/import'
import { de } from '@/lib/messages/de'
import {
  type ActionResult,
  fieldErrorsFromZod,
} from '@/lib/actions/types'

export async function checkPeriodExistsAction(
  jahr: number,
  monat: number
): Promise<ActionResult<{ exists: boolean }>> {
  const supabase = await createClient()
  const mandantId = await getActiveMandantId()
  if (!mandantId) return { ok: true, data: { exists: false } }

  const { count } = await supabase
    .from('importe')
    .select('id', { count: 'exact', head: true })
    .eq('mandant_id', mandantId)
    .eq('periode_jahr', jahr)
    .eq('periode_monat', monat)
    .eq('status', 'erfolgreich')

  return { ok: true, data: { exists: (count ?? 0) > 0 } }
}

export async function createImportAction(
  payload: CreateImportInput
): Promise<ActionResult<{ import_id: string; was_overwritten: boolean }>> {
  const parsed = createImportSchema.safeParse(payload)
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

  const mandantId = await getActiveMandantId()
  if (!mandantId) {
    return { ok: false, error: de.importe.errors.noActiveMandant }
  }

  // Defense in depth: re-check plausibility on the server.
  const summeSoll = parseFloat(parsed.data.summe_soll)
  const summeHaben = parseFloat(parsed.data.summe_haben)
  if (Math.abs(summeSoll - summeHaben) > 0.01) {
    return { ok: false, error: de.importe.errors.sollHabenMismatch }
  }

  // Salden may only reference konten in the same payload.
  const kontoNummern = new Set(parsed.data.konten.map((k) => k.nummer))
  const orphans = parsed.data.salden.filter(
    (s) => !kontoNummern.has(s.konto_nummer)
  )
  if (orphans.length > 0) {
    return {
      ok: false,
      error: `Salden referenzieren ${orphans.length} unbekannte Konten.`,
    }
  }

  const { data, error } = await supabase.rpc('import_salden', {
    p_mandant_id: mandantId,
    p_jahr: parsed.data.jahr,
    p_monat: parsed.data.monat,
    p_dateiname: parsed.data.dateiname,
    p_konten: parsed.data.konten,
    p_salden: parsed.data.salden,
    p_summe_soll: summeSoll,
    p_summe_haben: summeHaben,
  })

  if (error) {
    console.error('[createImportAction] RPC failed', {
      error,
      mandantId,
      jahr: parsed.data.jahr,
      monat: parsed.data.monat,
    })
    return { ok: false, error: error.message || de.errors.server }
  }

  revalidatePath('/importe', 'layout')
  revalidatePath('/dashboard')

  const result = data as { import_id: string; was_overwritten: boolean }
  return { ok: true, data: result }
}
