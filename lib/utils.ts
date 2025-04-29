import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string, length = 4): string {
  if (!address) return ""
  return `${address.slice(0, length)}...${address.slice(-length)}`
}

export function formatAmount(amount: number, decimals = 9): string {
  if (isNaN(amount)) return "0"

  const value = amount / Math.pow(10, decimals)

  if (value < 0.001) return "<0.001"
  if (value < 1) return value.toFixed(3)
  if (value < 1000) return value.toFixed(2)
  if (value < 1000000) return `${(value / 1000).toFixed(2)}K`

  return `${(value / 1000000).toFixed(2)}M`
}

export function formatDate(timestamp: number): string {
  if (!timestamp) return "N/A"

  const date = new Date(timestamp)
  return date.toLocaleDateString()
}

export function getTransactionTypeColor(type: string): string {
  switch (type) {
    case "TRANSFER":
      return "bg-blue-500"
    case "SWAP":
      return "bg-purple-500"
    case "NFT_SALE":
      return "bg-green-500"
    default:
      return "bg-gray-500"
  }
}

export function isSolanaAddressOrDomain(address: string): boolean {
  // Check if it's a Solana address (base58 string of length 32-44)
  const isSolanaAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)

  // Check if it's a domain (.sol or SNS domain)
  const isDomain = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.(sol|sns)$/.test(address)

  return isSolanaAddress || isDomain
}

/**
 * Convert lamports to SOL with optional decimal formatting
 * @param lamports - Can be number, string, or bigint
 * @param decimals - Number of decimal places to round to (default: 9)
 * @returns Number or string representation in SOL
 */
export function lamportsToSol(lamports: number | string | bigint, decimals = 9): number | string {
  // Handle different input types
  const numericLamports =
    typeof lamports === "bigint"
      ? Number(lamports)
      : typeof lamports === "string"
        ? Number.parseFloat(lamports)
        : lamports

  // Validate input
  if (isNaN(numericLamports)) {
    throw new Error("Invalid lamports value")
  }

  // Conversion calculation
  const sol = numericLamports / 1_000_000_000

  // Return formatted value
  return decimals >= 0 ? Number.parseFloat(sol.toFixed(decimals)) : sol
}
