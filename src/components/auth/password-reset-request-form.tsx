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
import { requestPasswordResetAction } from '@/lib/actions/auth'
import {
  passwordResetRequestSchema,
  type PasswordResetRequestInput,
} from '@/lib/validators/auth'
import { de } from '@/lib/messages/de'

export function PasswordResetRequestForm() {
  const [pending, startTransition] = useTransition()
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null)
  const form = useForm<PasswordResetRequestInput>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('email', values.email)
      const result = await requestPasswordResetAction(null, fd)
      if (result.ok) {
        setSubmittedMessage(de.auth.passwordReset.requestSuccess)
        form.reset()
      } else {
        form.setError('email', { message: result.error })
      }
    })
  })

  if (submittedMessage) {
    return (
      <Alert>
        <AlertDescription>{submittedMessage}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{de.auth.login.emailLabel}</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? de.common.loading : de.auth.passwordReset.requestSubmit}
        </Button>
      </form>
    </Form>
  )
}
