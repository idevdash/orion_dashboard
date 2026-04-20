"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Root route: unauthenticated users land here from protected pages.
 * Sends visitors to the operator sign-in surface.
 */
export default function Home() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/admin")
  }, [router])
  return (
    <div className="flex min-h-screen items-center justify-center bg-background font-mono text-xs text-muted-foreground">
      Opening secure access…
    </div>
  )
}
