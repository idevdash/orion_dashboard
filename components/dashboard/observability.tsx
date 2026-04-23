"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { Activity, ShieldAlert, Zap, BarChart3 } from "lucide-react"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface GKCardProps {
  title: string
  count: number
  description: string
  color: string
}

function GKCard({ title, count, description, color }: GKCardProps) {
  return (
    <div className="neu-pressed p-4 rounded-lg border-l-2" style={{ borderLeftColor: color }}>
      <div className="flex justify-between items-start mb-3">
        <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">{title}</span>
        <span className="font-mono text-xl font-bold" style={{ color }}>{count}</span>
      </div>
      <p className="text-[10px] font-mono leading-relaxed text-white/30">{description}</p>
    </div>
  )
}

export function Observability() {
  const [metrics, setMetrics] = useState({
    flashCrash: 0,
    staleTicks: 0,
    rateLimit: 0,
    checksumFail: 0
  })

  const [latencyHistory, setLatencyHistory] = useState<number[]>([])

  useEffect(() => {
    // Initial fetch for latency heatmap (mocking history for now, but wiring inserts)
    setLatencyHistory(Array.from({ length: 60 }, () => Math.floor(Math.random() * 40 + 10)))

    const channel = supabase
      .channel("observability_pulse")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "execution_feed" },
        (payload: any) => {
          const msg = payload.new.message || ""
          const profit = payload.new.profit
          
          // Increment "Live" counters based on feed signals
          if (msg.includes("Flash Crash") || (profit !== null && Number(profit) < -500)) {
            setMetrics(prev => ({ ...prev, flashCrash: prev.flashCrash + 1 }))
          }
          if (msg.includes("Stale") || msg.includes("Timeout")) {
            setMetrics(prev => ({ ...prev, staleTicks: prev.staleTicks + 1 }))
          }
          if (msg.includes("Rate Limit") || msg.includes("429")) {
            setMetrics(prev => ({ ...prev, rateLimit: prev.rateLimit + 1 }))
          }
          
          // Add to latency heatmap if data exists
          if (payload.new.latency_ms) {
            setLatencyHistory(prev => [payload.new.latency_ms, ...prev].slice(0, 60))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <section className="neu-raised p-6">
      <div className="mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-[#818CF8]/10">
          <ShieldAlert className="h-3.5 w-3.5 text-[#818CF8]" />
        </div>
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          PreExecution Gatekeeper
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <GKCard 
          title="Flash Crash" 
          count={metrics.flashCrash} 
          color="#EF4444" 
          description="Tick velocity > 3σ. Execution halted."
        />
        <GKCard 
          title="Stale Ticks" 
          count={metrics.staleTicks} 
          color="#F59E0B" 
          description="WS delta > 500ms. Signal discarded."
        />
        <GKCard 
          title="Rate Limit" 
          count={metrics.rateLimit} 
          color="#0A84FF" 
          description="Bybit account limit approaching (429)."
        />
        <GKCard 
          title="Book Integrity" 
          count={metrics.checksumFail} 
          color="#8B5CF6" 
          description="Checksum mismatch. Forcing resync."
        />
      </div>

      {/* Latency Heatmap */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#22C55E]" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Bybit WebSocket Latency (Last 60m)</span>
          </div>
          <span className="text-[10px] font-mono text-white/20">1 unit = 1 minute</span>
        </div>
        
        <div className="flex gap-1 h-12">
          {latencyHistory.map((lat, i) => {
            const color = lat < 20 ? "#22C55E" : lat < 50 ? "#F59E0B" : "#EF4444";
            return (
              <div 
                key={i} 
                className="flex-1 rounded-sm opacity-60 transition-opacity hover:opacity-100"
                style={{ background: color, height: `${Math.min(100, (lat/100)*100)}%` }}
                title={`${lat}ms`}
              />
            )
          })}
        </div>
        <div className="flex justify-between mt-2 font-mono text-[8px] text-white/20 uppercase tracking-widest">
          <span>60m ago</span>
          <span>Now</span>
        </div>
      </div>
    </section>
  )
}
