import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/types/database'

export type MandantRolle = Database['public']['Enums']['mandant_rolle']

export interface TeamMember {
  user_id: string
  email: string | null
  rolle: MandantRolle
  joined_at: string
  is_self: boolean
}

/**
 * Lists all members of the given mandant. Requires the calling user to
 * be a member (RLS enforces SELECT visibility on mandant_users); the
 * admin client is only used to resolve user emails.
 */
export async function getTeamMembers(mandantId: string): Promise<TeamMember[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: rows } = await supabase
    .from('mandant_users')
    .select('user_id, rolle, created_at')
    .eq('mandant_id', mandantId)
    .order('created_at', { ascending: true })

  if (!rows || rows.length === 0) return []

  // Resolve emails via admin client (auth.users is not directly queryable).
  const admin = createAdminClient()
  const members: TeamMember[] = []
  for (const r of rows) {
    let email: string | null = null
    if (r.user_id === user.id) {
      email = user.email ?? null
    } else {
      const { data } = await admin.auth.admin.getUserById(r.user_id)
      email = data.user?.email ?? null
    }
    members.push({
      user_id: r.user_id,
      email,
      rolle: r.rolle,
      joined_at: r.created_at,
      is_self: r.user_id === user.id,
    })
  }
  return members
}

export async function isOwnerOf(mandantId: string): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase
    .from('mandant_users')
    .select('rolle')
    .eq('mandant_id', mandantId)
    .eq('user_id', user.id)
    .maybeSingle()
  return data?.rolle === 'owner'
}
