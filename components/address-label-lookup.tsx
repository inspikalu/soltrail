"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertTriangle } from "lucide-react"
import type { AddressLabelResponse } from "@/lib/types/blocksec"
import { analyzeWallet, type WalletAnalysisResult } from "@/lib/utils/detectWalletActivityPatterns"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function AddressLabelLookup() {
  const [address, setAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<WalletAnalysisResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.trim()) {
      setError("Please enter a valid address")
      return
    }

    setIsLoading(true)
    setError(null)
    setAnalysisResult(null)

    try {
      // Use the analyzeWallet function which includes both label and pattern detection
      const result = await analyzeWallet(address)
      setAnalysisResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <Input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter Solana address"
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze Wallet"
          )}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysisResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Entity Label Card */}
          <EntityLabelCard labelData={analysisResult.label} />

          {/* Wallet Patterns Card */}
          <WalletPatternsCard patterns={analysisResult.patterns} />
        </div>
      )}
    </div>
  )
}

function EntityLabelCard({ labelData }: { labelData: AddressLabelResponse | null }) {
  if (!labelData || !labelData.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Entity Label</CardTitle>
          <CardDescription>No entity data found for this address</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6 text-muted-foreground">
            <p>This address has no known entity labels</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border-t-4 border-t-blue-500">
      <CardHeader className="bg-muted/40">
        <CardTitle className="flex items-center gap-2">
          <span>Entity Label</span>
          {labelData.data.main_entity && (
            <Badge variant="default" className="ml-2">
              {labelData.data.main_entity}
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="font-mono text-xs truncate">{labelData.data.address}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {labelData.data.name_tag && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Name Tag</h3>
              <p className="text-base">{labelData.data.name_tag}</p>
            </div>
          )}

          {labelData.data.main_entity_info?.categories?.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Categories</h3>
              <div className="flex flex-wrap gap-2 mt-1">
                {labelData.data.main_entity_info.categories.map((category, index) => (
                  <Badge key={index} variant="secondary">
                    {category.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {labelData.data.attributes?.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Attributes</h3>
              <div className="flex flex-wrap gap-2 mt-1">
                {labelData.data.attributes.map((attr, index) => (
                  <Badge key={index} variant="outline">
                    {attr.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {labelData.data.comp_entities?.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Related Entities</h3>
              <div className="flex flex-wrap gap-2 mt-1">
                {labelData.data.comp_entities.map((entity, index) => (
                  <Badge key={index} variant="outline">
                    {entity}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {labelData.data.main_entity_info?.description && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Links</h3>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {labelData.data.main_entity_info.description.website && (
                  <a
                    href={labelData.data.main_entity_info.description.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-globe"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      <path d="M2 12h20" />
                    </svg>
                    Website
                  </a>
                )}
                {labelData.data.main_entity_info.description.twitter && (
                  <a
                    href={labelData.data.main_entity_info.description.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-twitter"
                    >
                      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                    </svg>
                    Twitter
                  </a>
                )}
                {labelData.data.main_entity_info.description.telegram && (
                  <a
                    href={labelData.data.main_entity_info.description.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-send"
                    >
                      <path d="m22 2-7 20-4-9-9-4Z" />
                      <path d="M22 2 11 13" />
                    </svg>
                    Telegram
                  </a>
                )}
                {labelData.data.main_entity_info.description.discord && (
                  <a
                    href={labelData.data.main_entity_info.description.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-message-circle"
                    >
                      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                    </svg>
                    Discord
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function WalletPatternsCard({ patterns }: { patterns: any }) {
  const hasPatterns = patterns.hasManySmallInputs || patterns.hasSuddenTokenDump || patterns.isExchangeLike

  return (
    <Card className={`overflow-hidden border-t-4 ${hasPatterns ? "border-t-amber-500" : "border-t-green-500"}`}>
      <CardHeader className="bg-muted/40">
        <CardTitle className="flex items-center gap-2">
          <span>Wallet Patterns</span>
          {hasPatterns ? (
            <Badge variant="warning" className="bg-amber-500">
              Suspicious
            </Badge>
          ) : (
            <Badge variant="success" className="bg-green-500">
              Normal
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Detected activity patterns for this wallet</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Exchange-like behavior */}
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-full ${patterns.isExchangeLike ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-building"
              >
                <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
                <path d="M9 22v-4h6v4" />
                <path d="M8 6h.01" />
                <path d="M16 6h.01" />
                <path d="M12 6h.01" />
                <path d="M12 10h.01" />
                <path d="M12 14h.01" />
                <path d="M16 10h.01" />
                <path d="M16 14h.01" />
                <path d="M8 10h.01" />
                <path d="M8 14h.01" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-medium">Exchange-like Behavior</h3>
              <p className="text-sm text-muted-foreground">
                {patterns.isExchangeLike
                  ? "This wallet shows patterns similar to exchange wallets, with many deposits and withdrawals."
                  : "This wallet does not show exchange-like behavior patterns."}
              </p>
            </div>
          </div>

          {/* Many small inputs */}
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-full ${patterns.hasManySmallInputs ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-coins"
              >
                <circle cx="8" cy="8" r="6" />
                <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
                <path d="M7 6h1v4" />
                <path d="m16.71 13.88.7.71-2.82 2.82" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-medium">Many Small Inputs</h3>
              <p className="text-sm text-muted-foreground">
                {patterns.hasManySmallInputs
                  ? `Received ${patterns.patterns.manySmallInputs?.count} small deposits totaling ${patterns.patterns.manySmallInputs?.totalAmount.toFixed(4)} SOL in ${patterns.patterns.manySmallInputs?.timeWindow}.`
                  : "No unusual pattern of small deposits detected."}
              </p>
            </div>
          </div>

          {/* Sudden token dump */}
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-full ${patterns.hasSuddenTokenDump ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-trending-down"
              >
                <path d="m22 17-8.5-8.5-5 5L2 7" />
                <path d="M16 17h6v-6" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-medium">Sudden Token Dump</h3>
              <p className="text-sm text-muted-foreground">
                {patterns.hasSuddenTokenDump
                  ? `Dumped ${patterns.patterns.suddenTokenDump?.percentageDumped.toFixed(1)}% of a token (${patterns.patterns.suddenTokenDump?.mint.substring(0, 6)}...) in ${patterns.patterns.suddenTokenDump?.timeWindow}.`
                  : "No sudden token dumps detected."}
              </p>
            </div>
          </div>

          {/* Risk assessment */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Risk Assessment</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Risk Level</span>
                <Badge
                  variant={hasPatterns ? "outline" : "secondary"}
                  className={hasPatterns ? "text-amber-500 border-amber-500" : ""}
                >
                  {hasPatterns ? "Medium" : "Low"}
                </Badge>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${hasPatterns ? "bg-amber-500" : "bg-green-500"}`}
                  style={{ width: hasPatterns ? "50%" : "20%" }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {hasPatterns
                  ? "This wallet shows some suspicious patterns that may warrant further investigation."
                  : "This wallet shows normal activity patterns with no significant risk indicators."}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
