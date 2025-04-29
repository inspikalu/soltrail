"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Treemap, ResponsiveContainer, Tooltip } from "recharts"
import { formatAddress } from "@/lib/utils"

interface SourceDistributionTreemapProps {
  data: Array<{
    address: string
    totalAmount: number
    type: string
    isExchange: boolean
  }>
}

// Custom tooltip for the treemap
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white dark:bg-gray-800 p-2 border rounded shadow-sm">
        <p className="font-medium">{formatAddress(data.address, 8)}</p>
        <p className="text-sm">{(data.value / 1_000_000_000).toFixed(4)} SOL</p>
        <p className="text-xs text-muted-foreground">{data.type}</p>
        {data.isExchange && <p className="text-xs text-blue-500">Exchange</p>}
      </div>
    )
  }
  return null
}

export function SourceDistributionTreemap({ data }: SourceDistributionTreemapProps) {
  // Add this state inside the component:
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  // Format data for the treemap
  const treeData = useMemo(() => {
    // Take top 20 sources
    const topSources = [...data]
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 20)
      .map((source) => ({
        name: formatAddress(source.address, 4),
        address: source.address,
        value: source.totalAmount,
        type: source.type,
        isExchange: source.isExchange,
        // Color based on type and exchange status
        color: source.isExchange
          ? "#3b82f6" // blue for exchanges
          : source.type === "TRANSFER"
            ? "#10b981" // green for transfers
            : "#8b5cf6", // purple for others
      }))

    return [{ name: "sources", children: topSources }]
  }, [data])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Source Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={treeData}
              dataKey="value"
              aspectRatio={4 / 3}
              stroke="#fff"
              fill="#8884d8"
              content={({ root, depth, x, y, width, height, index, payload, colors, rank, name }) => {
                const item = root.children?.[index]
                if (!item) return null

                return (
                  <g>
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      style={{
                        fill: item.color,
                        stroke: "#fff",
                        strokeWidth: 2 / (depth + 1e-10),
                        strokeOpacity: 1 / (depth + 1e-10),
                        cursor: "pointer",
                      }}
                      onClick={() => handleCopyAddress(item.address)}
                    />
                    {width > 30 && height > 30 && (
                      <>
                        <text x={x + width / 2} y={y + height / 2} textAnchor="middle" fill="#fff" fontSize={12}>
                          {item.name}
                        </text>
                        {copiedAddress === item.address ? (
                          <text x={x + width / 2} y={y + height / 2 + 16} textAnchor="middle" fill="#fff" fontSize={10}>
                            Copied!
                          </text>
                        ) : (
                          <text x={x + width / 2} y={y + height / 2 + 16} textAnchor="middle" fill="#fff" fontSize={10}>
                            Click to copy
                          </text>
                        )}
                      </>
                    )}
                  </g>
                )
              }}
            >
              <Tooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
