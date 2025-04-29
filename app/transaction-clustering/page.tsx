"use client";

import type React from "react";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  analyzeTransactions,
  formatAnalysisResults,
  type FormattedAnalysis,
} from "@/lib/utils/transactionClusteringAnalytics";
import { ClusterVisualization } from "@/components/transaction-clustering/cluster-visualization";
import { WalletNetwork } from "@/components/transaction-clustering/wallet-network";
import { AnomalyDetection } from "@/components/transaction-clustering/anomaly-detection";
import { TransactionClusters } from "@/components/transaction-clustering/transaction-clusters";
import { isSolanaAddressOrDomain } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TransactionClusteringPage() {
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] =
    useState<FormattedAnalysis | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Input validation
    if (!address.trim()) {
      setError("Please enter a wallet address");
      return;
    }

    if (!isSolanaAddressOrDomain(address)) {
      setError("Please enter a valid Solana address or domain");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch transaction data
      const response = await fetch(
        `/api/transactions?address=${encodeURIComponent(address)}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.transactions || data.transactions.length === 0) {
        setError("No transactions found for this address");
        setIsLoading(false);
        return;
      }

      // 1. Perform analysis
      const rawAnalysis = await analyzeTransactions(data.transactions);

      // 2. Format results
      const formattedResults = await formatAnalysisResults(rawAnalysis);

      setAnalysisResults(formattedResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 flex flex-col min-h-[calc(100vh-3.5rem)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Transaction Clustering
        </h1>
        <p className="text-muted-foreground">
          Analyze transaction patterns to identify clusters and detect
          anomalies.
        </p>
      </div>

      <div className="mb-6">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-2"
        >
          <Input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter wallet address"
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Clusters"
            )}
          </Button>
        </form>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysisResults ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AnomalyDetection anomalies={analysisResults.anomalies} />
          </div>

          {/* Tabs for different visualizations */}
          <Tabs defaultValue="visualizations" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
              <TabsTrigger value="clusters">Cluster Details</TabsTrigger>
            </TabsList>

            <TabsContent value="visualizations" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ClusterVisualization clusters={analysisResults.clusters} />
                <WalletNetwork wallets={analysisResults.wallets} />
              </div>
            </TabsContent>

            <TabsContent value="clusters">
              <TransactionClusters clusters={analysisResults.clusters} />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        !isLoading && (
          <div className="flex-1 flex items-center justify-center bg-muted/20 rounded-lg">
            <div className="text-center p-8">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg max-w-md mx-auto">
                <Info className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Analyze Transaction Clusters
                </h3>
                <p className="text-muted-foreground mb-4">
                  Enter a Solana wallet address to analyze transaction clusters
                  and detect anomalies.
                </p>
                <div className="text-sm text-muted-foreground text-left">
                  <p className="mb-2">Try these example addresses:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <code className="text-xs bg-muted p-1 rounded">
                        CGPaEBbfLsCkytE9oA9GhL6zK3GksLin8WjD8zRwGJi5
                      </code>
                    </li>
                    <li>
                      <code className="text-xs bg-muted p-1 rounded">
                        DQyrF9xYv6wJRXmXXE2NJ6YHYvCBG5hSxMJbcVmhPTKc
                      </code>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
