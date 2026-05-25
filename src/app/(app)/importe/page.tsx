import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImportList } from '@/components/importe/import-list'
import { createClient } from '@/lib/supabase/server'
import { de } from '@/lib/messages/de'

export default async function ImportePage() {
  const supabase = await createClient()
  const { data: importe } = await supabase
    .from('importe')
    .select(
      'id, created_at, periode_jahr, periode_monat, dateiname, status, anzahl_konten, anzahl_salden, summe_soll, summe_haben, created_by'
    )
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{de.importe.title}</h1>
          <p className="text-slate-500 mt-1">{de.importe.description}</p>
        </div>
        <Button asChild>
          <Link href="/importe/neu">
            <Plus className="size-4" />
            {de.importe.list.createNew}
          </Link>
        </Button>
      </div>

      <ImportList importe={importe ?? []} />
    </div>
  )
}
