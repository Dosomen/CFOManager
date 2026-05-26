export type LiquidityBucket = 'bank' | 'forderungen' | 'verbindlichkeiten' | 'sonstige'

export interface LiquidityRow {
  jahr: number
  monat: number
  bucket: LiquidityBucket
  /**
   * Net balance — positive for Aktiva buckets (Bank, Forderungen),
   * positive for Passiva buckets (Verbindlichkeiten), both expressed
   * as positive numbers. Subtract Verbindlichkeiten from Bank+Forderungen
   * to get Netto-Liquidität.
   */
  amount: number
}

export interface LiquiditySnapshot {
  jahr: number
  monat: number
  bank: number
  forderungen: number
  verbindlichkeiten: number
  netto: number
}

export interface CashTrendPoint {
  jahr: number
  monat: number
  label: string
  bank: number
  netto: number
  projected?: boolean
}
