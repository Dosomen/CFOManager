'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { InviteDialog } from './invite-dialog'
import { removeTeamMemberAction } from '@/lib/actions/team'
import { de } from '@/lib/messages/de'
import type { TeamMember } from '@/lib/team/queries'

interface TeamListProps {
  members: TeamMember[]
  isOwner: boolean
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function TeamList({ members, isOwner }: TeamListProps) {
  const router = useRouter()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<TeamMember | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function remove() {
    if (!confirmRemove) return
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('user_id', confirmRemove.user_id)
      const result = await removeTeamMemberAction(null, fd)
      if (result.ok) {
        toast.success(
          confirmRemove.is_self
            ? de.team.toasts.leftSelf
            : de.team.toasts.memberRemoved
        )
        setConfirmRemove(null)
        if (confirmRemove.is_self) {
          window.location.href = '/dashboard'
        } else {
          router.refresh()
        }
      } else {
        setError(result.error)
      }
    })
  }

  const ownerCount = members.filter((m) => m.rolle === 'owner').length

  return (
    <>
      <div className="flex justify-end">
        {isOwner && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="size-4" />
            {de.team.invite.button}
          </Button>
        )}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{de.team.list.columnEmail}</TableHead>
              <TableHead>{de.team.list.columnRole}</TableHead>
              <TableHead>{de.team.list.columnJoined}</TableHead>
              <TableHead className="text-right">{de.team.list.columnActions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => {
              const isLastOwner = m.rolle === 'owner' && ownerCount <= 1
              const canRemove = (isOwner || m.is_self) && !isLastOwner
              return (
                <TableRow key={m.user_id}>
                  <TableCell className="font-medium">
                    {m.email ?? '—'}
                    {m.is_self && (
                      <span className="text-slate-400 text-xs ml-2">
                        ({de.team.list.youSuffix})
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {m.rolle === 'owner' ? (
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                        {de.team.roles.owner}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">{de.team.roles.member}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {formatDate(m.joined_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={!canRemove}
                      onClick={() => setConfirmRemove(m)}
                      title={
                        isLastOwner
                          ? de.team.errors.lastOwner
                          : !canRemove
                            ? de.team.errors.notOwner
                            : de.common.delete
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvited={() => router.refresh()}
      />

      <AlertDialog
        open={!!confirmRemove}
        onOpenChange={(o) => !o && setConfirmRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmRemove?.is_self
                ? de.team.removeDialog.titleSelf
                : de.team.removeDialog.titleOther}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmRemove?.is_self
                ? de.team.removeDialog.bodySelf
                : de.team.removeDialog.bodyOther.replace(
                    '{email}',
                    confirmRemove?.email ?? '—'
                  )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{de.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={remove} disabled={pending}>
              {pending ? de.common.loading : de.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
