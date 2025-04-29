"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, AlertTriangle, Info } from "lucide-react"
import { useFundingAnalysis } from "@/hooks/use-funding-analysis"
import { FundingTimelineChart } from "@/components/wallet-analysis/funding-timeline-chart"
import { SourceDistributionTreemap } from "@/components/wallet-analysis/source-distribution-treemap"
import { KeyMetricsCards } from "@/components/wallet-analysis/key-metrics-cards"
import { SourceListTable } from "@/components/wallet-analysis/source-list-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { isSolanaAddressOrDomain } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function WalletAnalysisPage() {
  const [address, setAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])

  const { result, loading: analysisLoading, error: analysisError, analyze } = useFundingAnalysis()

  // Calculate metrics for the KeyMetricsCards component
  const metrics = useMemo(() => {
    if (!result) return null

    const totalReceived = result.sources.reduce((sum, source) => sum + source.totalAmount, 0)

    // Find first and last contact dates
    let firstContact = new Date()
    let lastContact = new Date(0)

    result.sources.forEach((source) => {
      if (new Date(source.firstContact) < firstContact) {
        firstContact = new Date(source.firstContact)
      }
      if (new Date(source.lastContact) > lastContact) {
        lastContact = new Date(source.lastContact)
      }
    })

    return {
      totalReceived,
      primarySource: result.primarySource,
      exchangePercentage: result.exchangePercentage,
      firstContact,
      lastContact,
    }
  }, [result])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Input validation
    if (!address.trim()) {
      setError("Please enter a wallet address")
      return
    }

    if (!isSolanaAddressOrDomain(address)) {
      setError("Please enter a valid Solana address or domain")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch transaction data
      const response = await fetch(`/api/transactions?address=${encodeURIComponent(address)}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`)
      }

      const data = await response.json()
      setTransactions(data.transactions || [])

      // Analyze the data
      if (data.transactions && data.transactions.length > 0) {
        analyze(data.transactions, address)
      } else {
        setError("No transactions found for this address")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 flex flex-col min-h-[calc(100vh-3.5rem)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Wallet Funding Analysis
        </h1>
        <p className="text-muted-foreground">Analyze the funding sources and patterns of any Solana wallet address.</p>
      </div>

      <div className="mb-6">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <Input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter wallet address"
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || analysisLoading}>
            {isLoading || analysisLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Wallet"
            )}
          </Button>
        </form>
      </div>

      {(error || analysisError) && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || analysisError}</AlertDescription>
        </Alert>
      )}

      {result && metrics && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <KeyMetricsCards
            totalReceived={metrics.totalReceived}
            primarySource={metrics.primarySource}
            exchangePercentage={metrics.exchangePercentage}
            firstContact={metrics.firstContact}
            lastContact={metrics.lastContact}
          />

          {/* Tabs for different visualizations */}
          <Tabs defaultValue="charts" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="charts">Visualizations</TabsTrigger>
              <TabsTrigger value="sources">Funding Sources</TabsTrigger>
            </TabsList>

            <TabsContent value="charts" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="w-full overflow-hidden">
                  <FundingTimelineChart data={result.timeline} />
                </div>
                <div className="w-full overflow-hidden">
                  <SourceDistributionTreemap data={result.sources} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sources">
              <SourceListTable data={result.sources} />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {!result && !isLoading && !analysisLoading && !error && !analysisError && (
        <div className="flex-1 flex items-center justify-center bg-muted/20 rounded-lg">
          <div className="text-center p-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg max-w-md mx-auto">
              <Info className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Analyze Wallet Funding</h3>
              <p className="text-muted-foreground mb-4">
                Enter a Solana wallet address to analyze its funding sources, timeline, and patterns.
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
