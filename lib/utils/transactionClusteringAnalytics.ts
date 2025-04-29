"use server";

import {
  TransactionType,
  NFTEventType,
  TransactionSource,
  NFTEventSource,
  NativeTransfer,
  TokenTransfer,
  TokenBalanceChange,
  AccountData,
  Instruction,
  NFTDetail,
  NFTEvent,
  SwapEvent,
  CompressedEvent,
  HeliusTransaction,
} from "../types/helius";

interface ClusterPattern {
  commonAddresses: string[];
  transactionSignatures: string[];
  walletInvolvement: string[];
  totalValue: number;
  activityType: string[];
}

interface WalletAssociation {
  wallet: string;
  connectedWallets: Map<
    string,
    { count: number; lastInteraction: Date; types: Set<string> }
  >;
  totalVolume: number;
}

interface AnomalyDetection {
  highValueTransactions: HeliusTransaction[];
  newCounterparties: string[];
  rapidSuccession: HeliusTransaction[];
  mixerPatterns: HeliusTransaction[];
  failedTransactions: HeliusTransaction[];
}

export interface TransactionAnalysis {
  clusters: ClusterPattern[];
  walletMap: Map<string, WalletAssociation>;
  anomalies: AnomalyDetection;
}

const ANOMALY_THRESHOLDS = {
  HIGH_VALUE: 1000,
  RAPID_SUCCESSION: 60 * 1000,
  MIXER_THRESHOLD: 10,
  NEW_COUNTERPARTY_WINDOW: 30 * 24 * 60 * 60 * 1000,
};

export async function analyzeTransactions(
  transactions: HeliusTransaction[]
): Promise<TransactionAnalysis> {
  console.log(
    "[analyzeTransactions] Called with transactions count:",
    transactions.length
  );
  const clusters: ClusterPattern[] = [];
  const walletMap = new Map<string, WalletAssociation>();
  const anomalies: AnomalyDetection = {
    highValueTransactions: [],
    newCounterparties: [],
    rapidSuccession: [],
    mixerPatterns: [],
    failedTransactions: [],
  };

  const addressClusterMap = new Map<string, number>();
  const signatureTimestamps = new Map<string, number>();
  let clusterIndex = 0;

  transactions.forEach((tx, index) => {
    if (tx.transactionError) anomalies.failedTransactions.push(tx);

    const involvedAddresses = new Set<string>();
    let txTotalValue = 0;

    tx.nativeTransfers?.forEach((transfer) => {
      involvedAddresses.add(transfer.fromUserAccount);
      involvedAddresses.add(transfer.toUserAccount);
      txTotalValue += transfer.amount;
      updateWalletAssociations(
        walletMap,
        transfer.fromUserAccount,
        transfer.toUserAccount,
        tx
      );
    });

    tx.tokenTransfers?.forEach((transfer) => {
      if (transfer.fromUserAccount)
        involvedAddresses.add(transfer.fromUserAccount);
      if (transfer.toUserAccount) involvedAddresses.add(transfer.toUserAccount);
      if (transfer.tokenAmount) txTotalValue += transfer.tokenAmount;
      if (transfer.fromUserAccount && transfer.toUserAccount) {
        updateWalletAssociations(
          walletMap,
          transfer.fromUserAccount,
          transfer.toUserAccount,
          tx
        );
      }
    });

    tx.accountData?.forEach((account) => {
      if (account.tokenBalanceChanges) {
        account.tokenBalanceChanges.forEach((change) => {
          if (change.userAccount) involvedAddresses.add(change.userAccount);
        });
      }
    });

    detectValueAnomalies(anomalies, tx, txTotalValue, index, transactions);
    detectBehaviorAnomalies(anomalies, tx, involvedAddresses, walletMap);

    const clusterKeys = Array.from(involvedAddresses);
    const existingCluster = findExistingCluster(clusterKeys, addressClusterMap);

    if (existingCluster !== -1) {
      updateCluster(clusters[existingCluster], tx, clusterKeys);
    } else {
      createNewCluster(
        clusters,
        addressClusterMap,
        clusterIndex++,
        tx,
        clusterKeys
      );
    }

    if (tx.timestamp) signatureTimestamps.set(tx.signature, tx.timestamp);
  });

  analyzeTemporalPatterns(anomalies, transactions, signatureTimestamps);

  return { clusters, walletMap, anomalies };
}

function updateWalletAssociations(
  walletMap: Map<string, WalletAssociation>,
  from: string,
  to: string,
  tx: HeliusTransaction
): void {
  const updateConnection = (wallet: string, counterparty: string) => {
    if (!walletMap.has(wallet)) {
      walletMap.set(wallet, {
        wallet,
        connectedWallets: new Map(),
        totalVolume: 0,
      });
    }

    const association = walletMap.get(wallet)!;
    association.totalVolume += tx.fee;

    const connection = association.connectedWallets.get(counterparty) || {
      count: 0,
      lastInteraction: new Date(tx.timestamp || Date.now()),
      types: new Set<string>(),
    };

    connection.count++;
    connection.lastInteraction = new Date(tx.timestamp || Date.now());
    if (tx.type) connection.types.add(tx.type);
    association.connectedWallets.set(counterparty, connection);
  };

  updateConnection(from, to);
  updateConnection(to, from);
}

