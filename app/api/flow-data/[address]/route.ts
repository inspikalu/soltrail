import axios from "axios"
import { isSolanaAddressOrDomain } from "@/lib/utils"
import type { EnrichedTransaction } from "@/lib/types/transaction-history"

const HELIUS_API_KEY = process.env.HELIUS_API_KEY

/**
 * Fetches transaction history from the Helius API.
 */
async function fetchTransactionHistory(address: string): Promise<EnrichedTransaction[]> {
  console.log("[fetchTransactionHistory] Fetching transaction history for address", address);
  const response = await axios.get<EnrichedTransaction[]>(
    `https://api.helius.xyz/v0/addresses/${address}/transactions`,
    {
      params: { "api-key": HELIUS_API_KEY },
    },
  )
  return response.data
}

/**
 * Handles GET requests for Solana transaction history by address.
 */
export async function GET(request: Request, { params: { address } }: { params: { address: string } }) {
  console.log("[GET /api/flow-data/:address] Incoming request", { address });
  // Check for missing API key
  if (!HELIUS_API_KEY) {
    console.error("[GET /api/flow-data/:address] Helius API key not set");
    return new Response(JSON.stringify({ error: "Helius API key not set in environment" }), { status: 500 })
  }

  // Validate Solana address or domain
  if (!isSolanaAddressOrDomain(address)) {
    console.warn("[GET /api/flow-data/:address] Invalid Solana address", { address });
    return new Response(JSON.stringify({ error: "Invalid Solana address" }), {
      status: 400,
    })
  }

  try {
    // Fetch transaction history using helper function
    const data = await fetchTransactionHistory(address)
    console.log("[GET /api/flow-data/:address] Returning transaction history", { count: data.length });
    return new Response(JSON.stringify({ data }))
  } catch (error: any) {
    // Handle errors from API call
    console.error("[GET /api/flow-data/:address] Error fetching transaction history", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch transaction history",
        details: error?.response?.data || error.message || String(error),
      }),
      { status: 500 },
    )
  }
}
