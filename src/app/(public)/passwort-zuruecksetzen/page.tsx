import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PasswordResetConfirmForm } from '@/components/auth/password-reset-confirm-form'
import { createClient } from '@/lib/supabase/server'
import { de } from '@/lib/messages/de'

export default async function PasswordResetConfirmPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    // Recovery session is required; without it the password update would fail.
    redirect('/passwort-vergessen')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{de.auth.passwordReset.confirmTitle}</CardTitle>
        <CardDescription>
          Wähle ein neues Passwort (mindestens 12 Zeichen).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PasswordResetConfirmForm />
      </CardContent>
    </Card>
  )
}
