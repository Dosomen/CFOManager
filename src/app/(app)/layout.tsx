import { redirect } from 'next/navigation'
import { AppShell } from '@/components/shell/app-shell'
import { createClient } from '@/lib/supabase/server'
import { getActiveMandantId } from '@/lib/mandant/active'

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const activeMandantId = await getActiveMandantId()
  if (!activeMandantId) redirect('/onboarding')

  const { data: activeMandant } = await supabase
    .from('mandanten')
    .select('id, name')
    .eq('id', activeMandantId)
    .maybeSingle()

  const { data: allMandanten } = await supabase
    .from('mandanten')
    .select('id, name')
    .order('name', { ascending: true })

  if (!activeMandant) redirect('/onboarding')

  return (
    <AppShell
      activeMandant={activeMandant}
      mandanten={allMandanten ?? []}
      userEmail={user.email ?? ''}
    >
      {children}
    </AppShell>
  )
}
