'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, FileUp, Settings } from 'lucide-react'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { de } from '@/lib/messages/de'

const items = [
  { href: '/dashboard', label: de.nav.dashboard, icon: LayoutDashboard },
  { href: '/mandanten', label: de.nav.mandanten, icon: Building2 },
  { href: '/importe', label: de.nav.importe, icon: FileUp },
  { href: '/einstellungen', label: de.nav.einstellungen, icon: Settings },
]

export function SidebarNav() {
  const pathname = usePathname()
  return (
    <SidebarMenu>
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href))
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
              <Link href={item.href}>
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}
