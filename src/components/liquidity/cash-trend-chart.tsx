'use client'

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { de } from '@/lib/messages/de'
import type { CashTrendPoint } from '@/lib/liquidity/types'

function formatEurAxis(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' M€'
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(0) + ' k€'
  return String(Math.round(n))
}

function formatEurTooltip(n: number): string {
  return n.toLocaleString('de-DE', { maximumFractionDigits: 0 }) + ' €'
}

export function CashTrendChart({ data }: { data: CashTrendPoint[] }) {
  const firstProjectedIndex = data.findIndex((p) => p.projected)
  const hasProjection = firstProjectedIndex !== -1
  const projectionStart = hasProjection ? data[firstProjectedIndex].label : null
  const projectionEnd = hasProjection ? data[data.length - 1].label : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{de.liquidity.trend.title}</CardTitle>
        {hasProjection && (
          <p className="text-xs text-slate-500">{de.liquidity.trend.forecastNote}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          {data.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              {de.liquidity.trend.noData}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  tickFormatter={formatEurAxis}
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  width={60}
                />
                <Tooltip
                  formatter={(v) => formatEurTooltip(Number(v))}
                  labelStyle={{ color: '#0F172A', fontWeight: 500 }}
                  contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13 }}
                />
                <Legend wrapperStyle={{ fontSize: 13 }} iconType="circle" iconSize={8} />
                {hasProjection && projectionStart && projectionEnd && (
                  <ReferenceArea
                    x1={projectionStart}
                    x2={projectionEnd}
                    fill="#F1F5F9"
                    fillOpacity={0.6}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="bank"
                  name={de.liquidity.trend.bank}
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="netto"
                  name={de.liquidity.trend.netto}
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
