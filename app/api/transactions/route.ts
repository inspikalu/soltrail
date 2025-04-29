// app/api/transactions/route.ts
import axios from "axios"
import { type NextRequest, NextResponse } from "next/server"
import type { HeliusTransaction } from "@/lib/types/helius"

const HELIUS_API_KEY = process.env.HELIUS_API_KEY 
const BASE_URL = "https://api.helius.xyz/v0"

export async function GET(request: NextRequest) {
  console.log("[GET /api/transactions] Incoming request", { url: request.url });
  if (!HELIUS_API_KEY) return NextResponse.json({ message: "No API key specified" }, { status: 500 })

  // In production, request.url may be relative, so provide a base URL
  const { searchParams } = new URL(request.url, `https://${request.headers.get("host")}`)
  const address = searchParams.get("address")

  if (!address) {
    console.warn("[GET /api/transactions] Missing address parameter");
    return NextResponse.json({ error: "Address parameter is required" }, { status: 400 })
  }

  try {
    const signatures = await getSignaturesForAddress(address)
    const transactions: HeliusTransaction[] = await fetchTransactionsWithRetry(signatures)
    console.log("[GET /api/transactions] Returning transactions", { count: transactions.length })
    return NextResponse.json({ transactions })
  } catch (error) {
    console.error("[GET /api/transactions] Error fetching transactions:", error)
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}

async function getSignaturesForAddress(address: string): Promise<string[]> {
  console.log("[getSignaturesForAddress] Fetching signatures for address", address);
  try {
    const response = await axios.post(
      `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
      {
        jsonrpc: "2.0",
        id: 1,
        method: "getSignaturesForAddress",
        params: [address],
      },
      { headers: { "Content-Type": "application/json" } },
    )
    return response.data.result?.map((tx: { signature: string }) => tx.signature) || []
  } catch (error) {
    console.error("[getSignaturesForAddress] Error fetching signatures:", error)
    return []
  }
}

async function fetchTransactionsWithRetry(signatures: string[], batchSize = 50, retries = 2): Promise<any[]> {
  console.log("[fetchTransactionsWithRetry] Fetching transactions for signatures", { count: signatures.length });
  let missing = [...signatures]
  const transactions: any[] = []

  for (let attempt = 0; attempt <= retries; attempt++) {
    const batches = Array.from({ length: Math.ceil(missing.length / batchSize) }, (_, i) =>
      missing.slice(i * batchSize, (i + 1) * batchSize),
    )

    const results = await Promise.all(
      batches.map(async (batch) => {
        // console.log("batch is an array:", Array.isArray(batch)) //in the console this returns true
        try {
          const { data } = await axios.post(
            `${BASE_URL}/transactions`,
            {
              transactions: batch,
            },
            {
              params: { "api-key": HELIUS_API_KEY },
            },
          )
          return data
        } catch (error: any) {
          // console.log(error.response)
          // console.error("Batch error:", error.response?.data || error.message)
          return []
        }
      }),
    )

    const found = results.flat()
    // console.log(found)
    transactions.push(...found)

    // Update missing signatures
    const foundSigs = new Set(found.map((tx) => tx.signature))
    missing = missing.filter((sig) => !foundSigs.has(sig))

    if (missing.length === 0) break
    if (attempt < retries) await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
  }

  return transactions
}
