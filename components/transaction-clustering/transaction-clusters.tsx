"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatAddress } from "@/lib/utils"
import { Search, ChevronDown, ChevronUp, Copy } from "lucide-react"

interface TransactionClustersProps {
  clusters: Array<{
    addresses: string[]
    transactions: number
    totalValue: number
    types: string[]
  }>
}

export function TransactionClusters({ clusters }: TransactionClustersProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<"transactions" | "totalValue" | "addresses">("transactions")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [expandedCluster, setExpandedCluster] = useState<number | null>(null)

  // Filter and sort clusters
  const filteredAndSortedClusters = clusters
    .filter((cluster) => {
      if (!searchTerm) return true
      const term = searchTerm.toLowerCase()
      return (
        cluster.types.some((type) => type.toLowerCase().includes(term)) ||
        cluster.addresses.some((address) => address.toLowerCase().includes(term))
      )
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case "transactions":
          comparison = a.transactions - b.transactions
          break
        case "totalValue":
          comparison = a.totalValue - b.totalValue
          break
        case "addresses":
          comparison = a.addresses.length - b.addresses.length
          break
      }
      return sortDirection === "asc" ? comparison : -comparison
    })

  // Handle sort
  const handleSort = (field: "transactions" | "totalValue" | "addresses") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  // Handle copy address
  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    // You could add a toast notification here
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Transaction Clusters</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clusters..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cluster</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("transactions")}
                    className="flex items-center gap-1 p-0 h-auto font-medium"
                  >
                    Transactions
                    {sortField === "transactions" ? (
                      sortDirection === "asc" ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )
                    ) : null}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("totalValue")}
                    className="flex items-center gap-1 p-0 h-auto font-medium"
                  >
                    Total Value (SOL)
                    {sortField === "totalValue" ? (
                      sortDirection === "asc" ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )
                    ) : null}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("addresses")}
                    className="flex items-center gap-1 p-0 h-auto font-medium"
                  >
                    Addresses
                    {sortField === "addresses" ? (
                      sortDirection === "asc" ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )
                    ) : null}
                  </Button>
                </TableHead>
                <TableHead>Types</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedClusters.map((cluster, index) => (
                <>
                  <TableRow
                    key={index}
                    className="cursor-pointer"
                    onClick={() => setExpandedCluster(expandedCluster === index ? null : index)}
                  >
                    <TableCell className="font-medium">Cluster {index + 1}</TableCell>
                    <TableCell>{cluster.transactions}</TableCell>
                    <TableCell>{(cluster.totalValue / 1_000_000_000).toFixed(4)}</TableCell>
                    <TableCell>{cluster.addresses.length}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {cluster.types.slice(0, 3).map((type, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                          >
                            {type}
                          </span>
                        ))}
                        {cluster.types.length > 3 && (
                          <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                            +{cluster.types.length - 3}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedCluster === index && (
                    <TableRow>
                      <TableCell colSpan={5} className="bg-muted/50">
                        <div className="p-2">
                          <h4 className="font-medium mb-2">Addresses in Cluster {index + 1}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {cluster.addresses.map((address, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between p-2 bg-background rounded border"
                              >
                                <span className="font-mono text-xs truncate">{formatAddress(address, 8)}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleCopyAddress(address)
                                  }}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
              {filteredAndSortedClusters.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No clusters found matching your search
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
