// This is a client-side only module
export function createWorker() {
  if (typeof window === "undefined") {
    return null
  }

  // Create a string containing the worker code
  const workerCode = `
    self.onmessage = async function(e) {
      const { transactions, targetAddress, id } = e.data;
      
      try {
        // Import the analyzeFundingSources function
        // In a real implementation, you'd need to include the function code here
        // or use a more sophisticated bundling approach
        const result = await analyzeFundingSources(transactions, targetAddress);
        
        self.postMessage({
          type: 'success',
          id,
          result
        });
      } catch (error) {
        self.postMessage({
          type: 'error',
          id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    };

    // Implement the analyzeFundingSources function
    function analyzeFundingSources(transactions, targetAddress) {
      const EPOCH_START = new Date(0);
      const analysis = {
        primarySource: { address: '', amount: 0, percentage: 0, type: 'UNKNOWN', source: 'UNKNOWN' },
        timeline: [],
        sources: [],
        exchangePercentage: 0,
      };

      try {
        // 1. Filter and process transactions
        const fundingEvents = transactions.filter(tx => 
          tx.accountData?.some(acc => 
            acc.account === targetAddress && 
            (acc.nativeBalanceChange ?? 0) > 0
          )
        );

        // 2. Aggregate sources
        const sourceMap = new Map();

        fundingEvents.forEach(tx => {
          const txDate = tx.timestamp ? new Date(tx.timestamp * 1000) : EPOCH_START;
          const amount = tx.nativeTransfers?.reduce((sum, t) => 
            t.toUserAccount === targetAddress ? sum + t.amount : sum, 0) || 0;

          tx.accountData?.forEach(acc => {
            if (acc.account !== targetAddress && (acc.nativeBalanceChange ?? 0) < 0) {
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
                types: existing.types.add(tx.type || 'UNKNOWN'),
                sources: existing.sources.add(tx.source || 'UNKNOWN'),
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
        const totalFunding = analysis.sources.reduce((sum, s) => sum + s.totalAmount, 0);
        analysis.primarySource = analysis.sources[0] ? {
          address: analysis.sources[0].address,
          amount: analysis.sources[0].totalAmount,
          percentage: (analysis.sources[0].totalAmount / totalFunding) * 100,
          type: analysis.sources[0].type,
          source: 'UNKNOWN',
        } : analysis.primarySource;

        analysis.exchangePercentage = (analysis.sources
          .filter(s => s.isExchange)
          .reduce((sum, s) => sum + s.totalAmount, 0) / totalFunding) * 100;

        // 5. Build timeline
        const dailyMap = new Map();
        fundingEvents.forEach(tx => {
          const date = tx.timestamp ? new Date(tx.timestamp * 1000) : EPOCH_START;
          const dayKey = date.toISOString().split('T')[0];
          
          const amount = tx.nativeTransfers?.reduce((sum, t) => 
            t.toUserAccount === targetAddress ? sum + t.amount : sum, 0) || 0;

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
        console.error('Funding analysis error:', error);
      }

      return analysis;
    }

    // Helper function
    function isKnownExchange(source) {
      const EXCHANGES = new Set([
        'COINBASE',
        'MAGIC_EDEN',
        'OPENSEA',
        'HYPERSPACE',
        'TENSOR',
      ]);
      return EXCHANGES.has(source);
    }

    // Signal that the worker is ready
    self.postMessage({ type: 'ready' });
  `

  // Create a blob URL for the worker
  const blob = new Blob([workerCode], { type: "application/javascript" })
  const url = URL.createObjectURL(blob)

  // Create and return the worker
  return new Worker(url)
}
