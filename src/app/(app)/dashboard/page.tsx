import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getActiveMandantId } from '@/lib/mandant/active'

export default async function DashboardPage() {
  const supabase = await createClient()
  const activeMandantId = await getActiveMandantId()
  const { data: activeMandant } = await supabase
    .from('mandanten')
    .select('name')
    .eq('id', activeMandantId!)
    .maybeSingle()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="text-slate-500 mt-1">
          Mandant: <span className="font-medium text-slate-700">{activeMandant?.name}</span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Willkommen im CFOManager</CardTitle>
          <CardDescription>
            Dein Reporting wird hier in Kürze sichtbar.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-2">
          <p>
            Im nächsten Schritt importieren wir deine Buchhaltungsdaten aus
            Diamant Software und visualisieren sie in interaktiven Dashboards
            (GuV, Bilanz, KPIs).
          </p>
          <p className="text-slate-500">
            Status: PROJ-1 abgeschlossen. PROJ-2 (Diamant-Import) und PROJ-3
            (Reporting & Dashboards) sind in der Roadmap.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
