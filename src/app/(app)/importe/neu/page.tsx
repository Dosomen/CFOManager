import { ImportWizard } from '@/components/importe/import-wizard'
import { createClient } from '@/lib/supabase/server'
import { getActiveMandantId } from '@/lib/mandant/active'
import { redirect } from 'next/navigation'

export default async function NeuerImportPage() {
  const supabase = await createClient()
  const mandantId = await getActiveMandantId()
  if (!mandantId) redirect('/onboarding')

  const { data: mandant } = await supabase
    .from('mandanten')
    .select('id, name')
    .eq('id', mandantId)
    .single()

  if (!mandant) redirect('/onboarding')

  return <ImportWizard activeMandant={mandant} />
}
