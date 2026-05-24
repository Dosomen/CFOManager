import { MandantList } from '@/components/mandant/mandant-list'
import { createClient } from '@/lib/supabase/server'
import { de } from '@/lib/messages/de'

export default async function MandantenPage() {
  const supabase = await createClient()
  const { data: mandanten } = await supabase
    .from('mandanten')
    .select(
      'id, name, rechtsform, basiswaehrung, geschaeftsjahr_start, ust_idnr, diamant_mandantennummer'
    )
    .order('name', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{de.mandant.list.title}</h1>
        <p className="text-slate-500 mt-1">
          Verwalte alle Gesellschaften, auf die du Zugriff hast.
        </p>
      </div>
      <MandantList mandanten={mandanten ?? []} />
    </div>
  )
}