function detectValueAnomalies(
  anomalies: AnomalyDetection,
  tx: HeliusTransaction,
  txTotalValue: number,
  index: number,
  allTx: HeliusTransaction[]
): void {
  if (txTotalValue > ANOMALY_THRESHOLDS.HIGH_VALUE) {
    anomalies.highValueTransactions.push(tx);
  }

  if (index > 0) {
    const prevTx = allTx[index - 1];
    const currentTimestamp = tx.timestamp;
    const prevTimestamp = prevTx.timestamp;

    if (currentTimestamp !== undefined && prevTimestamp !== undefined) {
      const timeDiff = currentTimestamp - prevTimestamp;
      if (timeDiff < ANOMALY_THRESHOLDS.RAPID_SUCCESSION) {
        anomalies.rapidSuccession.push(tx);
      }
    }
  }
}

function detectBehaviorAnomalies(
  anomalies: AnomalyDetection,
  tx: HeliusTransaction,
  involvedAddresses: Set<string>,
  walletMap: Map<string, WalletAssociation>
): void {
  involvedAddresses.forEach((address) => {
    const wallet = walletMap.get(address);
    if (wallet) {
      involvedAddresses.forEach((otherAddress) => {
        if (
          address !== otherAddress &&
          !wallet.connectedWallets.has(otherAddress) &&
          isNewCounterparty(wallet, otherAddress)
        ) {
          anomalies.newCounterparties.push(otherAddress);
        }
      });
    }
  });

  if (
    (tx.nativeTransfers?.length || 0) > ANOMALY_THRESHOLDS.MIXER_THRESHOLD &&
    tx.fee < ANOMALY_THRESHOLDS.HIGH_VALUE
  ) {
    anomalies.mixerPatterns.push(tx);
  }
}

function isNewCounterparty(
  wallet: WalletAssociation,
  counterparty: string
): boolean {
  const connection = wallet.connectedWallets.get(counterparty);
  if (!connection) return true;

  const age = Date.now() - connection.lastInteraction.getTime();
  return age > ANOMALY_THRESHOLDS.NEW_COUNTERPARTY_WINDOW;
}

function findExistingCluster(
  clusterKeys: string[],
  addressClusterMap: Map<string, number>
): number {
  const clusters = new Set<number>();

  clusterKeys.forEach((key) => {
    if (addressClusterMap.has(key)) {
      clusters.add(addressClusterMap.get(key)!);
    }
  });

  return clusters.size === 0 ? -1 : Math.min(...Array.from(clusters));
}

function updateCluster(
  cluster: ClusterPattern,
  tx: HeliusTransaction,
  clusterKeys: string[]
): void {
  cluster.transactionSignatures.push(tx.signature);
  cluster.totalValue += tx.fee;
  if (tx.type) cluster.activityType.push(tx.type);

  clusterKeys.forEach((key) => {
    if (!cluster.commonAddresses.includes(key)) {
      cluster.commonAddresses.push(key);
    }
  });
}

function createNewCluster(
  clusters: ClusterPattern[],
  addressClusterMap: Map<string, number>,
  clusterIndex: number,
  tx: HeliusTransaction,
  clusterKeys: string[]
): void {
  const newCluster: ClusterPattern = {
    commonAddresses: clusterKeys,
    transactionSignatures: [tx.signature],
    walletInvolvement: clusterKeys,
    totalValue: tx.fee,
    activityType: tx.type ? [tx.type] : [],
  };

  clusters.push(newCluster);
  clusterKeys.forEach((key) => addressClusterMap.set(key, clusterIndex));
}

function analyzeTemporalPatterns(
  anomalies: AnomalyDetection,
  transactions: HeliusTransaction[],
  signatureTimestamps: Map<string, number>
): void {
  const timeSorted = [...transactions].sort(
    (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
  );

  timeSorted.forEach((tx, i) => {
    if (i > 0) {
      const prev = timeSorted[i - 1];
      if (
        tx.timestamp &&
        prev.timestamp &&
        tx.timestamp - prev.timestamp < ANOMALY_THRESHOLDS.RAPID_SUCCESSION
      ) {
        anomalies.rapidSuccession.push(tx);
      }
    }
  });
}

export async function formatAnalysisResults(analysis: TransactionAnalysis) {
  return {
    clusters: analysis.clusters.map((c) => ({
      addresses: c.commonAddresses,
      transactions: c.transactionSignatures.length,
      totalValue: c.totalValue,
      types: [...new Set(c.activityType)],
    })),
    wallets: Array.from(analysis.walletMap.values()).map((w) => ({
      wallet: w.wallet,
      connections: Array.from(w.connectedWallets.entries()).map(
        ([addr, data]) => ({
          address: addr,
          count: data.count,
          lastInteraction: data.lastInteraction,
          types: [...data.types],
        })
      ),
      totalVolume: w.totalVolume,
    })),
    anomalies: {
      highValueCount: analysis.anomalies.highValueTransactions.length,
      newCounterparties: [...new Set(analysis.anomalies.newCounterparties)],
      rapidSuccessionCount: analysis.anomalies.rapidSuccession.length,
      mixerPatternsCount: analysis.anomalies.mixerPatterns.length,
      failedTransactionsCount: analysis.anomalies.failedTransactions.length,
    },
  };
}

export type FormattedAnalysis = {
  clusters: {
      addresses: string[];
      transactions: number;
      totalValue: number;
      types: string[];
  }[];
  wallets: {
      wallet: string;
      connections: {
          address: string;
          count: number;
          lastInteraction: Date;
          types: string[];
      }[];
      totalVolume: number;
  }[];
  anomalies: {
    highValueCount: number;
    newCounterparties: string[];
    rapidSuccessionCount: number;
    mixerPatternsCount: number;
    failedTransactionsCount: number;
};
};
