"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { formatAddress } from "@/lib/utils"

interface WalletNetworkProps {
  wallets: Array<{
    wallet: string
    connections: Array<{
      address: string
      count: number
      lastInteraction: Date
      types: string[]
    }>
    totalVolume: number
  }>
}

export function WalletNetwork({ wallets }: WalletNetworkProps) {
  // Find top wallets by connection count
  const topWallets = wallets
    .map((wallet) => ({
      address: wallet.wallet,
      connections: wallet.connections.length,
      volume: wallet.totalVolume / 1_000_000_000, // Convert to SOL
      uniqueTypes: new Set(wallet.connections.flatMap((conn) => conn.types)).size,
    }))
    .sort((a, b) => b.connections - a.connections)
    .slice(0, 10) // Take top 10 wallets
    .map((wallet) => ({
      ...wallet,
      address: formatAddress(wallet.address, 6),
    }))

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Wallet Connections</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            connections: {
              label: "Connections",
              color: "hsl(var(--chart-1))",
            },
            uniqueTypes: {
              label: "Unique Transaction Types",
              color: "hsl(var(--chart-2))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topWallets}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="address" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 10 }} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="connections" fill="var(--color-connections)" name="Connections" />
              <Bar dataKey="uniqueTypes" fill="var(--color-uniqueTypes)" name="Unique Transaction Types" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
