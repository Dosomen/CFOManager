'use client'

import { useState, useTransition } from 'react'
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
import { resetPasswordAction } from '@/lib/actions/auth'
import {
  passwordResetConfirmSchema,
  type PasswordResetConfirmInput,
} from '@/lib/validators/auth'
import { de } from '@/lib/messages/de'

export function PasswordResetConfirmForm() {
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const form = useForm<PasswordResetConfirmInput>({
    resolver: zodResolver(passwordResetConfirmSchema),
    defaultValues: { password: '' },
  })

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('password', values.password)
      const result = await resetPasswordAction(null, fd)
      if (result.ok) {
        window.location.href = '/dashboard'
      } else {
        setServerError(result.error)
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
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{de.auth.passwordReset.newPasswordLabel}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  autoFocus
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? de.common.loading : de.auth.passwordReset.confirmSubmit}
        </Button>
      </form>
    </Form>
  )
}
