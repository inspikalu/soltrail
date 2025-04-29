"use server"
// utils/convertTransactionHistorytograph.ts

import { HeliusTransaction } from "../types/helius";

// Define the graph structure interfaces
export interface GraphNode {
  id: string;
  type: "wallet" | "token" | "program"; // Use literal types for better type safety
  balance?: number;
  transactions: string[]; // list of transaction signatures this node participated in
  firstSeen: number; // timestamp
  lastSeen: number; // timestamp
  totalInflow: number;
  totalOutflow: number;
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  value: number; // amount transferred
  timestamp: number;
  signature: string;
  type: "native" | "token" | "instruction"; // Use literal types for better type safety
  fee?: number;
  metadata?: Record<string, any>;
}

export interface TransactionGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    timeRange: { start: number; end: number };
    valueRange: { min: number; max: number };
    criticalPath: string[]; // Edge IDs that form the critical path
    accounts: { [key: string]: number }; // Account balances
    mostActiveAccounts: string[];
    mostActivePrograms: string[];
    tokenMints: string[];
  };
}

export async function convertTransactionHistorytograph(
  walletAddress: string
): Promise<TransactionGraph> {
  console.log("[convertTransactionHistorytograph] Called with walletAddress:", walletAddress);
  try {
    // Validate input
    if (!walletAddress || typeof walletAddress !== "string") {
      throw new Error("Invalid wallet address provided");
    }

    // Fetch transaction history from your API endpoint
    const response = await fetch(
      `/api/transactions?address=${encodeURIComponent(walletAddress)}`
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch transaction history: ${response.statusText}`
      );
    }

    const transactions: { transactions: HeliusTransaction[] } =
      await response.json();

    // Validate the received data
    // console.log(transactions.transactions, typeof transactions);
    if (!Array.isArray(transactions.transactions)) {
      throw new Error("Invalid transaction data received from API");
    }

    return buildGraph(transactions.transactions, walletAddress);
  } catch (error) {
    console.error("[convertTransactionHistorytograph] Error converting transaction history to graph:", error);
    throw error;
  }
}

function buildGraph(
  transactions: HeliusTransaction[],
  mainWalletAddress: string
): TransactionGraph {
  // Validate transactions array
  if (!transactions || !Array.isArray(transactions)) {
    throw new Error("Invalid transaction data");
  }

  // Sort transactions by timestamp
  const sortedTransactions = [...transactions].sort(
    (a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0)
  );

  const nodes: Map<string, GraphNode> = new Map();
  const edges: GraphEdge[] = [];
  const accountBalances: Record<string, number> = {};

  // Initialize with the main wallet
  nodes.set(mainWalletAddress, {
    id: mainWalletAddress,
    type: "wallet",
    transactions: [],
    firstSeen: sortedTransactions[0]?.timestamp || 0,
    lastSeen: sortedTransactions[0]?.timestamp || 0,
    totalInflow: 0,
    totalOutflow: 0,
  });

  // Track transaction values for metadata
  let minValue = Number.MAX_VALUE;
  let maxValue = 0;

  // Process all transactions
  sortedTransactions.forEach((tx) => {
    // Check for required properties
    if (!tx || typeof tx !== "object" || !tx.signature) {
      console.warn("Invalid transaction data encountered, skipping:", tx);
      return;
    }

    // Add transaction to accounts that participated
    const involvedAccounts = new Set<string>();

    // Process native transfers
    if (Array.isArray(tx.nativeTransfers)) {
      tx.nativeTransfers.forEach((transfer, idx) => {
        if (!transfer || !transfer.fromUserAccount || !transfer.toUserAccount) {
          return; // Skip invalid transfers
        }

        const { fromUserAccount, toUserAccount, amount } = transfer;
        const transferAmount = typeof amount === "number" ? amount : 0;

        // Create/update nodes for accounts
        updateOrCreateNode(fromUserAccount, "wallet", tx, -transferAmount);
        updateOrCreateNode(toUserAccount, "wallet", tx, transferAmount);

        // Create edge for this transfer
        const edgeId = `${tx.signature}-native-${idx}`;
        edges.push({
          id: edgeId,
          source: fromUserAccount,
          target: toUserAccount,
          value: transferAmount,
          timestamp: tx.timestamp || 0,
          signature: tx.signature,
          type: "native",
          fee: fromUserAccount === tx.feePayer ? tx.fee || 0 : 0,
          metadata: {
            description: tx.description || "",
            slot: tx.slot || 0,
            type: tx.type || "unknown",
          },
        });

        // Update value range for metadata
        if (transferAmount > 0) {
          minValue = Math.min(minValue, transferAmount);
          maxValue = Math.max(maxValue, transferAmount);
        }

        involvedAccounts.add(fromUserAccount);
        involvedAccounts.add(toUserAccount);
      });
    }

    // Process token transfers
    if (Array.isArray(tx.tokenTransfers)) {
      tx.tokenTransfers.forEach((transfer, idx) => {
        if (
          !transfer ||
          !transfer.fromUserAccount ||
          !transfer.toUserAccount ||
          !transfer.mint
        ) {
          return; // Skip invalid transfers
        }

        const { fromUserAccount, toUserAccount, tokenAmount, mint } = transfer;
        const transferAmount =
          typeof tokenAmount === "number" ? tokenAmount : 0;

        // Create/update nodes for accounts
        updateOrCreateNode(fromUserAccount, "wallet", tx, 0);
        updateOrCreateNode(toUserAccount, "wallet", tx, 0);
        updateOrCreateNode(mint, "token", tx, 0);

        // Create edge for this transfer
        const edgeId = `${tx.signature}-token-${idx}`;
        edges.push({
          id: edgeId,
          source: fromUserAccount,
          target: toUserAccount,
          value: transferAmount,
          timestamp: tx.timestamp || 0,
          signature: tx.signature,
          type: "token",
          metadata: {
            mint,
            description: tx.description || "",
            slot: tx.slot || 0,
            type: tx.type || "unknown",
          },
        });

        // Update value range for metadata (if we can reasonably compare token amounts)
        if (transferAmount > 0) {
          minValue = Math.min(minValue, transferAmount);
          maxValue = Math.max(maxValue, transferAmount);
        }

        involvedAccounts.add(fromUserAccount);
        involvedAccounts.add(toUserAccount);
      });
    }

    // Process program interactions
    if (Array.isArray(tx.instructions)) {
      tx.instructions.forEach((instruction, idx) => {
        if (
          !instruction ||
          !instruction.programId ||
          !Array.isArray(instruction.accounts)
        ) {
          return; // Skip invalid instructions
        }

        const { programId, accounts } = instruction;

        // Create/update nodes for program
        updateOrCreateNode(programId, "program", tx, 0);

        // Create edges for program interactions
        accounts.forEach((account, accIdx) => {
          if (!account) return; // Skip if account is invalid

          updateOrCreateNode(account, "wallet", tx, 0);

          const edgeId = `${tx.signature}-instruction-${idx}-${accIdx}`;
          edges.push({
            id: edgeId,
            source: account,
            target: programId,
            value: 0, // Instruction invocations don't have a direct "value"
            timestamp: tx.timestamp || 0,
            signature: tx.signature,
            type: "instruction",
            metadata: {
              description: tx.description || "",
              slot: tx.slot || 0,
              type: tx.type || "unknown",
            },
          });

          involvedAccounts.add(account);
        });

        involvedAccounts.add(programId);
      });
    }

    // Update account balances
    if (Array.isArray(tx.accountData)) {
      tx.accountData.forEach((data) => {
        if (!data || !data.account) return; // Skip invalid account data

        if (!accountBalances[data.account]) {
          accountBalances[data.account] = 0;
        }

        const balanceChange =
          typeof data.nativeBalanceChange === "number"
            ? data.nativeBalanceChange
            : 0;
        accountBalances[data.account] += balanceChange;

        // Update token balances if needed
        if (Array.isArray(data.tokenBalanceChanges)) {
          data.tokenBalanceChanges.forEach((change) => {
            if (
              !change ||
              !change.userAccount ||
              !change.mint ||
              !change.rawTokenAmount ||
              typeof change.rawTokenAmount !== "object"
            ) {
              return; // Skip invalid token balance changes
            }

            const node = nodes.get(change.userAccount);
            if (node) {
              if (!node.metadata) node.metadata = {};
              if (!node.metadata.tokens) node.metadata.tokens = {};

              const tokenAmount =
                typeof change.rawTokenAmount.tokenAmount === "string"
                  ? change.rawTokenAmount.tokenAmount
                  : "0";
              const decimals =
                typeof change.rawTokenAmount.decimals === "number"
                  ? change.rawTokenAmount.decimals
                  : 0;

              node.metadata.tokens[change.mint] =
                (node.metadata.tokens[change.mint] || 0) +
                Number(tokenAmount) / 10 ** decimals;
            }
          });
        }
      });
    }
  });

  // Set the calculated balances to nodes
  for (const [address, balance] of Object.entries(accountBalances)) {
    const node = nodes.get(address);
    if (node) {
      node.balance = balance;
    }
  }

  // Calculate critical path - the chain of transactions with the highest cumulative value
  const criticalPath = calculateCriticalPath(edges, mainWalletAddress);

  // Generate metadata
  const timeRange = {
    start:
      sortedTransactions.length > 0 ? sortedTransactions[0]?.timestamp || 0 : 0,
    end:
      sortedTransactions.length > 0
        ? sortedTransactions[sortedTransactions.length - 1]?.timestamp || 0
        : 0,
  };

  // Get most active accounts (by transaction count)
  const accountActivity = Array.from(nodes.values())
    .filter((node) => node.type === "wallet")
    .sort((a, b) => b.transactions.length - a.transactions.length)
    .slice(0, 10)
    .map((node) => node.id);

  // Get most active programs
  const programActivity = Array.from(nodes.values())
    .filter((node) => node.type === "program")
    .sort((a, b) => b.transactions.length - a.transactions.length)
    .slice(0, 10)
    .map((node) => node.id);

  // Get list of token mints
  const tokenMints = Array.from(nodes.values())
    .filter((node) => node.type === "token")
    .map((node) => node.id);

  return {
    nodes: Array.from(nodes.values()),
    edges,
    metadata: {
      timeRange,
      valueRange: {
        min: minValue === Number.MAX_VALUE ? 0 : minValue,
        max: maxValue,
      },
      criticalPath,
      accounts: accountBalances,
      mostActiveAccounts: accountActivity,
      mostActivePrograms: programActivity,
      tokenMints,
    },
  };

  // Helper function to update existing node or create a new one
  function updateOrCreateNode(
    id: string,
    type: "wallet" | "token" | "program",
    tx: HeliusTransaction,
    valueChange: number
  ): void {
    if (!id) return; // Skip if ID is empty or undefined

    let node = nodes.get(id);

    if (!node) {
      node = {
        id,
        type,
        transactions: [],
        firstSeen: tx.timestamp || 0,
        lastSeen: tx.timestamp || 0,
        totalInflow: valueChange > 0 ? valueChange : 0,
        totalOutflow: valueChange < 0 ? -valueChange : 0,
      };
      nodes.set(id, node);
    } else {
      node.lastSeen = Math.max(node.lastSeen, tx.timestamp || 0);
      if (valueChange > 0) {
        node.totalInflow += valueChange;
      } else if (valueChange < 0) {
        node.totalOutflow += -valueChange;
      }
    }

    if (tx.signature && !node.transactions.includes(tx.signature)) {
      node.transactions.push(tx.signature);
    }
  }
}

// Calculate the critical path - the chain of transactions with highest combined value
function calculateCriticalPath(
  edges: GraphEdge[],
  startAddress: string
): string[] {
  // Validate inputs
  if (!Array.isArray(edges) || !startAddress) {
    return [];
  }

  // Group edges by source
  const outgoingEdges: Record<string, GraphEdge[]> = {};

  edges.forEach((edge) => {
    if (!edge.source) return; // Skip edges with invalid source

    if (!outgoingEdges[edge.source]) {
      outgoingEdges[edge.source] = [];
    }
    outgoingEdges[edge.source].push(edge);
  });

  // We'll use a simple approach - find the highest value outgoing path from each node
  const visited = new Set<string>();
  const pathEdges: string[] = [];

  function dfs(currentAddress: string, depth = 0): number {
    // Prevent infinite loops and limit depth
    if (!currentAddress || visited.has(currentAddress) || depth > 20) return 0;
    visited.add(currentAddress);

    // Get outgoing edges
    const currentEdges = outgoingEdges[currentAddress] || [];
    if (currentEdges.length === 0) return 0;

    // Find edge with highest value
    let maxEdge: GraphEdge | null = null;
    let maxPathValue = 0;

    for (const edge of currentEdges) {
      // Skip edges with no value or no target
      if (!edge.target || edge.value <= 0) continue;

      const pathValue = edge.value + dfs(edge.target, depth + 1);

      if (pathValue > maxPathValue) {
        maxPathValue = pathValue;
        maxEdge = edge;
      }
    }

    // Add the highest value edge to our path
    if (maxEdge && maxEdge.id) {
      pathEdges.push(maxEdge.id);
      return maxPathValue;
    }

    return 0;
  }

  dfs(startAddress);

  return pathEdges;
}
