import Link from 'next/link'
import { FileUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { de } from '@/lib/messages/de'

export function NoDataState() {
  return (
    <Card>
      <CardContent className="p-12 text-center space-y-4">
        <div className="size-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center">
          <FileUp className="size-6 text-slate-400" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900">
            {de.dashboard.emptyState.title}
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {de.dashboard.emptyState.description}
          </p>
        </div>
        <Button asChild>
          <Link href="/importe/neu">
            <FileUp className="size-4" />
            {de.dashboard.emptyState.cta}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
