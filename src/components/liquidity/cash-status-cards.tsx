import { Banknote, Receipt, TrendingDown, Wallet } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { de } from '@/lib/messages/de'
import type { LiquiditySnapshot } from '@/lib/liquidity/types'

function formatEur(n: number): string {
  return n.toLocaleString('de-DE', { maximumFractionDigits: 0 }) + ' €'
}

function Tile({
  icon: Icon,
  label,
  value,
  emphasis,
}: {
  icon: typeof Wallet
  label: string
  value: string
  emphasis?: 'positive' | 'negative'
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <Icon className="size-4 text-slate-400" />
      </div>
      <p
        className={
          'text-3xl font-semibold tabular-nums mt-2 ' +
          (emphasis === 'positive'
            ? 'text-emerald-700'
            : emphasis === 'negative'
              ? 'text-red-700'
              : 'text-slate-900')
        }
      >
        {value}
      </p>
    </Card>
  )
}

export function CashStatusCards({ snapshot }: { snapshot: LiquiditySnapshot }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Tile icon={Banknote} label={de.liquidity.cards.bank} value={formatEur(snapshot.bank)} />
      <Tile icon={Receipt} label={de.liquidity.cards.forderungen} value={formatEur(snapshot.forderungen)} />
      <Tile
        icon={TrendingDown}
        label={de.liquidity.cards.verbindlichkeiten}
        value={formatEur(snapshot.verbindlichkeiten)}
      />
      <Tile
        icon={Wallet}
        label={de.liquidity.cards.netto}
        value={formatEur(snapshot.netto)}
        emphasis={snapshot.netto >= 0 ? 'positive' : 'negative'}
      />
    </div>
  )
}
