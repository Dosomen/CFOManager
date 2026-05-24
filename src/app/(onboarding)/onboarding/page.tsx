import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MandantForm } from '@/components/mandant/mandant-form'
import { createClient } from '@/lib/supabase/server'
import { getActiveMandantId } from '@/lib/mandant/active'
import { de } from '@/lib/messages/de'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // If the user already has any mandant, skip the wizard.
  const activeMandantId = await getActiveMandantId()
  if (activeMandantId) redirect('/dashboard')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-slate-50">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight text-slate-900">
        {de.appName}
      </h1>
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>{de.mandant.wizard.title}</CardTitle>
          <CardDescription>{de.mandant.wizard.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <MandantForm
            mode="onboarding"
            submitLabel={de.mandant.wizard.submit}
            successRedirect="/dashboard"
          />
        </CardContent>
      </Card>
    </div>
  )
}
