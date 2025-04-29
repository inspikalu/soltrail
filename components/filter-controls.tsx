"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FilterControlsProps {
  dateRange: [Date, Date]
  setDateRange: (range: [Date, Date]) => void
  amountRange: [number, number]
  setAmountRange: (range: [number, number]) => void
  showCriticalPath: boolean
  onToggleCriticalPath: () => void
  metadata: any
}

export default function FilterControls({
  dateRange,
  setDateRange,
  amountRange,
  setAmountRange,
  showCriticalPath,
  onToggleCriticalPath,
  metadata,
}: FilterControlsProps) {
  const [startDate, endDate] = dateRange
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")

  const handleAmountChange = (values: number[]) => {
    setAmountRange([values[0], values[1]])
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="basic" className="text-xs">
                Basic Filters
              </TabsTrigger>
              <TabsTrigger value="advanced" className="text-xs">
                Advanced Filters
              </TabsTrigger>
              <TabsTrigger value="stats" className="text-xs">
                Statistics
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {metadata?.tokenMints?.length || 0} Tokens
              </Badge>
              <Badge variant="outline" className="text-xs">
                {metadata?.mostActiveAccounts?.length || 0} Accounts
              </Badge>
            </div>
          </div>

          <TabsContent value="basic" className="mt-0">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 space-y-1 min-w-[200px]">
                <label className="text-sm font-medium">Date Range</label>
                <div className="flex gap-2">
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          if (date) {
                            setDateRange([date, endDate])
                            setStartDateOpen(false)
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "End date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => {
                          if (date) {
                            setDateRange([startDate, date])
                            setEndDateOpen(false)
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex-1 space-y-1 min-w-[200px]">
                <label className="text-sm font-medium">
                  Amount Range: {amountRange[0].toFixed(2)} - {amountRange[1].toFixed(2)} SOL
                </label>
                <Slider
                  defaultValue={amountRange}
                  min={metadata?.valueRange?.min || 0}
                  max={metadata?.valueRange?.max || 100}
                  step={0.1}
                  onValueChange={handleAmountChange}
                  className="w-full"
                />
              </div>

              <Button
                variant={showCriticalPath ? "default" : "outline"}
                onClick={onToggleCriticalPath}
                className="whitespace-nowrap"
              >
                <Lightbulb className="mr-2 h-4 w-4" />
                {showCriticalPath ? "Hide Critical Path" : "Highlight Critical Path"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="mt-0">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 space-y-1 min-w-[200px]">
                <label className="text-sm font-medium">Transaction Types</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                    Native
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                    Token
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                    Instruction
                  </Badge>
                </div>
              </div>

              <div className="flex-1 space-y-1 min-w-[200px]">
                <label className="text-sm font-medium">Node Types</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                    Wallet
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                    Token
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                    Program
                  </Badge>
                </div>
              </div>

              <div className="flex-1 space-y-1 min-w-[200px]">
                <label className="text-sm font-medium">Risk Indicators</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                    High Outflow
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                    Circular Paths
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                    Suspicious Programs
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">Transaction Volume</div>
                <div className="text-2xl font-bold">
                  {metadata?.valueRange?.max ? metadata.valueRange.max.toFixed(2) : "0"} SOL
                </div>
                <div className="text-xs text-muted-foreground">Maximum transaction value</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">Time Span</div>
                <div className="text-2xl font-bold">
                  {metadata?.timeRange
                    ? Math.round((metadata.timeRange.end - metadata.timeRange.start) / (1000 * 60 * 60 * 24))
                    : "0"}{" "}
                  days
                </div>
                <div className="text-xs text-muted-foreground">Activity duration</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">Network Size</div>
                <div className="text-2xl font-bold">{metadata?.mostActiveAccounts?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Connected accounts</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
