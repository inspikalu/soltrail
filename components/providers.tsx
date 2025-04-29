"use client"

import type React from "react"

import { ReactFlowProvider } from "reactflow"

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <ReactFlowProvider>{children}</ReactFlowProvider>
    </div>
  )
}
