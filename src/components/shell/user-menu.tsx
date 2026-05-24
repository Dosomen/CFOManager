'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Settings, User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { logoutAction } from '@/lib/actions/auth'
import { de } from '@/lib/messages/de'

interface UserMenuProps {
  email: string
}

export function UserMenu({ email }: UserMenuProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const initial = (email.match(/^[a-zA-Z]/)?.[0] ?? '?').toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" disabled={pending}>
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {initial}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px]">
        <DropdownMenuLabel className="flex items-center gap-2 font-normal">
          <User className="size-4 text-slate-500" />
          <span className="truncate text-sm">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/einstellungen')}>
          <Settings className="size-4" />
          {de.nav.einstellungen}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => startTransition(() => logoutAction())}
          className="text-red-600 focus:text-red-700"
        >
          <LogOut className="size-4" />
          {de.auth.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
