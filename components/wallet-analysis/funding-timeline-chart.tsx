"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Bar, ComposedChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { format } from "date-fns"

interface FundingTimelineProps {
  data: Array<{
    date: Date
    cumulativeAmount: number
    count: number
  }>
}

export function FundingTimelineChart({ data }: FundingTimelineProps) {
  // Format data for the chart
  const chartData = useMemo(() => {
    return data.map((item) => ({
      date: format(new Date(item.date), "MMM dd"),
      rawDate: new Date(item.date),
      amount: item.cumulativeAmount / 1_000_000_000, // Convert lamports to SOL
      count: item.count,
    }))
  }, [data])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Funding Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            amount: {
              label: "Amount (SOL)",
              color: "hsl(var(--chart-1))",
            },
            count: {
              label: "Transaction Count",
              color: "hsl(var(--chart-2))",
            },
          }}
          className="h-[300px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => value}
                tick={{ fontSize: 10 }}
                height={40}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                tickFormatter={(value) => `${value.toFixed(2)}`}
                tick={{ fontSize: 10 }}
                width={50}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => `${value}`}
                tick={{ fontSize: 10 }}
                width={30}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="amount"
                stroke="var(--color-amount)"
                name="Amount (SOL)"
                dot={false}
              />
              <Bar
                yAxisId="right"
                dataKey="count"
                fill="var(--color-count)"
                name="Transaction Count"
                barSize={20}
                opacity={0.7}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
