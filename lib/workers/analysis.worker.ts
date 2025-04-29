import { analyzeFundingSources } from "../utils/fundingOriginTracker"

// Define the worker context
const ctx: Worker = self as any

// Listen for messages from the main thread
ctx.addEventListener("message", (event) => {
  const { transactions, targetAddress, id } = event.data

  try {
    // Process the data using the analyzeFundingSources function
    const result = analyzeFundingSources(transactions, targetAddress)

    // Send the result back to the main thread
    ctx.postMessage({
      type: "success",
      id,
      result,
    })
  } catch (error) {
    // Send any errors back to the main thread
    ctx.postMessage({
      type: "error",
      id,
      error: error instanceof Error ? error.message : String(error),
    })
  }
})

// Signal that the worker is ready
ctx.postMessage({ type: "ready" })
