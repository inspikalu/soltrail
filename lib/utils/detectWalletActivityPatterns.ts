"use server"

import type { HeliusTransaction } from "@/lib/types/helius";
import type { AddressLabelResponse } from "@/lib/types/blocksec";
import { fetchAddressLabel } from "@/lib/actions/label-actions";

/**
 * Parameters for pattern detection configuration
 */
export interface PatternDetectionParams {
  smallInputThreshold?: number;
  smallInputCountThreshold?: number;
  smallInputTimeWindow?: number;
  tokenDumpPercentage?: number;
  tokenDumpTimeWindow?: number;
}

/**
 * Detected patterns for a wallet
 */
export interface DetectedPatterns {
  hasManySmallInputs: boolean;
  hasSuddenTokenDump: boolean;
  isExchangeLike: boolean;
  patterns: {
    manySmallInputs?: {
      count: number;
      totalAmount: number;
      averageAmount: number;
      timeWindow: string;
    };
    suddenTokenDump?: {
      mint: string;
      percentageDumped: number;
      timeWindow: string;
    };
  };
}

/**
 * Combined wallet analysis result
 */
export interface WalletAnalysisResult {
  label: AddressLabelResponse | null;
  patterns: DetectedPatterns;
}

/**
 * Main analysis function - combines label and pattern detection
 */
export async function analyzeWallet(
  walletAddress: string,
  params: PatternDetectionParams = {}
): Promise<WalletAnalysisResult> {
  console.log("[analyzeWallet] Called with walletAddress:", walletAddress, "params:", params);
  try {
    // Fetch both label and transactions in parallel
    const [label, transactions] = await Promise.all([
      fetchLabel(walletAddress),
      fetchTransactions(walletAddress),
    ]);

    // Detect patterns
    const patterns = detectWalletPatterns(
      walletAddress,
      transactions,
      params,
      label
    );

    return { label, patterns };
  } catch (error) {
    console.error("[analyzeWallet] Error analyzing wallet:", error);
    throw error;
  }
}

/**
 * Fetch label from BlockSec API
 */
async function fetchLabel(
  walletAddress: string
): Promise<AddressLabelResponse | null> {
  try {
    // Use the server action instead of direct fetch
    return await fetchAddressLabel(walletAddress);
  } catch (error) {
    console.warn("Label fetch error:", error);
    return null;
  }
}

/**
 * Fetch transactions from Helius API
 */
async function fetchTransactions(
  walletAddress: string
): Promise<HeliusTransaction[]> {
  const response = await fetch(`/api/transactions?address=${walletAddress}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch transactions: ${response.statusText}`);
  }
  const { transactions } = await response.json();
  return transactions;
}

/**
 * Detect wallet patterns from transactions
 */
function detectWalletPatterns(
  walletAddress: string,
  transactions: HeliusTransaction[],
  params: PatternDetectionParams = {},
  label?: AddressLabelResponse | null
): DetectedPatterns {
  // Ensure all config values are defined (no undefined)
  const {
    smallInputThreshold = 0.1,
    smallInputCountThreshold = 10,
    smallInputTimeWindow = 24,
    tokenDumpPercentage = 90,
    tokenDumpTimeWindow = 1,
  } = params;
  const config = {
    smallInputThreshold,
    smallInputCountThreshold,
    smallInputTimeWindow,
    tokenDumpPercentage,
    tokenDumpTimeWindow,
  };

  const relevantTxs = transactions.filter(
    (tx) =>
      tx.accountData?.some((account) => account.account === walletAddress) ||
      tx.tokenTransfers?.some(
        (transfer) =>
          transfer.fromUserAccount === walletAddress ||
          transfer.toUserAccount === walletAddress
      )
  );

  const manySmallInputs = detectManySmallInputs(
    walletAddress,
    relevantTxs,
    config
  );
  const suddenTokenDump = detectSuddenTokenDump(
    walletAddress,
    relevantTxs,
    config
  );
  const exchangeLike =
    label?.data?.main_entity_info?.categories?.some((c) => c.code === 3011) ||
    detectExchangeLikeBehavior(walletAddress, relevantTxs);

  return {
    hasManySmallInputs: manySmallInputs.detected,
    hasSuddenTokenDump: suddenTokenDump.detected,
    isExchangeLike: exchangeLike,
    patterns: {
      manySmallInputs: manySmallInputs.detected
        ? manySmallInputs.details
        : undefined,
      suddenTokenDump: suddenTokenDump.detected
        ? suddenTokenDump.details
        : undefined,
    },
  };
}

