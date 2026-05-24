'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  enrollTotpAction,
  unenrollTotpAction,
  verifyTotpEnrollmentAction,
} from '@/lib/actions/auth'
import { de } from '@/lib/messages/de'

interface MfaSetupProps {
  initialFactorId: string | null
  initialStatus: 'enabled' | 'disabled'
}

interface EnrollmentState {
  factorId: string
  qrCodeSvg: string
  secret: string
}

export function MfaSetup({ initialFactorId, initialStatus }: MfaSetupProps) {
  const [status, setStatus] = useState<'enabled' | 'disabled'>(initialStatus)
  const [activeFactorId, setActiveFactorId] = useState<string | null>(initialFactorId)
  const [enrollment, setEnrollment] = useState<EnrollmentState | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirmingDisable, setConfirmingDisable] = useState(false)
  const [pending, startTransition] = useTransition()

  function startEnrollment() {
    setError(null)
    startTransition(async () => {
      const result = await enrollTotpAction()
      if (result.ok && result.data) {
        setEnrollment(result.data)
      } else {
        setError(result.ok ? null : result.error)
      }
    })
  }

  function confirmEnrollment() {
    if (!enrollment) return
    setError(null)
    startTransition(async () => {
      const result = await verifyTotpEnrollmentAction(enrollment.factorId, code)
      if (result.ok) {
        setStatus('enabled')
        setActiveFactorId(enrollment.factorId)
        setEnrollment(null)
        setCode('')
        toast.success('Zwei-Faktor-Authentifizierung aktiviert.')
      } else {
        setError(result.error)
      }
    })
  }

  function disable() {
    if (!activeFactorId) return
    startTransition(async () => {
      const result = await unenrollTotpAction(activeFactorId)
      if (result.ok) {
        setStatus('disabled')
        setActiveFactorId(null)
        setConfirmingDisable(false)
        toast.success('Zwei-Faktor-Authentifizierung deaktiviert.')
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600">Status:</span>
        {status === 'enabled' ? (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            {de.auth.twoFactor.enabled}
          </Badge>
        ) : (
          <Badge variant="secondary">{de.auth.twoFactor.disabled}</Badge>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {status === 'enabled' && !enrollment && (
        <Button
          variant="outline"
          onClick={() => setConfirmingDisable(true)}
          disabled={pending}
        >
          {de.auth.twoFactor.disable}
        </Button>
      )}

      {status === 'disabled' && !enrollment && (
        <Button onClick={startEnrollment} disabled={pending}>
          {pending ? de.common.loading : de.auth.twoFactor.enable}
        </Button>
      )}

      {enrollment && (
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">{de.auth.twoFactor.scanQrCode}</p>
          <div
            className="mx-auto w-48 h-48 [&_svg]:w-full [&_svg]:h-full"
            dangerouslySetInnerHTML={{ __html: enrollment.qrCodeSvg }}
          />
          <p className="text-xs text-slate-500 text-center break-all">
            Manueller Code: <code className="font-mono">{enrollment.secret}</code>
          </p>
          <div className="space-y-2">
            <Label htmlFor="totp-code">{de.auth.twoFactor.enterCode}</Label>
            <Input
              id="totp-code"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="text-center text-2xl tracking-[0.4em] font-mono"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setEnrollment(null)
                setCode('')
                setError(null)
              }}
              disabled={pending}
            >
              {de.common.cancel}
            </Button>
            <Button onClick={confirmEnrollment} disabled={pending || code.length !== 6}>
              {pending ? de.common.loading : de.auth.twoFactor.verify}
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={confirmingDisable} onOpenChange={setConfirmingDisable}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>2FA deaktivieren?</AlertDialogTitle>
            <AlertDialogDescription>
              Ohne 2FA ist dein Account nur durch dein Passwort geschützt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{de.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={disable} disabled={pending}>
              {de.auth.twoFactor.disable}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
