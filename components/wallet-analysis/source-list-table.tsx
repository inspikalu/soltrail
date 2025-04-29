"use client"

import React from "react"
import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatAddress, lamportsToSol } from "@/lib/utils"
import { format } from "date-fns"
import { ArrowUpDown, Search, ExternalLink, Copy } from "lucide-react"
import { useVirtualizer } from "@tanstack/react-virtual"

interface SourceListTableProps {
  data: Array<{
    address: string
    totalAmount: number
    firstContact: Date
    lastContact: Date
    type: string
    isExchange: boolean
  }>
}

type SortField = "amount" | "firstContact" | "lastContact"
type SortDirection = "asc" | "desc"

export function SourceListTable({ data }: SourceListTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<SortField>("amount")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  // Handle search input change with debounce
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [])

  // Handle sort
  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc")
      } else {
        setSortField(field)
        setSortDirection("desc")
      }
    },
    [sortField, sortDirection],
  )

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    // Filter by search term
    let result = data
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = data.filter(
        (item) => item.address.toLowerCase().includes(term) || item.type.toLowerCase().includes(term),
      )
    }

    // Sort by selected field
    return [...result].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case "amount":
          comparison = a.totalAmount - b.totalAmount
          break
        case "firstContact":
          comparison = new Date(a.firstContact).getTime() - new Date(b.firstContact).getTime()
          break
        case "lastContact":
          comparison = new Date(a.lastContact).getTime() - new Date(b.lastContact).getTime()
          break
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [data, searchTerm, sortField, sortDirection])

  // Open explorer link
  const openExplorerLink = useCallback((address: string) => {
    window.open(`https://solscan.io/account/${address}`, "_blank")
  }, [])

  // Set up virtualization
  const parentRef = React.useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: filteredAndSortedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // estimated row height
    overscan: 10,
  })

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Funding Sources</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search address or type..."
              className="pl-8"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={parentRef} className="border rounded-md overflow-auto" style={{ height: "400px" }}>
          <div className="relative w-full">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b sticky top-0 bg-white dark:bg-gray-950 z-10">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Address</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("amount")}
                      className="flex items-center gap-1 p-0 h-auto font-medium"
                    >
                      Amount
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden sm:table-cell">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("firstContact")}
                      className="flex items-center gap-1 p-0 h-auto font-medium"
                    >
                      First Seen
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("lastContact")}
                      className="flex items-center gap-1 p-0 h-auto font-medium"
                    >
                      Last Seen
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
            </table>

            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              <table className="w-full caption-bottom text-sm">
                <tbody>
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const item = filteredAndSortedData[virtualRow.index]
                    return (
                      <tr
                        key={virtualRow.index}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className={`border-b transition-colors hover:bg-muted/50 ${
                          item.isExchange ? "bg-blue-50 dark:bg-blue-900/20" : ""
                        }`}
                      >
                        <td className="p-4 align-middle font-mono whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span className="truncate max-w-[100px] sm:max-w-[150px]">
                              {formatAddress(item.address, 8)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                navigator.clipboard.writeText(item.address)
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="p-4 align-middle whitespace-nowrap">{lamportsToSol(item.totalAmount)} SOL</td>
                        <td className="p-4 align-middle whitespace-nowrap hidden sm:table-cell">
                          {format(new Date(item.firstContact), "MMM d, yyyy")}
                        </td>
                        <td className="p-4 align-middle whitespace-nowrap hidden md:table-cell">
                          {format(new Date(item.lastContact), "MMM d, yyyy")}
                        </td>
                        <td className="p-4 align-middle">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              item.isExchange
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                            }`}
                          >
                            {item.isExchange ? "Exchange" : item.type}
                          </span>
                        </td>
                        <td className="p-4 align-middle text-right">
                          <Button variant="ghost" size="sm" onClick={() => openExplorerLink(item.address)}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
