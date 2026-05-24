'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createMandantAction,
  updateMandantAction,
} from '@/lib/actions/mandanten'
import {
  mandantFormSchema,
  rechtsformValues,
  type MandantFormValues,
} from '@/lib/validators/mandant'
import { de } from '@/lib/messages/de'

type Mode = 'onboarding' | 'create' | 'update'

interface MandantFormProps {
  mode: Mode
  /** Pre-filled values when editing. `id` is required for `update`. */
  initialValues?: Partial<MandantFormValues> & { id?: string }
  submitLabel: string
  /** When set, navigates here after a successful submit (full reload). */
  successRedirect?: string
  /** When set, called after a successful submit (used for dialogs). */
  onSuccess?: () => void
  onCancel?: () => void
}

const defaults: MandantFormValues = {
  name: '',
  rechtsform: 'GmbH',
  basiswaehrung: 'EUR',
  geschaeftsjahr_start: '01-01',
  ust_idnr: '',
  diamant_mandantennummer: '',
}

export function MandantForm({
  mode,
  initialValues,
  submitLabel,
  successRedirect,
  onSuccess,
  onCancel,
}: MandantFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<MandantFormValues>({
    resolver: zodResolver(mandantFormSchema),
    defaultValues: {
      ...defaults,
      ...initialValues,
      ust_idnr: initialValues?.ust_idnr ?? '',
      diamant_mandantennummer: initialValues?.diamant_mandantennummer ?? '',
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('name', values.name)
      fd.set('rechtsform', values.rechtsform)
      fd.set('basiswaehrung', values.basiswaehrung)
      fd.set('geschaeftsjahr_start', values.geschaeftsjahr_start)
      fd.set('ust_idnr', values.ust_idnr)
      fd.set('diamant_mandantennummer', values.diamant_mandantennummer)

      const result =
        mode === 'update' && initialValues?.id
          ? (fd.set('id', initialValues.id), await updateMandantAction(null, fd))
          : await createMandantAction(null, fd)

      if (result.ok) {
        if (successRedirect) {
          window.location.href = successRedirect
        } else {
          router.refresh()
          onSuccess?.()
        }
        return
      }
      setServerError(result.error)
      if (result.fieldErrors) {
        for (const [key, msg] of Object.entries(result.fieldErrors)) {
          form.setError(key as keyof MandantFormValues, { message: msg })
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{de.mandant.fields.name}</FormLabel>
              <FormControl>
                <Input
                  placeholder={de.mandant.fields.namePlaceholder}
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
          name="rechtsform"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{de.mandant.fields.rechtsform}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {rechtsformValues.map((v) => (
                    <SelectItem key={v} value={v}>
                      {de.mandant.rechtsformLabel[v]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="basiswaehrung"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{de.mandant.fields.basiswaehrung}</FormLabel>
                <FormControl>
                  <Input maxLength={3} className="uppercase" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="geschaeftsjahr_start"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{de.mandant.fields.geschaeftsjahrStart}</FormLabel>
                <FormControl>
                  <Input placeholder="01-01" {...field} />
                </FormControl>
                <FormDescription className="text-xs">MM-TT</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="ust_idnr"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{de.mandant.fields.ustIdnr}</FormLabel>
              <FormControl>
                <Input
                  placeholder={de.mandant.fields.ustIdnrPlaceholder}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="diamant_mandantennummer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{de.mandant.fields.diamantMandantennummer}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
              {de.common.cancel}
            </Button>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? de.common.loading : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}
