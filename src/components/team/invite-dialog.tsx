'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { inviteTeamMemberAction } from '@/lib/actions/team'
import {
  inviteMemberSchema,
  type InviteMemberInput,
} from '@/lib/validators/team'
import { de } from '@/lib/messages/de'

interface InviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvited: () => void
}

export function InviteDialog({ open, onOpenChange, onInvited }: InviteDialogProps) {
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { email: '' },
  })

  function handleClose(o: boolean) {
    if (!o) {
      form.reset()
      setServerError(null)
    }
    onOpenChange(o)
  }

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('email', values.email)
      const result = await inviteTeamMemberAction(null, fd)
      if (result.ok && result.data) {
        toast.success(
          de.team.toasts.invited.replace('{email}', result.data.email)
        )
        form.reset()
        onInvited()
        onOpenChange(false)
      } else if (!result.ok) {
        setServerError(result.error)
      }
    })
  })

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{de.team.invite.dialogTitle}</DialogTitle>
          <DialogDescription>{de.team.invite.dialogDescription}</DialogDescription>
        </DialogHeader>
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
                  <FormLabel>{de.team.invite.emailLabel}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      autoFocus
                      placeholder="controller@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleClose(false)}
                disabled={pending}
              >
                {de.common.cancel}
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? de.common.loading : de.team.invite.submit}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
