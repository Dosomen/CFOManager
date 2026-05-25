import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImportDetail } from '@/components/importe/import-detail'
import { createClient } from '@/lib/supabase/server'
import { de } from '@/lib/messages/de'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ImportDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: importRow } = await supabase
    .from('importe')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!importRow) notFound()

  const { data: salden } = await supabase
    .from('salden')
    .select(
      'eb_soll, eb_haben, vk_soll, vk_haben, saldo_soll, saldo_haben, konten(nummer, bezeichnung, typ)'
    )
    .eq('import_id', id)
    .order('konto_id', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="-ml-2">
          <Link href="/importe">
            <ArrowLeft className="size-4" />
            {de.importe.detail.backToList}
          </Link>
        </Button>
      </div>

      <ImportDetail importRow={importRow} salden={salden ?? []} />
    </div>
  )
}
