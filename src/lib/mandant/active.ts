import 'server-only'
import { createClient } from '@/lib/supabase/server'

/**
 * Returns the active mandant ID for the current user.
 *
 * Falls back gracefully:
 *  1. Persisted active_mandant_id (validated through RLS)
 *  2. First accessible mandant (and persists it)
 *  3. null when the user has no mandants
 */
export async function getActiveMandantId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('active_mandant_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profile?.active_mandant_id) {
    // RLS filters out mandanten the user cannot access.
    const { data: mandant } = await supabase
      .from('mandanten')
      .select('id')
      .eq('id', profile.active_mandant_id)
      .maybeSingle()
    if (mandant) return mandant.id
  }

  const { data: firstMandant } = await supabase
    .from('mandanten')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (!firstMandant) return null

  await supabase
    .from('user_profiles')
    .update({ active_mandant_id: firstMandant.id })
    .eq('user_id', user.id)

  return firstMandant.id
}

export async function setActiveMandantId(mandantId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // RLS prevents selecting mandanten the user has no access to.
  const { data: mandant } = await supabase
    .from('mandanten')
    .select('id')
    .eq('id', mandantId)
    .maybeSingle()
  if (!mandant) throw new Error('Mandant not found or no access')

  const { error } = await supabase
    .from('user_profiles')
    .update({ active_mandant_id: mandantId })
    .eq('user_id', user.id)
  if (error) throw error
}
