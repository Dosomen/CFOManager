import { createClient } from '@/lib/supabase/server'
import { getActiveMandantId } from '@/lib/mandant/active'
import { getTeamMembers, isOwnerOf } from '@/lib/team/queries'
import { TeamList } from '@/components/team/team-list'
import { de } from '@/lib/messages/de'

export default async function TeamPage() {
  const supabase = await createClient()
  const mandantId = (await getActiveMandantId())!
  const { data: mandant } = await supabase
    .from('mandanten')
    .select('name')
    .eq('id', mandantId)
    .maybeSingle()

  const [members, owner] = await Promise.all([
    getTeamMembers(mandantId),
    isOwnerOf(mandantId),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{de.team.title}</h1>
        <p className="text-slate-500 mt-1">
          {de.team.subtitle}: <span className="font-medium text-slate-700">{mandant?.name}</span>
        </p>
      </div>

      <TeamList members={members} isOwner={owner} />
    </div>
  )
}
