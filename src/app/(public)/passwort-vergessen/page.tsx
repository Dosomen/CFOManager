import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PasswordResetRequestForm } from '@/components/auth/password-reset-request-form'
import { de } from '@/lib/messages/de'

export default function PasswordResetRequestPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{de.auth.passwordReset.requestTitle}</CardTitle>
        <CardDescription>
          Gib deine E-Mail-Adresse ein. Wir senden dir einen Link, um dein
          Passwort zurückzusetzen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <PasswordResetRequestForm />
        <p className="text-sm text-slate-500">
          <Link href="/login" className="text-primary hover:underline">
            Zurück zum Login
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
