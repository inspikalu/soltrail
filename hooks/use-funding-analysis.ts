"use client"

import { useState, useEffect, useCallback } from "react"
import type { HeliusTransaction } from "@/lib/types/helius"
import type { FundingAnalysisResult } from "@/lib/utils/fundingOriginTracker"
import { createWorker } from "@/lib/workers/worker-factory"

// Define the return type for our hook
interface UseFundingAnalysisReturn {
  result: FundingAnalysisResult | null
  loading: boolean
  error: string | null
  analyze: (transactions: HeliusTransaction[], address: string) => void
}

// Create a unique ID for each worker request
let requestId = 0

export function useFundingAnalysis(): UseFundingAnalysisReturn {
  const [worker, setWorker] = useState<Worker | null>(null)
  const [result, setResult] = useState<FundingAnalysisResult | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingRequests] = useState<Map<number, { resolve: Function; reject: Function }>>(new Map())

  // Initialize the worker
  useEffect(() => {
    if (typeof window === "undefined") return

    // Create the worker
    const analysisWorker = createWorker()
    if (!analysisWorker) return

    // Set up message handling
    analysisWorker.onmessage = (event) => {
      const { type, id, result, error } = event.data

      if (type === "ready") {
        // console.log("Analysis worker is ready")
      } else if (type === "success") {
        // Resolve the promise for this request
        const request = pendingRequests.get(id)
        if (request) {
          request.resolve(result)
          pendingRequests.delete(id)
        }
        setResult(result)
      } else if (type === "error") {
        // Reject the promise for this request
        const request = pendingRequests.get(id)
        if (request) {
          request.reject(new Error(error))
          pendingRequests.delete(id)
        }
        setError(error)
      }
    }

    setWorker(analysisWorker)

    // Clean up the worker when the component unmounts
    return () => {
      analysisWorker.terminate()
    }
  }, [])

  // Function to analyze transactions
  const analyze = useCallback(
    async (transactions: HeliusTransaction[], address: string) => {
      if (!worker) {
        // If worker isn't available, fall back to direct analysis
        try {
          setLoading(true)
          // Import the function dynamically to avoid SSR issues
          const { analyzeFundingSources } = await import("@/lib/utils/fundingOriginTracker")
          const analysisResult = analyzeFundingSources(transactions, address)
          setResult(analysisResult)
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err))
        } finally {
          setLoading(false)
        }
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Create a promise that will be resolved when the worker returns a result
        const id = requestId++
        const resultPromise = new Promise((resolve, reject) => {
          pendingRequests.set(id, { resolve, reject })
        })

        // Send the data to the worker
        worker.postMessage({ transactions, targetAddress: address, id })

        // Wait for the result
        await resultPromise
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    },
    [worker, pendingRequests],
  )

  return { result, loading, error, analyze }
}
