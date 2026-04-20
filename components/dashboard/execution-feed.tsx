"use client"

import { CheckCircle2, Clock } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

// Tell TypeScript to expect an array of 'logs' from page.tsx
interface ExecutionFeedProps {
  logs: any[];
}

export function ExecutionFeed({ logs }: ExecutionFeedProps) {
  
  // Helper to format Supabase created_at timestamp
  const formatTime = (dateString: string) => {
    if (!dateString) return "Just now"
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Calculate real totals based on the feed
  const totalClosures = logs.length;
  const cumulativeProfit = logs.reduce((sum, log) => sum + Number(log.profit || 0), 0);

  return (
    <div className="flex h-full flex-col rounded-xl border border-border/50 bg-card">
      <div className="flex items-center justify-between border-b border-border/50 p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex h-3 w-3 items-center justify-center">
            <div className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--orion-belt)] opacity-40" />
            <div className="relative inline-flex h-2 w-2 rounded-full bg-[var(--orion-belt)]" />
          </div>
          <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Profit Pulse
          </h3>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          Live Execution Feed
        </span>
      </div>
      
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2 py-4">
          {logs.length === 0 ? (
             <div className="text-center text-muted-foreground text-sm mt-10 font-mono">WAITING FOR LOOP CLOSURES...</div>
          ) : (
            logs.map((log, index) => (
              <div
                key={log.id || index}
                className="group flex items-center justify-between rounded-lg border border-border/30 bg-secondary/30 px-4 py-3 transition-all hover:border-emerald/30 hover:bg-emerald/5"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      <span className="font-mono">{log.pair}</span>
                      <span className="ml-2 text-muted-foreground">Loop Closed</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm font-semibold text-emerald">
                    +${Number(log.profit).toFixed(2)}
                  </span>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span className="font-mono text-xs">{formatTime(log.created_at)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      {/* Real Summary Footer */}
      <div className="border-t border-border/50 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Session Closures</span>
          <span className="font-mono font-medium text-foreground">
            {totalClosures} loops
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Session Profit</span>
          <span className="font-mono font-semibold text-emerald">
            +${cumulativeProfit.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  )
}