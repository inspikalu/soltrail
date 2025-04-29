"use client"

import type React from "react"

import { useCallback, useEffect, useState } from "react"
import ReactFlow, {
  Background,
  Controls,
  type Edge,
  type Node,
  type NodeChange,
  applyNodeChanges,
  applyEdgeChanges,
  type EdgeChange,
  ConnectionLineType,
  Panel,
  useReactFlow,
  MiniMap,
} from "reactflow"
import "reactflow/dist/style.css"
import type { TransactionGraph } from "@/lib/utils/convertTransactionHistorytograph"
import WalletNode from "./nodes/wallet-node"
import TransactionEdge from "./edges/transaction-edge"
import { Button } from "@/components/ui/button"
import {
  ZoomIn,
  GitCommit,
  BarChart3,
  Network,
  Clock,
  AlertTriangle,
  Wallet,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, lamportsToSol } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useIsMobile } from "@/hooks/use-mobile"

interface TransactionFlowGraphProps {
  graphData: TransactionGraph
  dateRange: [Date, Date]
  amountRange: [number, number]
  showCriticalPath: boolean
  onSelectTransaction: (signature: string | null) => void
  mainWalletAddress?: string
}

const nodeTypes = {
  wallet: WalletNode,
}

const edgeTypes = {
  transaction: TransactionEdge,
}

type LayoutType = "force" | "linear" | "hierarchical" | "temporal" | "risk" | "dagre"
type ViewMode = "financial" | "temporal" | "relationship" | "behavioral" | "asset" | "risk" | "protocol"

