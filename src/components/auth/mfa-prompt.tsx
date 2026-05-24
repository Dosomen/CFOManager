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
import { verifyMfaLoginAction } from '@/lib/actions/auth'
import { totpCodeSchema, type TotpCodeInput } from '@/lib/validators/auth'
import { de } from '@/lib/messages/de'

interface MfaPromptProps {
  factorId: string
  onSuccess: () => void
}

export function MfaPrompt({ factorId, onSuccess }: MfaPromptProps) {
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const form = useForm<TotpCodeInput>({
    resolver: zodResolver(totpCodeSchema),
    defaultValues: { code: '' },
  })

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null)
    startTransition(async () => {
      const result = await verifyMfaLoginAction(factorId, values.code)
      if (result.ok) {
        onSuccess()
      } else {
        setServerError(result.error)
        form.setError('code', { message: result.error })
      }
    })
  })

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-medium">{de.auth.mfa.title}</h2>
          <p className="text-sm text-slate-500">{de.auth.mfa.promptCode}</p>
        </div>
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Code</FormLabel>
              <FormControl>
                <Input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  autoFocus
                  className="text-center text-2xl tracking-[0.4em] font-mono"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? de.common.loading : de.auth.mfa.submit}
        </Button>
      </form>
    </Form>
  )
}
