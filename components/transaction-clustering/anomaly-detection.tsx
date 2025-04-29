"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, TrendingUp, Network } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface AnomalyDetectionProps {
  anomalies: {
    highValueCount: number
    newCounterparties: string[]
    rapidSuccessionCount: number
    mixerPatternsCount: number
    failedTransactionsCount: number
  }
}

export function AnomalyDetection({ anomalies }: AnomalyDetectionProps) {
  const { highValueCount, newCounterparties, rapidSuccessionCount, mixerPatternsCount, failedTransactionsCount } =
    anomalies

  // Calculate risk score based on anomalies
  const riskScore = Math.min(
    10,
    Math.round(
      (highValueCount * 2 +
        newCounterparties.length +
        rapidSuccessionCount * 3 +
        mixerPatternsCount * 5 +
        failedTransactionsCount) /
        5,
    ),
  )

  const getRiskLevel = () => {
    if (riskScore <= 3)
      return { level: "Low", color: "text-green-500", bgColor: "bg-green-500", borderColor: "border-t-green-500" }
    if (riskScore <= 7)
      return { level: "Medium", color: "text-amber-500", bgColor: "bg-amber-500", borderColor: "border-t-amber-500" }
    return { level: "High", color: "text-red-500", bgColor: "bg-red-500", borderColor: "border-t-red-500" }
  }

  const { level, color, bgColor, borderColor } = getRiskLevel()

  return (
    <TooltipProvider>
      <Card className={`overflow-hidden ${borderColor}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/40">
          <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
          <AlertTriangle className={`h-4 w-4 ${color}`} />
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{riskScore}/10</div>
          <div className="mt-2">
            <div className="flex items-center">
              <span className="mr-1 text-xs">Risk Level:</span>
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full ${bgColor}`} style={{ width: `${riskScore * 10}%` }}></div>
              </div>
            </div>
            <p className={`text-xs mt-1 ${color}`}>{level} Risk</p>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-t-4 border-t-purple-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/40">
          <CardTitle className="text-sm font-medium">Suspicious Patterns</CardTitle>
          <Network className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{mixerPatternsCount + rapidSuccessionCount}</div>
          <div className="flex flex-col gap-1 mt-2 text-xs">
            <div className="flex justify-between items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 cursor-help">
                    Mixer-like Patterns
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
                      className="lucide lucide-info"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    Patterns that resemble mixing services, with many small transfers to obscure the source of funds
                  </p>
                </TooltipContent>
              </Tooltip>
              <Badge
                variant={mixerPatternsCount > 0 ? "warning" : "outline"}
                className={mixerPatternsCount > 0 ? "" : "text-muted-foreground"}
              >
                {mixerPatternsCount}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 cursor-help">
                    Rapid Succession
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
                      className="lucide lucide-info"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    Transactions executed in rapid succession, potentially indicating automated behavior
                  </p>
                </TooltipContent>
              </Tooltip>
              <Badge
                variant={rapidSuccessionCount > 3 ? "warning" : "outline"}
                className={rapidSuccessionCount > 3 ? "" : "text-muted-foreground"}
              >
                {rapidSuccessionCount}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-t-4 border-t-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/40">
          <CardTitle className="text-sm font-medium">Transaction Anomalies</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{highValueCount + failedTransactionsCount}</div>
          <div className="flex flex-col gap-1 mt-2 text-xs">
            <div className="flex justify-between items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 cursor-help">
                    High Value Transactions
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
                      className="lucide lucide-info"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">Unusually large transactions that stand out from normal activity</p>
                </TooltipContent>
              </Tooltip>
              <Badge
                variant={highValueCount > 0 ? "default" : "outline"}
                className={highValueCount > 0 ? "bg-blue-500" : "text-muted-foreground"}
              >
                {highValueCount}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 cursor-help">
                    Failed Transactions
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
                      className="lucide lucide-info"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    Transactions that failed to execute, potentially indicating suspicious activity
                  </p>
                </TooltipContent>
              </Tooltip>
              <Badge
                variant={failedTransactionsCount > 0 ? "destructive" : "outline"}
                className={failedTransactionsCount > 0 ? "" : "text-muted-foreground"}
              >
                {failedTransactionsCount}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 cursor-help">
                    New Counterparties
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
                      className="lucide lucide-info"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">New addresses this wallet has interacted with recently</p>
                </TooltipContent>
              </Tooltip>
              <Badge variant="outline" className="text-muted-foreground">
                {newCounterparties.length}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
