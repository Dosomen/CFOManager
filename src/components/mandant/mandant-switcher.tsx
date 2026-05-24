'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Check, ChevronsUpDown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { switchActiveMandantAction } from '@/lib/actions/mandanten'
import { de } from '@/lib/messages/de'

interface MandantOption {
  id: string
  name: string
}

interface MandantSwitcherProps {
  activeMandant: MandantOption
  mandanten: MandantOption[]
}

export function MandantSwitcher({ activeMandant, mandanten }: MandantSwitcherProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function switchTo(mandantId: string) {
    if (mandantId === activeMandant.id) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set('mandantId', mandantId)
      const result = await switchActiveMandantAction(null, fd)
      if (result.ok) {
        // Full reload so server components re-read the active mandant.
        window.location.reload()
      } else {
        router.refresh()
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="gap-2 px-2 h-9 -ml-2 text-slate-700"
          disabled={pending}
        >
          <Building2 className="size-4 text-slate-500" />
          <span className="font-medium">{activeMandant.name}</span>
          <ChevronsUpDown className="size-3.5 text-slate-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[240px]">
        {mandanten.map((m) => (
          <DropdownMenuItem
            key={m.id}
            onClick={() => switchTo(m.id)}
            className="flex items-center justify-between"
          >
            <span>{m.name}</span>
            {m.id === activeMandant.id && (
              <Check className="size-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/mandanten')}>
          <Plus className="size-4" />
          {de.mandant.switcher.addNew}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
