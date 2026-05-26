import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveMandantId } from '@/lib/mandant/active'
import {
  getAvailableBudgetYears,
  getKontenWithBudget,
  getLatestMonthInYear,
} from '@/lib/budget/queries'
import { buildBudgetRows, buildBudgetSummary } from '@/lib/budget/calculations'
import { BudgetEditor } from '@/components/budget/budget-editor'
import {
  BudgetSummaryCards,
  BudgetVergleichTable,
} from '@/components/budget/budget-vergleich'
import { NoDataState } from '@/components/dashboard/no-data-state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { de } from '@/lib/messages/de'

interface Props {
  searchParams: Promise<{ jahr?: string; tab?: string }>
}

export default async function PlanungPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()
  const mandantId = (await getActiveMandantId())!

  const { data: mandant } = await supabase
    .from('mandanten')
    .select('name')
    .eq('id', mandantId)
    .maybeSingle()

  const years = await getAvailableBudgetYears(mandantId)
  if (years.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{de.budget.title}</h1>
          <p className="text-slate-500 mt-1">{mandant?.name}</p>
        </div>
        <NoDataState />
      </div>
    )
  }

  const jahr = params.jahr ? Number(params.jahr) : years[0]
  const validYear = years.includes(jahr)
  const finalJahr = validYear ? jahr : years[0]

  if (params.jahr && !validYear) {
    redirect(`/planung?jahr=${finalJahr}`)
  }

  const konten = await getKontenWithBudget(mandantId, finalJahr)
  const monthsElapsed = await getLatestMonthInYear(mandantId, finalJahr)
  const rows = buildBudgetRows(konten, monthsElapsed)
  const summary = buildBudgetSummary(rows)
  const defaultTab = params.tab === 'editor' ? 'editor' : 'vergleich'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{de.budget.title}</h1>
        <p className="text-slate-500 mt-1">
          <span className="font-medium text-slate-700">{mandant?.name}</span> —{' '}
          {de.budget.subtitle} {finalJahr}
          {monthsElapsed > 0 && (
            <span className="ml-2 text-slate-400">
              ({de.budget.monthsElapsed.replace('{n}', String(monthsElapsed))})
            </span>
          )}
        </p>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="vergleich">{de.budget.tabs.vergleich}</TabsTrigger>
          <TabsTrigger value="editor">{de.budget.tabs.editor}</TabsTrigger>
        </TabsList>

        <TabsContent value="vergleich" className="space-y-6 mt-6">
          {monthsElapsed === 0 ? (
            <p className="text-sm text-slate-500">{de.budget.compare.noIstYet}</p>
          ) : (
            <>
              <BudgetSummaryCards summary={summary} />
              <BudgetVergleichTable rows={rows} />
            </>
          )}
        </TabsContent>

        <TabsContent value="editor" className="space-y-4 mt-6">
          <p className="text-sm text-slate-600">{de.budget.editor.intro}</p>
          <BudgetEditor jahr={finalJahr} konten={konten} monthsElapsed={monthsElapsed} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
