'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getActiveMandantId } from '@/lib/mandant/active'
import { saveBudgetsSchema, type SaveBudgetsInput } from '@/lib/validators/budget'
import { de } from '@/lib/messages/de'
import { type ActionResult } from '@/lib/actions/types'

export async function saveBudgetsAction(
  payload: SaveBudgetsInput
): Promise<ActionResult<{ count: number }>> {
  const parsed = saveBudgetsSchema.safeParse(payload)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? de.errors.invalidInput,
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: de.errors.unauthorized }

  const mandantId = await getActiveMandantId()
  if (!mandantId) return { ok: false, error: 'Kein aktiver Mandant' }

  const rows = parsed.data.entries.map((e) => ({
    mandant_id: mandantId,
    konto_id: e.konto_id,
    jahr: parsed.data.jahr,
    betrag: e.betrag,
  }))

  if (rows.length === 0) return { ok: true, data: { count: 0 } }

  // Upsert by (konto_id, jahr) — unique constraint matches
  const { error } = await supabase.from('budgets').upsert(rows, {
    onConflict: 'konto_id,jahr',
  })

  if (error) {
    console.error('[saveBudgetsAction] upsert failed', { error })
    return { ok: false, error: error.message }
  }

  revalidatePath('/planung')
  revalidatePath('/dashboard')
  return { ok: true, data: { count: rows.length } }
}
