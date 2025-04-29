"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatAddress, lamportsToSol } from "@/lib/utils"
import { format } from "date-fns"
import { ArrowUpRight, Wallet, Building, Calendar, Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface KeyMetricsCardsProps {
  totalReceived: number
  primarySource: {
    address: string
    amount: number
    percentage: number
  }
  exchangePercentage: number
  firstContact: Date
  lastContact: Date
}

export function KeyMetricsCards({
  totalReceived,
  primarySource,
  exchangePercentage,
  firstContact,
  lastContact,
}: KeyMetricsCardsProps) {
  const [copiedAddress, setCopiedAddress] = useState(false)

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(primarySource.address)
    setCopiedAddress(true)
    setTimeout(() => setCopiedAddress(false), 2000)
  }

  const openExplorer = () => {
    window.open(`https://solscan.io/account/${primarySource.address}`, "_blank")
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="overflow-hidden border-t-4 border-t-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/40">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{lamportsToSol(totalReceived)} SOL</div>
            <p className="text-xs text-muted-foreground">Across all transactions</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-t-4 border-t-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/40">
            <CardTitle className="text-sm font-medium">Primary Source</CardTitle>
            <Wallet className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{primarySource.percentage.toFixed(1)}%</div>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-xs text-muted-foreground truncate font-mono">
                {formatAddress(primarySource.address, 8)}
              </p>
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleCopyAddress}>
                      {copiedAddress ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-green-500"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{copiedAddress ? "Copied!" : "Copy address"}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={openExplorer}>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View on explorer</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-t-4 border-t-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/40">
            <CardTitle className="text-sm font-medium">Exchange Percentage</CardTitle>
            <Building className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{exchangePercentage.toFixed(1)}%</div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, exchangePercentage)}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Funds from known exchanges</p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-t-4 border-t-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/40">
            <CardTitle className="text-sm font-medium">Activity Period</CardTitle>
            <Calendar className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{format(firstContact, "MMM d")}</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-0.5 flex-1 bg-gray-200 dark:bg-gray-700 relative">
                <div
                  className="absolute inset-y-0 left-0 bg-amber-500"
                  style={{
                    width: `${Math.min(100, ((lastContact.getTime() - firstContact.getTime()) / (Date.now() - firstContact.getTime())) * 100)}%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground whitespace-nowrap">{format(lastContact, "MMM d, yyyy")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
