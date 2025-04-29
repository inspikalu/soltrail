"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface ClusterVisualizationProps {
  clusters: Array<{
    addresses: string[]
    transactions: number
    totalValue: number
    types: string[]
  }>
}

export function ClusterVisualization({ clusters }: ClusterVisualizationProps) {
  // Prepare data for visualization
  const chartData = clusters
    .map((cluster, index) => ({
      name: `Cluster ${index + 1}`,
      value: cluster.transactions,
      totalValue: cluster.totalValue / 1_000_000_000, // Convert to SOL
      types: cluster.types.join(", "),
      addresses: cluster.addresses.length,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10) // Take top 10 clusters

  // Generate colors for the pie chart
  const COLORS = [
    "#3b82f6", // blue
    "#10b981", // green
    "#8b5cf6", // purple
    "#f59e0b", // amber
    "#ef4444", // red
    "#06b6d4", // cyan
    "#ec4899", // pink
    "#84cc16", // lime
    "#6366f1", // indigo
    "#14b8a6", // teal
  ]

  // Custom tooltip for the pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border rounded shadow-sm">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">{data.value} Transactions</p>
          <p className="text-sm">{data.totalValue.toFixed(4)} SOL</p>
          <p className="text-xs text-muted-foreground">{data.types}</p>
          <p className="text-xs text-muted-foreground">{data.addresses} Addresses</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Transaction Clusters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
