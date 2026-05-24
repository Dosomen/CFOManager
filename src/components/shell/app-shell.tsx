import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { MandantSwitcher } from '@/components/mandant/mandant-switcher'
import { SidebarNav } from './sidebar-nav'
import { UserMenu } from './user-menu'
import { de } from '@/lib/messages/de'

interface AppShellProps {
  activeMandant: { id: string; name: string }
  mandanten: Array<{ id: string; name: string }>
  userEmail: string
  children: React.ReactNode
}

export function AppShell({
  activeMandant,
  mandanten,
  userEmail,
  children,
}: AppShellProps) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="px-4 py-3">
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            {de.appName}
          </span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarNav />
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="bg-slate-50">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-5" />
          <MandantSwitcher activeMandant={activeMandant} mandanten={mandanten} />
          <div className="ml-auto">
            <UserMenu email={userEmail} />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
