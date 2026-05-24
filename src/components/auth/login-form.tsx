'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { loginAction } from '@/lib/actions/auth'
import { loginSchema, type LoginInput } from '@/lib/validators/auth'
import { de } from '@/lib/messages/de'
import { MfaPrompt } from './mfa-prompt'

export function LoginForm() {
  const searchParams = useSearchParams()
  const nextUrl = searchParams.get('next') ?? '/dashboard'
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  if (mfaFactorId) {
    return (
      <MfaPrompt
        factorId={mfaFactorId}
        onSuccess={() => {
          window.location.href = nextUrl
        }}
      />
    )
  }

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('email', values.email)
      fd.set('password', values.password)
      const result = await loginAction(null, fd)
      if (result.ok) {
        if (result.needsMfa) {
          setMfaFactorId(result.factorId)
        } else {
          window.location.href = nextUrl
        }
        return
      }
      setServerError(result.error)
      if (result.fieldErrors) {
        for (const [key, msg] of Object.entries(result.fieldErrors)) {
          form.setError(key as keyof LoginInput, { message: msg })
        }
      }
    })
  })

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{de.auth.login.emailLabel}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  autoFocus
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{de.auth.login.passwordLabel}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end text-sm">
          <Link
            href="/passwort-vergessen"
            className="text-primary hover:underline"
          >
            {de.auth.login.forgotPassword}
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? de.common.loading : de.auth.login.submit}
        </Button>
      </form>
    </Form>
  )
}
