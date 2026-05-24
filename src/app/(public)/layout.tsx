import Link from 'next/link'
import { de } from '@/lib/messages/de'

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-slate-50">
      <Link
        href="/login"
        className="mb-8 text-2xl font-semibold tracking-tight text-slate-900"
      >
        {de.appName}
      </Link>
      <main className="w-full max-w-md">{children}</main>
    </div>
  )
}
