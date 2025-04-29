"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Wallet, Coins, Code, AlertTriangle, Clock } from "lucide-react"
import { format } from "date-fns"

interface WalletNodeData {
  label: string
  type: "wallet" | "token" | "program"
  balance?: number
  totalInflow: number
  totalOutflow: number
  isMainWallet?: boolean
  firstSeen: number
  lastSeen: number
  viewMode?: string
  isHighVolume?: boolean
  isRecent?: boolean
  isSuspicious?: boolean
  transactions: string[]
  metadata?: Record<string, any>
}

function WalletNode({ data }: NodeProps<WalletNodeData>) {
  const {
    label,
    type,
    balance,
    totalInflow,
    totalOutflow,
    isMainWallet,
    firstSeen,
    lastSeen,
    viewMode,
    isHighVolume,
    isRecent,
    isSuspicious,
    transactions,
  } = data

  // Determine node color and icon based on type and view mode
  const getNodeStyle = () => {
    // Base styles based on node type
    let baseStyle = {
      bgColor: "bg-blue-100 dark:bg-blue-800",
      borderColor: "border-blue-300 dark:border-blue-600",
      icon: <Wallet className="w-4 h-4 mr-1" />,
    }

    switch (type) {
      case "wallet":
        baseStyle = {
          bgColor: isMainWallet ? "bg-blue-200 dark:bg-blue-900" : "bg-blue-100 dark:bg-blue-800",
          borderColor: isMainWallet ? "border-blue-500" : "border-blue-300 dark:border-blue-600",
          icon: <Wallet className="w-4 h-4 mr-1" />,
        }
        break
      case "token":
        baseStyle = {
          bgColor: "bg-green-100 dark:bg-green-800",
          borderColor: "border-green-300 dark:border-green-600",
          icon: <Coins className="w-4 h-4 mr-1" />,
        }
        break
      case "program":
        baseStyle = {
          bgColor: "bg-purple-100 dark:bg-purple-800",
          borderColor: "border-purple-300 dark:border-purple-600",
          icon: <Code className="w-4 h-4 mr-1" />,
        }
        break
    }

    // Apply view mode specific styling
    if (viewMode === "financial" && isHighVolume) {
      return {
        ...baseStyle,
        bgColor: "bg-amber-100 dark:bg-amber-900",
        borderColor: "border-amber-500 dark:border-amber-700",
      }
    }

    if (viewMode === "temporal" && isRecent) {
      return {
        ...baseStyle,
        bgColor: "bg-sky-100 dark:bg-sky-900",
        borderColor: "border-sky-500 dark:border-sky-700",
        icon: <Clock className="w-4 h-4 mr-1" />,
      }
    }

    if (viewMode === "risk" && isSuspicious) {
      return {
        ...baseStyle,
        bgColor: "bg-red-100 dark:bg-red-900",
        borderColor: "border-red-500 dark:border-red-700",
        icon: <AlertTriangle className="w-4 h-4 mr-1" />,
      }
    }

    return baseStyle
  }

  const { bgColor, borderColor, icon } = getNodeStyle()
  const nodeSize = isMainWallet ? "min-w-[180px]" : "min-w-[160px]"

  // Determine what data to show based on view mode
  const renderViewModeContent = () => {
    switch (viewMode) {
      case "financial":
        return (
          <div className="flex justify-between w-full text-xs mt-1">
            <span className="text-green-600 dark:text-green-400">+{totalInflow.toFixed(2)}</span>
            <span className="text-red-600 dark:text-red-400">-{totalOutflow.toFixed(2)}</span>
          </div>
        )

      case "temporal":
        return (
          <div className="text-xs text-gray-500 mt-1">
            {firstSeen && format(new Date(firstSeen), "MMM d")} - {lastSeen && format(new Date(lastSeen), "MMM d")}
          </div>
        )

      case "risk":
        // Calculate risk score based on outflow/inflow ratio
        const riskRatio = totalInflow > 0 ? totalOutflow / totalInflow : 0
        const riskScore = Math.min(10, Math.round(riskRatio * 10))
        return (
          <div className="text-xs mt-1">
            <div className="flex items-center">
              <span className="mr-1">Risk:</span>
              <div className="h-2 w-20 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${riskScore > 7 ? "bg-red-500" : riskScore > 4 ? "bg-amber-500" : "bg-green-500"}`}
                  style={{ width: `${riskScore * 10}%` }}
                ></div>
              </div>
            </div>
          </div>
        )

      case "protocol":
        return (
          <div className="text-xs mt-1">
            <span className="text-gray-500">Txns: {transactions.length}</span>
          </div>
        )

      default:
        return (
          <>
            {balance !== undefined && <div className="text-xs mt-1">{balance.toFixed(2)} SOL</div>}
            <div className="flex justify-between w-full text-xs mt-1">
              <span className="text-green-600 dark:text-green-400">+{totalInflow.toFixed(2)}</span>
              <span className="text-red-600 dark:text-red-400">-{totalOutflow.toFixed(2)}</span>
            </div>
          </>
        )
    }
  }

  return (
    <div
      className={`px-3 py-2 rounded-lg border-2 ${bgColor} ${borderColor} shadow-md ${nodeSize} ${
        isMainWallet ? "ring-2 ring-blue-500 ring-offset-2" : ""
      }`}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex flex-col items-center">
        <div className="flex items-center font-medium text-sm">
          {icon}
          {label}
          {isMainWallet && <span className="ml-1 text-xs bg-blue-500 text-white px-1 rounded">Main</span>}
          {isSuspicious && <span className="ml-1 text-xs bg-red-500 text-white px-1 rounded">Risk</span>}
        </div>

        {renderViewModeContent()}
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  )
}

export default memo(WalletNode)
