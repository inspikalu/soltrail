"use server"

import axios from "axios"
import type { AddressLabelResponse } from "@/lib/types/blocksec"

const BLOCKSEC_API_URL = "https://aml.blocksec.com/address-label/api/v3/labels"
const BLOCKSEC_API_KEY = process.env.BLOCKSEC_API_KEY

export async function fetchAddressLabel(address: string): Promise<AddressLabelResponse | null> {
  console.log("[fetchAddressLabel] Called with address:", address);
  try {
    // Validate API key
    if (!BLOCKSEC_API_KEY) {
      console.error("BlockSec API key not configured")
      return null
    }

    // Validate address
    if (!address) {
      console.error("Address is required")
      return null
    }

    // Always use Solana chain ID (-3)
    const chainId = -3

    // Make request to BlockSec API
    const response = await axios.post<AddressLabelResponse>(
      BLOCKSEC_API_URL,
      {
        chain_id: chainId,
        address: address,
      },
      {
        headers: {
          "API-KEY": BLOCKSEC_API_KEY,
          "Content-Type": "application/json",
        },
      },
    )

    // Return the response data
    console.log("BlockSec API response:", response.data)
    return response.data
  } catch (error) {
    console.error("[fetchAddressLabel] Error fetching address label:", error);
    return null
  }
}