export default function TransactionFlowGraph({
  graphData,
  dateRange,
  amountRange,
  showCriticalPath,
  onSelectTransaction,
  mainWalletAddress,
}: TransactionFlowGraphProps) {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const { fitView } = useReactFlow()
  const [layoutType, setLayoutType] = useState<LayoutType>("dagre")
  const [viewMode, setViewMode] = useState<ViewMode>("financial")
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [storyInsights, setStoryInsights] = useState<string[]>([])
  const [nodeDetailsOpen, setNodeDetailsOpen] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<any>(null)
  const isMobile = useIsMobile()

  // Generate insights based on the graph data and current view mode
  useEffect(() => {
    if (!graphData) return

    const insights: string[] = []

    switch (viewMode) {
      case "financial":
        // Find the node with highest outflow
        const highestOutflow = [...graphData.nodes].sort((a, b) => b.totalOutflow - a.totalOutflow)[0]
        if (highestOutflow) {
          insights.push(
            `Highest outflow: ${highestOutflow.id.substring(0, 6)}... with ${highestOutflow.totalOutflow.toFixed(2)} SOL`,
          )
        }

        // Find the node with highest inflow
        const highestInflow = [...graphData.nodes].sort((a, b) => b.totalInflow - a.totalInflow)[0]
        if (highestInflow) {
          insights.push(
            `Highest inflow: ${highestInflow.id.substring(0, 6)}... with ${highestInflow.totalInflow.toFixed(2)} SOL`,
          )
        }

        // Calculate total transaction volume
        const totalVolume = graphData.edges.reduce((sum, edge) => sum + edge.value, 0)
        insights.push(`Total transaction volume: ${totalVolume.toFixed(2)} SOL`)

        break

      case "temporal":
        // Calculate activity duration
        const duration = (graphData.metadata.timeRange.end - graphData.metadata.timeRange.start) / (1000 * 60 * 60 * 24)
        insights.push(`Activity duration: ${Math.round(duration)} days`)

        // Find most recently active node
        const mostRecent = [...graphData.nodes].sort((a, b) => b.lastSeen - a.lastSeen)[0]
        if (mostRecent) {
          insights.push(
            `Most recent activity: ${mostRecent.id.substring(0, 6)}... on ${formatDate(mostRecent.lastSeen)}`,
          )
        }

        // Find oldest node
        const oldest = [...graphData.nodes].sort((a, b) => a.firstSeen - b.firstSeen)[0]
        if (oldest) {
          insights.push(`First seen: ${oldest.id.substring(0, 6)}... on ${formatDate(oldest.firstSeen)}`)
        }

        break

      case "relationship":
        // Count wallet clusters
        const walletCount = graphData.nodes.filter((node) => node.type === "wallet").length
        insights.push(`Network contains ${walletCount} wallet addresses`)

        // Count program nodes
        const programCount = graphData.nodes.filter((node) => node.type === "program").length
        insights.push(`Interacts with ${programCount} unique programs`)

        // Count token nodes
        const tokenCount = graphData.nodes.filter((node) => node.type === "token").length
        insights.push(`Involves ${tokenCount} token mints`)

        break

      case "behavioral":
        // Show most active accounts
        if (graphData.metadata.mostActiveAccounts.length > 0) {
          insights.push(`Most active account: ${graphData.metadata.mostActiveAccounts[0].substring(0, 6)}...`)
        }

        // Show most active programs
        if (graphData.metadata.mostActivePrograms.length > 0) {
          insights.push(`Most used program: ${graphData.metadata.mostActivePrograms[0].substring(0, 6)}...`)
        }

        // Count critical path length
        insights.push(`Critical path length: ${graphData.metadata.criticalPath.length} transactions`)

        break

      case "asset":
        // Count token types
        insights.push(`Token types: ${graphData.metadata.tokenMints.length}`)

        // Find highest balance
        const highestBalance = [...graphData.nodes]
          .filter((node) => node.balance !== undefined)
          .sort((a, b) => (b.balance || 0) - (a.balance || 0))[0]
        if (highestBalance) {
          insights.push(
            `Highest balance: ${highestBalance.id.substring(0, 6)}... with ${highestBalance.balance?.toFixed(2)} SOL`,
          )
        }

        break

      case "risk":
        // Find suspicious patterns - high outflow to inflow ratio
        const suspiciousNodes = graphData.nodes.filter(
          (node) => node.totalOutflow > 0 && node.totalInflow > 0 && node.totalOutflow / node.totalInflow > 10,
        )
        insights.push(`Suspicious nodes: ${suspiciousNodes.length}`)

        // Check for circular transactions
        const circularPaths = findCircularPaths(graphData)
        insights.push(`Circular transaction paths: ${circularPaths}`)

        break

      case "protocol":
        // Count native vs token transfers
        const nativeTransfers = graphData.edges.filter((edge) => edge.type === "native").length
        const tokenTransfers = graphData.edges.filter((edge) => edge.type === "token").length
        insights.push(`Native transfers: ${nativeTransfers}`)
        insights.push(`Token transfers: ${tokenTransfers}`)

        // Count instruction interactions
        const instructionCount = graphData.edges.filter((edge) => edge.type === "instruction").length
        insights.push(`Smart contract interactions: ${instructionCount}`)

        break
    }

    setStoryInsights(insights)
  }, [graphData, viewMode])

  // Convert graph data to ReactFlow format and apply layout
  useEffect(() => {
    if (!graphData) return

    // Filter by date and amount range
    const minTime = dateRange[0].getTime()
    const maxTime = dateRange[1].getTime()
    const minAmount = amountRange[0]
    const maxAmount = amountRange[1]

    // Filter nodes
    const filteredNodes = graphData.nodes.filter((node) => {
      return node.lastSeen >= minTime && node.firstSeen <= maxTime
    })

    // Filter edges
    const filteredEdges = graphData.edges.filter((edge) => {
      return (
        edge.timestamp >= minTime &&
        edge.timestamp <= maxTime &&
        edge.value >= minAmount &&
        edge.value <= maxAmount &&
        (!showCriticalPath || graphData.metadata.criticalPath.includes(edge.id))
      )
    })

    // Create ReactFlow nodes with view mode specific data
    const flowNodes: Node[] = filteredNodes.map((node) => {
      // Base node data
      const nodeData = {
        label: node.id.substring(0, 4) + "..." + node.id.substring(node.id.length - 4),
        fullAddress: node.id,
        type: node.type,
        balance: node.balance,
        totalInflow: node.totalInflow,
        totalOutflow: node.totalOutflow,
        firstSeen: node.firstSeen,
        lastSeen: node.lastSeen,
        isMainWallet: node.id === mainWalletAddress,
        viewMode,
        transactions: node.transactions,
        metadata: node.metadata,
      }

      // Add view mode specific styling
      switch (viewMode) {
        case "financial":
          return {
            id: node.id,
            type: "wallet",
            position: { x: 0, y: 0 },
            data: {
              ...nodeData,
              // Highlight nodes with high financial activity
              isHighVolume: node.totalInflow + node.totalOutflow > graphData.metadata.valueRange.max * 0.5,
            },
          }
        case "temporal":
          return {
            id: node.id,
            type: "wallet",
            position: { x: 0, y: 0 },
            data: {
              ...nodeData,
              // Highlight recently active nodes
              isRecent: node.lastSeen > Date.now() - 7 * 24 * 60 * 60 * 1000,
            },
          }
        case "risk":
          return {
            id: node.id,
            type: "wallet",
            position: { x: 0, y: 0 },
            data: {
              ...nodeData,
              // Highlight suspicious nodes (high outflow to inflow ratio)
              isSuspicious: node.totalOutflow > 0 && node.totalInflow > 0 && node.totalOutflow / node.totalInflow > 10,
            },
          }
        default:
          return {
            id: node.id,
            type: "wallet",
            position: { x: 0, y: 0 },
            data: nodeData,
          }
      }
    })

    // Create ReactFlow edges with view mode specific data
    const flowEdges: Edge[] = filteredEdges.map((edge) => {
      // Convert lamports to SOL for native transfers
      const displayValue = edge.type === "native" ? lamportsToSol(edge.value) : edge.value

      // Base edge data
      const edgeData = {
        value: edge.value,
        displayValue,
        timestamp: edge.timestamp,
        signature: edge.signature,
        type: edge.type,
        metadata: edge.metadata,
        viewMode,
      }

      // Add view mode specific styling
      switch (viewMode) {
        case "financial":
          return {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: "transaction",
            animated: showCriticalPath && graphData.metadata.criticalPath.includes(edge.id),
            data: {
              ...edgeData,
              // Highlight high value transactions
              isHighValue: edge.value > graphData.metadata.valueRange.max * 0.5,
            },
          }
        case "temporal":
          return {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: "transaction",
            animated: false,
            data: {
              ...edgeData,
              // Highlight recent transactions
              isRecent: edge.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000,
            },
          }
        case "risk":
          // For risk view, highlight transactions that might be suspicious
          const isSourceSuspicious = graphData.nodes.find((n) => n.id === edge.source)?.totalOutflow > 10
          const isTargetSuspicious = graphData.nodes.find((n) => n.id === edge.target)?.totalInflow > 10

          return {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: "transaction",
            animated: isSourceSuspicious && isTargetSuspicious,
            data: {
              ...edgeData,
              isSuspicious: isSourceSuspicious && isTargetSuspicious,
            },
          }
        default:
          return {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: "transaction",
            animated: showCriticalPath && graphData.metadata.criticalPath.includes(edge.id),
            data: edgeData,
          }
      }
    })

    // Apply the selected layout
    const positionedNodes = applyLayout(flowNodes, flowEdges, layoutType, viewMode, mainWalletAddress)

    setNodes(positionedNodes)
    setEdges(flowEdges)
  }, [graphData, dateRange, amountRange, showCriticalPath, mainWalletAddress, layoutType, viewMode])

  // Fit view when nodes change
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.2 })
      }, 100)
    }
  }, [nodes.length, fitView])

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), [])

  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), [])

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      onSelectTransaction(edge.data.signature)
    },
    [onSelectTransaction],
  )

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id)
    setNodeDetailsOpen(true)
  }, [])

  const handleCopyAddress = useCallback(() => {
    if (selectedNode) {
      navigator.clipboard.writeText(selectedNode)
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2000)
    }
  }, [selectedNode])

  const openExplorerLink = useCallback((type: string, value: string) => {
    let url = ""
    if (type === "transaction") {
      url = `https://solscan.io/tx/${value}`
    } else if (type === "address" || type === "token") {
      url = `https://solscan.io/account/${value}`
    }

    if (url) {
      window.open(url, "_blank")
    }
  }, [])

  // Function to find circular transaction paths (potential money laundering)
  function findCircularPaths(graph: TransactionGraph): number {
    // Create an adjacency list
    const adjacencyList: Record<string, string[]> = {}

    graph.edges.forEach((edge) => {
      if (!adjacencyList[edge.source]) {
        adjacencyList[edge.source] = []
      }
      adjacencyList[edge.source].push(edge.target)
    })

    // Count cycles using DFS
    let cycleCount = 0
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    function dfs(node: string, path: string[] = []): void {
      if (recursionStack.has(node)) {
        // Found a cycle
        cycleCount++
        return
      }

      if (visited.has(node)) return

      visited.add(node)
      recursionStack.add(node)

      const neighbors = adjacencyList[node] || []
      for (const neighbor of neighbors) {
        dfs(neighbor, [...path, node])
      }

      recursionStack.delete(node)
    }

    // Start DFS from each node
    for (const node of graph.nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id)
      }
    }

    return cycleCount
  }

  // Function to apply different layout algorithms
  function applyLayout(
    nodes: Node[],
    edges: Edge[],
    layoutType: LayoutType,
    viewMode: ViewMode,
    mainWalletAddress?: string,
  ): Node[] {
    if (nodes.length === 0) return nodes

    // Create a deep copy to avoid mutating the original
    const positionedNodes = JSON.parse(JSON.stringify(nodes))

    // Find the main wallet node
    const mainWalletIndex = positionedNodes.findIndex((n: Node) => n.id === mainWalletAddress)
    const mainWalletNode = mainWalletIndex >= 0 ? positionedNodes[mainWalletIndex] : null

    switch (layoutType) {
      case "dagre": {
        // Use a more structured layout to prevent edge entanglement
        // This is a simplified version of the dagre algorithm

        // Step 1: Rank nodes by their position in the transaction flow
        const nodeRanks: Record<string, number> = {}
        const visited = new Set<string>()

        // Helper function to calculate node ranks
        function calculateRanks(nodeId: string, rank = 0) {
          if (visited.has(nodeId)) return
          visited.add(nodeId)

          // Set the rank for this node
          nodeRanks[nodeId] = Math.max(rank, nodeRanks[nodeId] || 0)

          // Find all outgoing edges from this node
          const outgoingEdges = edges.filter((e) => e.source === nodeId)

          // Recursively calculate ranks for target nodes
          for (const edge of outgoingEdges) {
            calculateRanks(edge.target, rank + 1)
          }
        }

        // Start ranking from the main wallet or any node if main wallet not specified
        if (mainWalletAddress) {
          calculateRanks(mainWalletAddress)
        } else {
          // Find a good starting point - node with most outgoing edges
          const nodeCounts = nodes.map((node) => ({
            id: node.id,
            outCount: edges.filter((e) => e.source === node.id).length,
          }))

          const startNode = nodeCounts.sort((a, b) => b.outCount - a.outCount)[0]?.id
          if (startNode) {
            calculateRanks(startNode)
          }
        }

        // For any nodes not visited yet, assign them a default rank
        for (const node of nodes) {
          if (!nodeRanks[node.id]) {
            nodeRanks[node.id] = 0
          }
        }

        // Step 2: Group nodes by rank
        const rankGroups: Record<number, string[]> = {}
        for (const [nodeId, rank] of Object.entries(nodeRanks)) {
          if (!rankGroups[rank]) {
            rankGroups[rank] = []
          }
          rankGroups[rank].push(nodeId)
        }

        // Step 3: Position nodes based on their rank
        const ranks = Object.keys(rankGroups)
          .map(Number)
          .sort((a, b) => a - b)
        const horizontalSpacing = 300
        const verticalSpacing = 150

        for (const rank of ranks) {
          const nodesInRank = rankGroups[rank]
          const rankWidth = nodesInRank.length * verticalSpacing

          nodesInRank.forEach((nodeId, index) => {
            const node = positionedNodes.find((n: Node) => n.id === nodeId)
            if (node) {
              node.position = {
                x: rank * horizontalSpacing,
                y: (index - nodesInRank.length / 2) * verticalSpacing,
              }
            }
          })
        }

        break
      }

      case "temporal": {
        // Create a timeline-based layout that emphasizes the temporal story
        const timeRange = dateRange[1].getTime() - dateRange[0].getTime()
        const timelineWidth = Math.max(1000, nodes.length * 150)

        // Sort nodes by firstSeen
        positionedNodes.sort((a: Node, b: Node) => a.data.firstSeen - b.data.firstSeen)

        // Position nodes along a timeline
        positionedNodes.forEach((node: Node, index: number) => {
          const timePosition =
            ((node.data.firstSeen - dateRange[0].getTime()) / timeRange) * timelineWidth - timelineWidth / 2

          // Position based on node type
          let yPosition = 0
          if (node.data.type === "wallet") yPosition = -100
          else if (node.data.type === "token") yPosition = 0
          else if (node.data.type === "program") yPosition = 100

          // Adjust for activity duration
          const activityDuration = node.data.lastSeen - node.data.firstSeen
          const activityFactor = Math.min(1, activityDuration / (timeRange * 0.5))

          node.position = {
            x: timePosition,
            y: yPosition + (Math.random() * 50 - 25) * activityFactor,
          }
        })

        break
      }

      case "risk": {
        // Create a risk-focused layout that highlights suspicious patterns
        const centerX = 0
        const centerY = 0

        // Place main wallet in center
        if (mainWalletNode) {
          mainWalletNode.position = { x: centerX, y: centerY }
        }

        // Calculate risk scores
        positionedNodes.forEach((node: Node) => {
          if (node.id === mainWalletAddress) return

          // Calculate risk score based on transaction patterns
          const outflowRatio = node.data.totalOutflow / (node.data.totalInflow || 1)
          const isHighRisk = outflowRatio > 10 || node.data.isSuspicious

          // Position high risk nodes closer to center
          const angle = Math.random() * Math.PI * 2
          const distance = isHighRisk ? 200 : 400 + Math.random() * 200

          node.position = {
            x: centerX + Math.cos(angle) * distance,
            y: centerY + Math.sin(angle) * distance,
          }
        })

        break
      }

      case "linear": {
        // Create a timeline-based layout

        // 1. Sort edges by timestamp
        const sortedEdges = [...edges].sort((a, b) => a.data.timestamp - b.data.timestamp)

        // 2. Create a map to track node positions in the timeline
        const nodeTimelinePositions: Record<string, { x: number; y: number; level: number }> = {}

        // 3. Place the main wallet in the center
        if (mainWalletNode) {
          nodeTimelinePositions[mainWalletNode.id] = { x: 0, y: 0, level: 0 }
        }

        // 4. Calculate the horizontal spacing based on the time range
        const timeRange = dateRange[1].getTime() - dateRange[0].getTime()
        const timelineWidth = Math.max(1000, nodes.length * 150)
        const timeToXPosition = (time: number) => {
          return ((time - dateRange[0].getTime()) / timeRange) * timelineWidth - timelineWidth / 2
        }

        // 5. Process edges in chronological order to position nodes
        sortedEdges.forEach((edge) => {
          const sourceId = edge.source
          const targetId = edge.target
          const timestamp = edge.data.timestamp

          // If we haven't positioned the source node yet
          if (!nodeTimelinePositions[sourceId]) {
            nodeTimelinePositions[sourceId] = {
              x: timeToXPosition(timestamp) - 100, // Place slightly before the transaction time
              y: Math.random() * 200 - 100, // Random vertical position
              level: -1, // Default level for senders
            }
          }

          // If we haven't positioned the target node yet
          if (!nodeTimelinePositions[targetId]) {
            nodeTimelinePositions[targetId] = {
              x: timeToXPosition(timestamp) + 100, // Place slightly after the transaction time
              y: Math.random() * 200 - 100, // Random vertical position
              level: 1, // Default level for receivers
            }
          }
        })

        // 6. Apply positions to nodes
        positionedNodes.forEach((node: Node) => {
          if (nodeTimelinePositions[node.id]) {
            node.position = {
              x: nodeTimelinePositions[node.id].x,
              y: nodeTimelinePositions[node.id].y,
            }
          } else {
            // For any nodes not involved in transactions, place them at the far right
            node.position = {
              x: timelineWidth / 2 + Math.random() * 200,
              y: Math.random() * 400 - 200,
            }
          }
        })

        break
      }

      case "hierarchical": {
        // Create a hierarchical layout with senders on left, receivers on right

        // 1. Analyze the flow direction for each node relative to the main wallet
        const nodeFlowDirection: Record<string, { inflow: number; outflow: number }> = {}

        // Initialize with zero values
        positionedNodes.forEach((node: Node) => {
          nodeFlowDirection[node.id] = { inflow: 0, outflow: 0 }
        })

        // Calculate inflow and outflow relative to main wallet
        edges.forEach((edge) => {
          if (edge.source === mainWalletAddress) {
            // Main wallet is sending funds
            nodeFlowDirection[edge.target].inflow += edge.data.value
          }
          if (edge.target === mainWalletAddress) {
            // Main wallet is receiving funds
            nodeFlowDirection[edge.source].outflow += edge.data.value
          }
        })

        // 2. Categorize nodes as senders, receivers, or mixed
        const senders: string[] = []
        const receivers: string[] = []
        const mixed: string[] = []

        Object.entries(nodeFlowDirection).forEach(([nodeId, flow]) => {
          if (nodeId === mainWalletAddress) return

          if (flow.outflow > 0 && flow.inflow === 0) {
            senders.push(nodeId)
          } else if (flow.inflow > 0 && flow.outflow === 0) {
            receivers.push(nodeId)
          } else if (flow.inflow > 0 && flow.outflow > 0) {
            mixed.push(nodeId)
          } else {
            // No direct connection to main wallet, categorize based on overall flow
            const node = positionedNodes.find((n: Node) => n.id === nodeId)
            if (node && node.data.totalOutflow > node.data.totalInflow) {
              senders.push(nodeId)
            } else {
              receivers.push(nodeId)
            }
          }
        })

        // 3. Position the main wallet in the center
        if (mainWalletNode) {
          mainWalletNode.position = { x: 0, y: 0 }
        }

        // 4. Position senders on the left
        const senderSpacing = 150
        senders.forEach((id, index) => {
          const node = positionedNodes.find((n: Node) => n.id === id)
          if (node) {
            node.position = {
              x: -400,
              y: (index - senders.length / 2) * senderSpacing,
            }
          }
        })

        // 5. Position receivers on the right
        const receiverSpacing = 150
        receivers.forEach((id, index) => {
          const node = positionedNodes.find((n: Node) => n.id === id)
          if (node) {
            node.position = {
              x: 400,
              y: (index - receivers.length / 2) * receiverSpacing,
            }
          }
        })

        // 6. Position mixed nodes above and below
        const mixedSpacing = 150
        mixed.forEach((id, index) => {
          const node = positionedNodes.find((n: Node) => n.id === id)
          if (node) {
            const side = index % 2 === 0 ? -1 : 1
            const offset = Math.floor(index / 2) + 1
            node.position = {
              x: side * 200,
              y: side * offset * mixedSpacing,
            }
          }
        })

        break
      }

      case "force":
      default: {
        // Apply force-directed layout with more spacing to reduce edge entanglement
        const centerX = 0
        const centerY = 0
        const radius = Math.min(nodes.length * 50, 800) // Increased radius for more spacing

        // Place nodes in a circle
        positionedNodes.forEach((node: Node, index: number) => {
          if (node.id === mainWalletAddress) {
            // Place main wallet in the center
            node.position = { x: centerX, y: centerY }
          } else {
            // Place other nodes in a circle around the main wallet
            const angle = (index * 2 * Math.PI) / (nodes.length - 1)
            node.position = {
              x: centerX + Math.cos(angle) * radius,
              y: centerY + Math.sin(angle) * radius,
            }
          }
        })

        // Apply force-directed algorithm with stronger repulsion
        for (let iteration = 0; iteration < 100; iteration++) {
          // More iterations for better layout
          // Apply repulsive forces between nodes
          for (let i = 0; i < positionedNodes.length; i++) {
            for (let j = i + 1; j < positionedNodes.length; j++) {
              const nodeA = positionedNodes[i]
              const nodeB = positionedNodes[j]

              const dx = nodeA.position.x - nodeB.position.x
              const dy = nodeA.position.y - nodeB.position.y
              const distance = Math.sqrt(dx * dx + dy * dy)

              if (distance < 1) continue

              const repulsionForce = 5000 / distance // Stronger repulsion

              const forceX = (dx / distance) * repulsionForce
              const forceY = (dy / distance) * repulsionForce

              nodeA.position.x += forceX
              nodeA.position.y += forceY
              nodeB.position.x -= forceX
              nodeB.position.y -= forceY
            }
          }

          // Apply attractive forces for connected nodes
          edges.forEach((edge) => {
            const sourceNode = positionedNodes.find((n: Node) => n.id === edge.source)
            const targetNode = positionedNodes.find((n: Node) => n.id === edge.target)

            if (sourceNode && targetNode) {
              const dx = sourceNode.position.x - targetNode.position.x
              const dy = sourceNode.position.y - targetNode.position.y
              const distance = Math.sqrt(dx * dx + dy * dy)

              if (distance < 1) return

              const attractionForce = distance * 0.005 // Weaker attraction

              const forceX = (dx / distance) * attractionForce
              const forceY = (dy / distance) * attractionForce

              sourceNode.position.x -= forceX
              sourceNode.position.y -= forceY
              targetNode.position.x += forceX
              targetNode.position.y += forceY
            }
          })
        }

        break
      }
    }

    return positionedNodes
  }

  // Get selected node details
  useEffect(() => {
    if (!selectedNode || !graphData) {
      setSelectedNodeDetails(null)
      return
    }

    const node = graphData.nodes.find((n) => n.id === selectedNode)
    setSelectedNodeDetails(node || null)
  }, [selectedNode, graphData])

  return (
    <TooltipProvider>
      <>
        <div className="mb-4 flex flex-wrap gap-2 items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Transaction Flow Visualization</h3>
            <p className="text-sm text-muted-foreground">
              {viewMode === "financial" && "Showing financial flows and transaction values"}
              {viewMode === "temporal" && "Showing transaction timeline and account activity periods"}
              {viewMode === "relationship" && "Showing wallet connections and interaction patterns"}
              {viewMode === "behavioral" && "Showing activity patterns and critical transaction paths"}
              {viewMode === "asset" && "Showing token holdings and balances"}
              {viewMode === "risk" && "Highlighting suspicious transaction patterns"}
              {viewMode === "protocol" && "Showing protocol interactions and smart contract usage"}
            </p>
          </div>

          <div className="flex gap-2">
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => value && setViewMode(value as ViewMode)}
            >
              <ToggleGroupItem value="financial" aria-label="Financial Flow View">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <BarChart3 className="h-4 w-4" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Financial Flow</TooltipContent>
                </Tooltip>
              </ToggleGroupItem>
              <ToggleGroupItem value="temporal" aria-label="Temporal View">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Clock className="h-4 w-4" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Temporal View</TooltipContent>
                </Tooltip>
              </ToggleGroupItem>
              <ToggleGroupItem value="relationship" aria-label="Relationship Network View">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Network className="h-4 w-4" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Relationship Network</TooltipContent>
                </Tooltip>
              </ToggleGroupItem>
              <ToggleGroupItem value="risk" aria-label="Risk Analysis View">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <AlertTriangle className="h-4 w-4" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Risk Analysis</TooltipContent>
                </Tooltip>
              </ToggleGroupItem>
              <ToggleGroupItem value="protocol" aria-label="Protocol Interaction View">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Wallet className="h-4 w-4" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Protocol Interaction</TooltipContent>
                </Tooltip>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <div className="flex flex-col md:flex-row flex-1 gap-4">
          <div
            className="flex-1 border rounded-md overflow-hidden"
            style={{
              height: isMobile ? "calc(100vh - 14rem)" : "calc(100vh - 12rem)",
              minHeight: "500px",
            }}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onEdgeClick={onEdgeClick}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              connectionLineType={ConnectionLineType.SmoothStep}
              defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
              minZoom={0.1}
              maxZoom={2}
              fitView
              fitViewOptions={{ padding: 0.2 }}
            >
              <Background />
              <Controls />
              <MiniMap
                nodeStrokeColor={(n) => {
                  if (n.data?.isMainWallet) return "#3b82f6"
                  if (n.data?.type === "token") return "#10b981"
                  if (n.data?.type === "program") return "#8b5cf6"
                  return "#aaa"
                }}
                nodeColor={(n) => {
                  if (n.data?.isMainWallet) return "#93c5fd"
                  if (n.data?.type === "token") return "#a7f3d0"
                  if (n.data?.type === "program") return "#c4b5fd"
                  return "#f3f4f6"
                }}
              />
              <Panel position="top-right" className="flex flex-col gap-2">
                <div className="bg-white dark:bg-gray-800 p-2 rounded shadow">
                  <div className="text-xs font-medium mb-2">Layout Type</div>
                  <ToggleGroup
                    type="single"
                    value={layoutType}
                    onValueChange={(value) => value && setLayoutType(value as LayoutType)}
                  >
                    <ToggleGroupItem value="force" aria-label="Force Layout">
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
                        className="h-4 w-4"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="4" />
                        <line x1="21.17" y1="8" x2="12" y2="8" />
                        <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
                        <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
                      </svg>
                    </ToggleGroupItem>
                    <ToggleGroupItem value="dagre" aria-label="Dagre Layout">
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
                        className="h-4 w-4"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="3" y1="9" x2="21" y2="9"></line>
                        <line x1="9" y1="21" x2="9" y2="9"></line>
                      </svg>
                    </ToggleGroupItem>
                    <ToggleGroupItem value="linear" aria-label="Linear Layout">
                      <GitCommit className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="hierarchical" aria-label="Hierarchical Layout">
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
                        className="h-4 w-4"
                      >
                        <path d="M3 3v18h18" />
                        <path d="M7 17h.01" />
                        <path d="M11 17h.01" />
                        <path d="M15 17h.01" />
                        <path d="M7 13h.01" />
                        <path d="M11 13h.01" />
                        <path d="M15 13h.01" />
                        <path d="M7 9h.01" />
                        <path d="M11 9h.01" />
                        <path d="M15 9h.01" />
                      </svg>
                    </ToggleGroupItem>
                    <ToggleGroupItem value="temporal" aria-label="Temporal Layout">
                      <Clock className="h-4 w-4" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fitView({ padding: 0.2 })}
                  className="flex items-center gap-1"
                >
                  <ZoomIn className="w-4 h-4" />
                  Fit View
                </Button>
              </Panel>
              <Panel position="bottom-left">
                <div className="bg-white dark:bg-gray-800 p-2 rounded shadow text-xs">
                  <div className="flex items-center mb-1">
                    <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300 mr-1"></div>
                    <span>Wallet</span>
                  </div>
                  <div className="flex items-center mb-1">
                    <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300 mr-1"></div>
                    <span>Token</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-purple-100 border border-purple-300 mr-1"></div>
                    <span>Program</span>
                  </div>
                </div>
              </Panel>
            </ReactFlow>
          </div>

          {!isMobile && (
            <div className="w-80 flex flex-col gap-4">
              {/* Story Insights Panel */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {viewMode === "financial" && "Financial Flow Insights"}
                    {viewMode === "temporal" && "Temporal Insights"}
                    {viewMode === "relationship" && "Network Insights"}
                    {viewMode === "behavioral" && "Behavioral Insights"}
                    {viewMode === "asset" && "Asset Insights"}
                    {viewMode === "risk" && "Risk Analysis"}
                    {viewMode === "protocol" && "Protocol Insights"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2">
                  {storyInsights.map((insight, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-primary"></div>
                      <p>{insight}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Node Details Dialog */}
        <Dialog open={nodeDetailsOpen} onOpenChange={setNodeDetailsOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Node Details</span>
                <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleCopyAddress}>
                  {copiedAddress ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Address
                    </>
                  )}
                </Button>
              </DialogTitle>
              <DialogDescription className="text-xs break-all font-mono">
                {selectedNode}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-6 px-2"
                  onClick={() => openExplorerLink("address", selectedNode || "")}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View on Explorer
                </Button>
              </DialogDescription>
            </DialogHeader>

            {selectedNodeDetails && (
              <Tabs defaultValue="overview" className="w-full flex-1 overflow-hidden flex flex-col">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                  <TabsTrigger value="tokens">Tokens</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4 pt-4 overflow-auto flex-1">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-medium">Type:</div>
                    <div className="capitalize">{selectedNodeDetails.type}</div>

                    <div className="font-medium">First Seen:</div>
                    <div>{formatDate(selectedNodeDetails.firstSeen)}</div>

                    <div className="font-medium">Last Seen:</div>
                    <div>{formatDate(selectedNodeDetails.lastSeen)}</div>

                    <div className="font-medium">Total Inflow:</div>
                    <div className="text-green-600">
                      {selectedNodeDetails.type === "native"
                        ? `${lamportsToSol(selectedNodeDetails.totalInflow)} SOL`
                        : `${selectedNodeDetails.totalInflow.toFixed(2)} units`}
                    </div>

                    <div className="font-medium">Total Outflow:</div>
                    <div className="text-red-600">
                      {selectedNodeDetails.type === "native"
                        ? `${lamportsToSol(selectedNodeDetails.totalOutflow)} SOL`
                        : `${selectedNodeDetails.totalOutflow.toFixed(2)} units`}
                    </div>

                    {selectedNodeDetails.balance !== undefined && (
                      <>
                        <div className="font-medium">Balance:</div>
                        <div>
                          {selectedNodeDetails.type === "native"
                            ? `${lamportsToSol(selectedNodeDetails.balance)} SOL`
                            : `${selectedNodeDetails.balance.toFixed(2)} units`}
                        </div>
                      </>
                    )}

                    <div className="font-medium">Transactions:</div>
                    <div>{selectedNodeDetails.transactions.length}</div>
                  </div>
                </TabsContent>
                <TabsContent value="transactions" className="pt-4 overflow-auto flex-1">
                  <div className="max-h-[60vh] overflow-y-auto space-y-2">
                    {selectedNodeDetails.transactions.map((txSig, idx) => (
                      <div
                        key={idx}
                        className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded flex justify-between items-center"
                      >
                        <div className="font-mono break-all mr-2">{txSig}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 shrink-0"
                          onClick={() => openExplorerLink("transaction", txSig)}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {selectedNodeDetails.transactions.length === 0 && (
                      <div className="text-sm text-center text-muted-foreground py-8">No transactions available</div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="tokens" className="pt-4 overflow-auto flex-1">
                  {selectedNodeDetails.metadata?.tokens ? (
                    <div className="max-h-[60vh] overflow-y-auto space-y-2">
                      {Object.entries(selectedNodeDetails.metadata.tokens).map(([mint, amount], idx) => (
                        <div key={idx} className="flex flex-col text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <div className="flex justify-between items-center">
                            <div>{Number(amount).toFixed(2)} units</div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 shrink-0"
                              onClick={() => openExplorerLink("token", mint)}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="font-mono text-xs truncate text-muted-foreground mt-1">Mint: {mint}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-center text-muted-foreground py-8">No token data available</div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </>
    </TooltipProvider>
  )
}
