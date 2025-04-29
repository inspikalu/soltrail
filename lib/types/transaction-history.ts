export interface EnrichedTransaction {
  signature: string
  timestamp: number
  fee: number
  type: string
  source: string
  destination: string
  amount: number
  symbol: string
  decimals: number
  status: string
}
