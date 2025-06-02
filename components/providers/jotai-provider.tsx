"use client"

import { Provider } from "jotai/react"
import type { ReactNode } from "react"

interface JotaiProviderProps {
  children: ReactNode
}

/**
 * Jotai Provider component that ensures a single store instance across the app.
 * This prevents the "multiple Jotai instances" warning and ensures consistent state.
 */
export function JotaiProvider({ children }: JotaiProviderProps) {
  return <Provider>{children}</Provider>
}
