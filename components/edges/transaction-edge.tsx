"use client"

import { memo } from "react"
import { type EdgeProps, getBezierPath } from "reactflow"
import { format } from "date-fns"

interface TransactionEdgeData {
  value: number
  displayValue: number | string
  timestamp: number
  signature: string
  type: "native" | "token" | "instruction"
  viewMode?: string
  isHighValue?: boolean
  isRecent?: boolean
  isSuspicious?: boolean
  metadata?: Record<string, any>
}

function TransactionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
  selected,
}: EdgeProps<TransactionEdgeData>) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const value = data?.value || 0
  const displayValue = data?.displayValue || 0
  const timestamp = data?.timestamp || 0
  const type = data?.type || "native"
  const viewMode = data?.viewMode || "financial"
  const isHighValue = data?.isHighValue || false
  const isRecent = data?.isRecent || false
  const isSuspicious = data?.isSuspicious || false

  // Position for the label
  const labelX = (sourceX + targetX) / 2
  const labelY = (sourceY + targetY) / 2

  // Determine edge color based on type and view mode
  const getEdgeColor = () => {
    if (selected) return "#ff0072"

    // View mode specific colors
    if (viewMode === "financial" && isHighValue) {
      return "#f59e0b" // amber-500
    }

    if (viewMode === "temporal" && isRecent) {
      return "#0ea5e9" // sky-500
    }

    if (viewMode === "risk" && isSuspicious) {
      return "#ef4444" // red-500
    }

    // Default colors based on type
    switch (type) {
      case "native":
        return "#3b82f6" // blue-500
      case "token":
        return "#10b981" // emerald-500
      case "instruction":
        return "#8b5cf6" // violet-500
      default:
        return "#333"
    }
  }

  // Determine edge width based on value and view mode
  const getEdgeWidth = () => {
    if (selected) return 3

    if (viewMode === "financial") {
      // Scale width based on transaction value
      return value > 10 ? 3 : value > 1 ? 2 : 1
    }

    if (viewMode === "risk" && isSuspicious) {
      return 3
    }

    return value > 10 ? 2 : 1
  }

  const edgeColor = getEdgeColor()
  const edgeWidth = getEdgeWidth()

  // Get the appropriate unit label based on transaction type
  const getUnitLabel = () => {
    switch (type) {
      case "native":
        return "SOL"
      case "token":
        return "units"
      case "instruction":
        return ""
      default:
        return "units"
    }
  }

  // Determine what to show in the label based on view mode
  const renderLabel = () => {
    switch (viewMode) {
      case "financial":
        return (
          <>
            <div className="font-medium">
              {typeof displayValue === "number" ? displayValue.toFixed(4) : displayValue} {getUnitLabel()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {format(new Date(timestamp), "MMM d, HH:mm")}
            </div>
          </>
        )

      case "temporal":
        return (
          <>
            <div className="font-medium">{format(new Date(timestamp), "MMM d")}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{format(new Date(timestamp), "HH:mm:ss")}</div>
          </>
        )

      case "risk":
        return (
          <>
            <div className="font-medium">
              {typeof displayValue === "number" ? displayValue.toFixed(4) : displayValue} {getUnitLabel()}
            </div>
            {isSuspicious && <div className="text-xs text-red-500 font-medium">Suspicious</div>}
          </>
        )

      case "protocol":
        return (
          <>
            <div className="font-medium">{type}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {value > 0
                ? `${typeof displayValue === "number" ? displayValue.toFixed(4) : displayValue} ${getUnitLabel()}`
                : ""}
            </div>
          </>
        )

      default:
        return (
          <>
            <div className="font-medium">
              {typeof displayValue === "number" ? displayValue.toFixed(4) : displayValue} {getUnitLabel()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {format(new Date(timestamp), "MMM d, HH:mm")}
            </div>
          </>
        )
    }
  }

  return (
    <>
      <path
        id={id}
        style={{ ...style, stroke: edgeColor, strokeWidth: edgeWidth }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <foreignObject width={120} height={60} x={labelX - 60} y={labelY - 30} className="overflow-visible">
        <div className="flex items-center justify-center h-full">
          <div
            className={`px-2 py-1 bg-white dark:bg-gray-800 rounded-md border shadow-sm text-xs text-center ${
              selected ? "ring-2 ring-blue-500" : ""
            } ${isSuspicious ? "border-red-500" : ""}`}
          >
            {renderLabel()}
          </div>
        </div>
      </foreignObject>
    </>
  )
}

export default memo(TransactionEdge)
