'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MandantForm } from './mandant-form'
import { deleteMandantAction } from '@/lib/actions/mandanten'
import { de } from '@/lib/messages/de'
import type { Database } from '@/lib/types/database'

type Mandant = Pick<
  Database['public']['Tables']['mandanten']['Row'],
  | 'id'
  | 'name'
  | 'rechtsform'
  | 'basiswaehrung'
  | 'geschaeftsjahr_start'
  | 'ust_idnr'
  | 'diamant_mandantennummer'
>

interface MandantListProps {
  mandanten: Mandant[]
}

export function MandantList({ mandanten }: MandantListProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Mandant | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Mandant | null>(null)

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          {de.mandant.list.createNew}
        </Button>
      </div>

      <Card>
        {mandanten.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            {de.mandant.list.empty}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{de.mandant.list.columnName}</TableHead>
                <TableHead>{de.mandant.list.columnRechtsform}</TableHead>
                <TableHead>{de.mandant.list.columnBasiswaehrung}</TableHead>
                <TableHead>{de.mandant.list.columnGeschaeftsjahr}</TableHead>
                <TableHead className="text-right">
                  {de.mandant.list.columnActions}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mandanten.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>{de.mandant.rechtsformLabel[m.rechtsform]}</TableCell>
                  <TableCell>{m.basiswaehrung}</TableCell>
                  <TableCell>{m.geschaeftsjahr_start}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditTarget(m)}
                        aria-label={de.common.edit}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(m)}
                        disabled={mandanten.length <= 1}
                        aria-label={de.common.delete}
                        title={
                          mandanten.length <= 1
                            ? de.mandant.delete.lastMandant
                            : de.common.delete
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Create */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{de.mandant.list.createNew}</DialogTitle>
            <DialogDescription>
              Lege eine neue Gesellschaft an. Du wirst automatisch zur neuen
              Mandant gewechselt.
            </DialogDescription>
          </DialogHeader>
          <MandantForm
            mode="create"
            submitLabel={de.common.create}
            onSuccess={() => {
              setCreateOpen(false)
              toast.success('Mandant angelegt.')
            }}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{de.mandant.edit.title}</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <MandantForm
              mode="update"
              initialValues={{
                id: editTarget.id,
                name: editTarget.name,
                rechtsform: editTarget.rechtsform,
                basiswaehrung: editTarget.basiswaehrung,
                geschaeftsjahr_start: editTarget.geschaeftsjahr_start,
                ust_idnr: editTarget.ust_idnr ?? '',
                diamant_mandantennummer: editTarget.diamant_mandantennummer ?? '',
              }}
              submitLabel={de.common.save}
              onSuccess={() => {
                setEditTarget(null)
                toast.success('Mandant aktualisiert.')
              }}
              onCancel={() => setEditTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <DeleteMandantDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  )
}

function DeleteMandantDialog({
  target,
  onClose,
}: {
  target: Mandant | null
  onClose: () => void
}) {
  const router = useRouter()
  const [confirmName, setConfirmName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleClose() {
    setConfirmName('')
    setError(null)
    onClose()
  }

  function submit() {
    if (!target) return
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('id', target.id)
      fd.set('confirmName', confirmName)
      const result = await deleteMandantAction(null, fd)
      if (result.ok) {
        toast.success('Mandant gelöscht.')
        handleClose()
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{de.mandant.delete.title}</DialogTitle>
          <DialogDescription>{de.mandant.delete.warning}</DialogDescription>
        </DialogHeader>
        {target && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {de.mandant.delete.confirmInstruction}
              <br />
              <span className="font-mono font-medium text-slate-900">
                {target.name}
              </span>
            </p>
            <div>
              <Label htmlFor="confirm-name" className="sr-only">
                Bestätigung
              </Label>
              <Input
                id="confirm-name"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={target.name}
                autoFocus
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={handleClose} disabled={pending}>
                {de.common.cancel}
              </Button>
              <Button
                variant="destructive"
                onClick={submit}
                disabled={pending || confirmName !== target.name}
              >
                {pending ? de.common.loading : de.common.delete}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
