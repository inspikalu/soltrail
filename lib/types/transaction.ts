export interface TransactionData {
  address: string
  isMainWallet?: boolean
  sentCount?: number
  receivedCount?: number
  totalVolume?: number
  lastTxDate?: string
}

export interface TransactionEdgeData {
  count: number
  volume: number
  lastTimestamp: number
}

export interface GraphData {
  nodes: Array<{
    id: string
    type: string
    position: { x: number; y: number }
    data: TransactionData
  }>
  edges: Array<{
    id: string
    source: string
    target: string
    type: string
    data: TransactionEdgeData
  }>
}
