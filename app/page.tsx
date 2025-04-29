"use client"

import type React from "react"

import { useState } from "react"
import { convertTransactionHistorytograph, type TransactionGraph } from "@/lib/utils/convertTransactionHistorytograph"
import TransactionFlowGraph from "@/components/transaction-flow-graph"
import FilterControls from "@/components/filter-controls"
import { Loader2, AlertTriangle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useIsMobile } from "@/hooks/use-mobile"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { isSolanaAddressOrDomain } from "@/lib/utils"

export default function Home() {
  const [searchItem, setSearchItem] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [graphData, setGraphData] = useState<TransactionGraph | null>(null)
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    new Date(),
  ])
  const [amountRange, setAmountRange] = useState<[number, number]>([0, 100])
  const [showCriticalPath, setShowCriticalPath] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isMobile = useIsMobile()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Input validation
    if (!searchItem.trim()) {
      setError("Please enter a wallet address")
      return
    }

    if (!isSolanaAddressOrDomain(searchItem)) {
      setError("Please enter a valid Solana address or domain")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await convertTransactionHistorytograph(searchItem)
      setGraphData(response)

      // Set amount range based on data
      if (response.metadata?.valueRange) {
        setAmountRange([response.metadata.valueRange.min, response.metadata.valueRange.max])
      }

      // Set date range based on data
      if (response.metadata?.timeRange) {
        setDateRange([new Date(response.metadata.timeRange.start), new Date(response.metadata.timeRange.end)])
      }
    } catch (error) {
      console.error(error)
      setError(error instanceof Error ? error.message : "Failed to fetch transaction data")
      setGraphData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleHighlightCriticalPath = () => {
    setShowCriticalPath(!showCriticalPath)
  }

  return (
    <div className="container mx-auto p-4 flex flex-col min-h-[calc(100vh-3.5rem)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Transaction Flow Visualization
        </h1>
        <p className="text-muted-foreground">
          Trace and visualize transaction flows between Solana wallets, tokens, and programs.
        </p>
      </div>

      <div className="mb-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <Input
            type="search"
            value={searchItem}
            onChange={(e) => setSearchItem(e.target.value)}
            placeholder="Enter wallet address"
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading} className={isMobile ? "w-full" : ""}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Tracing...
              </>
            ) : (
              "Trace Funds"
            )}
          </Button>
        </form>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {graphData ? (
        <div className="flex flex-col flex-1">
          <FilterControls
            dateRange={dateRange}
            setDateRange={setDateRange}
            amountRange={amountRange}
            setAmountRange={setAmountRange}
            showCriticalPath={showCriticalPath}
            onToggleCriticalPath={handleHighlightCriticalPath}
            metadata={graphData.metadata}
          />

          <div
            className="flex-1 border rounded-md overflow-hidden"
            style={{
              height: isMobile ? "calc(100vh - 14rem)" : "calc(100vh - 12rem)",
              minHeight: "500px",
            }}
          >
            <TransactionFlowGraph
              graphData={graphData}
              dateRange={dateRange}
              amountRange={amountRange}
              showCriticalPath={showCriticalPath}
              onSelectTransaction={setSelectedTransaction}
              mainWalletAddress={searchItem}
            />
          </div>

          {selectedTransaction && (
            <Card className="mt-4">
              <CardContent className="pt-4">
                <h3 className="font-medium">Transaction Details</h3>
                <p className="text-sm text-muted-foreground">{selectedTransaction}</p>
                {/* Additional transaction details would be displayed here */}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-muted/20 rounded-lg">
          <div className="text-center p-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg max-w-md mx-auto">
              <Info className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Trace Transaction Flows</h3>
              <p className="text-muted-foreground mb-4">
                Enter a Solana wallet address to visualize its transaction flow. See how funds move between wallets,
                tokens, and programs.
              </p>
              <div className="text-sm text-muted-foreground text-left">
                <p className="mb-2">Try these example addresses:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <code className="text-xs bg-muted p-1 rounded">CGPaEBbfLsCkytE9oA9GhL6zK3GksLin8WjD8zRwGJi5</code>
                  </li>
                  <li>
                    <code className="text-xs bg-muted p-1 rounded">DQyrF9xYv6wJRXmXXE2NJ6YHYvCBG5hSxMJbcVmhPTKc</code>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
