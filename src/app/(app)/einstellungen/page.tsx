import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ChangePasswordForm } from '@/components/auth/change-password-form'
import { MfaSetup } from '@/components/auth/mfa-setup'
import { createClient } from '@/lib/supabase/server'
import { de } from '@/lib/messages/de'

export default async function EinstellungenPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: factors } = await supabase.auth.mfa.listFactors()
  const verifiedFactor = factors?.totp.find((f) => f.status === 'verified')

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {de.nav.einstellungen}
        </h1>
        <p className="text-slate-500 mt-1">
          Eingeloggt als <span className="font-medium text-slate-700">{user?.email}</span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{de.auth.changePassword.title}</CardTitle>
          <CardDescription>
            Wähle ein sicheres Passwort mit mindestens 12 Zeichen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{de.auth.twoFactor.title}</CardTitle>
          <CardDescription>{de.auth.twoFactor.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />
          <MfaSetup
            initialFactorId={verifiedFactor?.id ?? null}
            initialStatus={verifiedFactor ? 'enabled' : 'disabled'}
          />
        </CardContent>
      </Card>
    </div>
  )
}