function detectManySmallInputs(
  walletAddress: string,
  transactions: HeliusTransaction[],
  config: Required<PatternDetectionParams>
) {
  const now = Date.now();
  const timeWindowMs = config.smallInputTimeWindow * 60 * 60 * 1000;

  const smallDeposits = transactions.flatMap((tx) =>
    (tx.nativeTransfers || [])
      .filter(
        (transfer) =>
          transfer.toUserAccount === walletAddress &&
          transfer.amount <= config.smallInputThreshold &&
          (tx.timestamp ? now - tx.timestamp * 1000 <= timeWindowMs : true)
      )
      .map((transfer) => ({
        amount: transfer.amount,
        timestamp: tx.timestamp,
        signature: tx.signature,
      }))
  );

  const detected = smallDeposits.length >= config.smallInputCountThreshold;

  if (!detected) return { detected: false };

  const totalAmount = smallDeposits.reduce(
    (sum, deposit) => sum + deposit.amount,
    0
  );
  const averageAmount = totalAmount / smallDeposits.length;

  return {
    detected: true,
    details: {
      count: smallDeposits.length,
      totalAmount,
      averageAmount,
      timeWindow: `${config.smallInputTimeWindow} hours`,
    },
  };
}

function detectSuddenTokenDump(
  walletAddress: string,
  transactions: HeliusTransaction[],
  config: Required<PatternDetectionParams>
) {
  const tokenInflows = new Map<string, number>();
  const tokenOutflows = new Map<string, number>();

  transactions.forEach((tx) => {
    // Process token transfers
    (tx.tokenTransfers || []).forEach((transfer) => {
      if (!transfer.mint || !transfer.tokenAmount) return;

      if (transfer.toUserAccount === walletAddress) {
        tokenInflows.set(
          transfer.mint,
          (tokenInflows.get(transfer.mint) || 0) + transfer.tokenAmount
        );
      }

      if (transfer.fromUserAccount === walletAddress) {
        tokenOutflows.set(
          transfer.mint,
          (tokenOutflows.get(transfer.mint) || 0) + transfer.tokenAmount
        );
      }
    });

    // Process token balance changes
    (tx.accountData || [])
      .filter((account) => account.account === walletAddress)
      .forEach((account) => {
        (account.tokenBalanceChanges || []).forEach((change) => {
          if (!change.mint || !change.rawTokenAmount) return;

          const amount =
            Number.parseFloat(change.rawTokenAmount.tokenAmount) /
            Math.pow(10, change.rawTokenAmount.decimals);
          const isDecrease = amount < 0;

          if (isDecrease) {
            tokenOutflows.set(
              change.mint,
              (tokenOutflows.get(change.mint) || 0) + Math.abs(amount)
            );
          } else {
            tokenInflows.set(
              change.mint,
              (tokenInflows.get(change.mint) || 0) + amount
            );
          }
        });
      });
  });

  for (const [mint, received] of tokenInflows.entries()) {
    const sent = tokenOutflows.get(mint) || 0;
    const percentageDumped = (sent / received) * 100;

    if (percentageDumped >= config.tokenDumpPercentage) {
      const dumpTransactions = transactions
        .filter(
          (tx) =>
            tx.tokenTransfers?.some(
              (t) => t.fromUserAccount === walletAddress && t.mint === mint
            ) ||
            tx.accountData?.some(
              (ad) =>
                ad.account === walletAddress &&
                ad.tokenBalanceChanges?.some(
                  (tbc) =>
                    tbc.mint === mint &&
                    tbc.rawTokenAmount &&
                    Number.parseFloat(tbc.rawTokenAmount.tokenAmount) < 0
                )
            )
        )
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      if (dumpTransactions.length > 0) {
        const firstDump = dumpTransactions[0].timestamp || 0;
        const lastDump =
          dumpTransactions[dumpTransactions.length - 1].timestamp || 0;
        const dumpDurationHours = (lastDump - firstDump) / 3600;

        if (dumpDurationHours <= config.tokenDumpTimeWindow) {
          return {
            detected: true,
            details: {
              mint,
              percentageDumped,
              timeWindow: `${dumpDurationHours.toFixed(2)} hours`,
            },
          };
        }
      }
    }
  }

  return { detected: false };
}

function detectExchangeLikeBehavior(
  walletAddress: string,
  transactions: HeliusTransaction[]
): boolean {
  const recentTxs = transactions
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 100);

  // Check deposit aggregation pattern
  const smallInputs = recentTxs.filter((tx) =>
    tx.nativeTransfers?.some(
      (t) => t.toUserAccount === walletAddress && t.amount <= 0.1
    )
  ).length;

  const largeOutputs = recentTxs.filter((tx) =>
    tx.nativeTransfers?.some(
      (t) => t.fromUserAccount === walletAddress && t.amount >= 10
    )
  ).length;

  // Check withdrawal distribution pattern
  const largeInputs = recentTxs.filter((tx) =>
    tx.nativeTransfers?.some(
      (t) => t.toUserAccount === walletAddress && t.amount >= 10
    )
  ).length;

  const smallOutputs = recentTxs.filter((tx) =>
    tx.nativeTransfers?.some(
      (t) => t.fromUserAccount === walletAddress && t.amount <= 0.1
    )
  ).length;

  return (
    (smallInputs >= 10 && largeOutputs >= 2) ||
    (largeInputs >= 2 && smallOutputs >= 10)
  );
}
