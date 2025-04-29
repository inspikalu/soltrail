"use server"

// lib/utils/fundingOriginTracker.ts
import type { HeliusTransaction } from "@/lib/types/helius";
import { TransactionType, TransactionSource } from "@/lib/types/helius";

export type FundingAnalysisResult = {
  primarySource: {
    address: string;
    amount: number;
    percentage: number;
    type: TransactionType;
    source: TransactionSource;
  };
  timeline: Array<{
    date: Date;
    cumulativeAmount: number;
    count: number;
  }>;
  sources: Array<{
    address: string;
    totalAmount: number;
    firstContact: Date;
    lastContact: Date;
    type: TransactionType;
    isExchange: boolean;
  }>;
  exchangePercentage: number;
};

export async function analyzeFundingSources(
  transactions: HeliusTransaction[],
  targetAddress: string
): Promise<FundingAnalysisResult> {
  console.log("[analyzeFundingSources] Called with targetAddress:", targetAddress, "transactions count:", transactions.length);
  const EPOCH_START = new Date(0);
  const analysis: FundingAnalysisResult = {
    primarySource: {
      address: "",
      amount: 0,
      percentage: 0,
      type: TransactionType.UNKNOWN,
      source: TransactionSource.UNKNOWN,
    },
    timeline: [],
    sources: [],
    exchangePercentage: 0,
  };

  try {
    // 1. Filter and process transactions
    const fundingEvents = transactions.filter((tx) =>
      tx.accountData?.some(
        (acc) =>
          acc.account === targetAddress && (acc.nativeBalanceChange ?? 0) > 0
      )
    );

    // 2. Aggregate sources
    const sourceMap = new Map<
      string,
      {
        total: number;
        first: Date;
        last: Date;
        types: Set<TransactionType>;
        sources: Set<TransactionSource>;
      }
    >();

    fundingEvents.forEach((tx) => {
      const txDate = tx.timestamp ? new Date(tx.timestamp * 1000) : EPOCH_START;
      const amount =
        tx.nativeTransfers?.reduce(
          (sum, t) =>
            t.toUserAccount === targetAddress ? sum + t.amount : sum,
          0
        ) || 0;

      tx.accountData?.forEach((acc) => {
        if (
          acc.account !== targetAddress &&
          (acc.nativeBalanceChange ?? 0) < 0
        ) {
          const existing = sourceMap.get(acc.account) || {
            total: 0,
            first: txDate,
            last: txDate,
            types: new Set(),
            sources: new Set(),
          };

          sourceMap.set(acc.account, {
            total: existing.total + amount,
            first: txDate < existing.first ? txDate : existing.first,
            last: txDate > existing.last ? txDate : existing.last,
            types: existing.types.add(tx.type || TransactionType.UNKNOWN),
            sources: existing.sources.add(
              tx.source || TransactionSource.UNKNOWN
            ),
          });
        }
      });
    });

    // 3. Convert map to sorted array
    analysis.sources = Array.from(sourceMap.entries())
      .map(([address, data]) => ({
        address,
        totalAmount: data.total,
        firstContact: data.first,
        lastContact: data.last,
        type: Array.from(data.types)[0],
        isExchange: Array.from(data.sources).some(isKnownExchange),
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    // 4. Calculate metrics
    const totalFunding = analysis.sources.reduce(
      (sum, s) => sum + s.totalAmount,
      0
    );
    analysis.primarySource = analysis.sources[0]
      ? {
          address: analysis.sources[0].address,
          amount: analysis.sources[0].totalAmount,
          percentage: (analysis.sources[0].totalAmount / totalFunding) * 100,
          type: analysis.sources[0].type,
          source: TransactionSource.UNKNOWN, // You'd need source per transaction
        }
      : analysis.primarySource;

    analysis.exchangePercentage =
      (analysis.sources
        .filter((s) => s.isExchange)
        .reduce((sum, s) => sum + s.totalAmount, 0) /
        totalFunding) *
      100;

    // 5. Build timeline
    const dailyMap = new Map<string, { amount: number; count: number }>();
    fundingEvents.forEach((tx) => {
      const date = tx.timestamp ? new Date(tx.timestamp * 1000) : EPOCH_START;
      const dayKey = date.toISOString().split("T")[0];

      const amount =
        tx.nativeTransfers?.reduce(
          (sum, t) =>
            t.toUserAccount === targetAddress ? sum + t.amount : sum,
          0
        ) || 0;

      dailyMap.set(dayKey, {
        amount: (dailyMap.get(dayKey)?.amount || 0) + amount,
        count: (dailyMap.get(dayKey)?.count || 0) + 1,
      });
    });

    analysis.timeline = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date: new Date(date),
        cumulativeAmount: data.amount,
        count: data.count,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  } catch (error) {
    console.error("[analyzeFundingSources] Funding analysis error:", error);
  }

  return analysis;
}

// Helper type guard
function isKnownExchange(source: TransactionSource): boolean {
  const EXCHANGES = new Set([
    TransactionSource.COINBASE,
    TransactionSource.MAGIC_EDEN,
    TransactionSource.OPENSEA,
    TransactionSource.HYPERSPACE,
    TransactionSource.TENSOR,
  ]);
  return EXCHANGES.has(source);
}
