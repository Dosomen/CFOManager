import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { LoginForm } from '@/components/auth/login-form'
import { de } from '@/lib/messages/de'

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{de.auth.login.title}</CardTitle>
        <CardDescription>
          Melde dich mit deiner E-Mail-Adresse und deinem Passwort an.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<LoginFormSkeleton />}>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  )
}

function LoginFormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
    </div>
  )
}
