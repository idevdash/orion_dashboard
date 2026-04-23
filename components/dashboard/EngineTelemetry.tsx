"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Activity, Clock, Cpu, Zap } from "lucide-react"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Engine mode → colour mapping
const MODE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  HARVEST:      { label: "HARVEST",      color: "#22C55E", bg: "rgba(34,197,94,0.08)"  },
  CEE:          { label: "CEE",          color: "#0A84FF", bg: "rgba(10,132,255,0.08)" },
  "FLOW/HARVEST":{ label: "FLOW",        color: "#818CF8", bg: "rgba(129,140,248,0.08)"},
  STORM:        { label: "STORM",        color: "#F59E0B", bg: "rgba(245,158,11,0.08)" },
  UNWIND:       { label: "UNWIND",       color: "#F59E0B", bg: "rgba(245,158,11,0.08)" },
  OFFLINE:      { label: "OFFLINE",      color: "#EF4444", bg: "rgba(239,68,68,0.08)"  },
  UNKNOWN:      { label: "UNKNOWN",      color: "#6B7280", bg: "rgba(107,114,128,0.08)"},
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

interface HeartbeatRow {
  id: string
  client_id: string
  mode: string
  latency_ms: number
  uptime_seconds: number
  pinged_at: string
}

interface EngineTelemetryProps {
  /** Show a compact single-row version for header bars */
  compact?: boolean
}

export function EngineTelemetry({ compact = false }: EngineTelemetryProps) {
  const [hb, setHb] = useState<HeartbeatRow | null>(null)
  const [stale, setStale] = useState(false)

  // Fetch latest on mount, then subscribe to multiple channels
  useEffect(() => {
    let staleTimer: ReturnType<typeof setTimeout>

    const fetchInitial = async () => {
      // 1. Latest heartbeat
      const { data: hbData } = await supabase
        .from("heartbeats")
        .select("*")
        .order("pinged_at", { ascending: false })
        .limit(1)
        .single()
      if (hbData) {
        setHb(hbData)
        setStale(false)
        resetStaleTimer()
      }

      // 2. Initial engine status check if needed
    }

    const resetStaleTimer = () => {
      clearTimeout(staleTimer)
      staleTimer = setTimeout(() => setStale(true), 3 * 60 * 1000)
    }

    fetchInitial()

    // CHANNEL: Heartbeats
    const hbChannel = supabase
      .channel("hb_pulse")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "heartbeats" },
        (p: { new: HeartbeatRow }) => {
          setHb(p.new)
          setStale(false)
          resetStaleTimer()
        }
      )
      .subscribe()

    // CHANNEL: Engine State (for mode/status updates if not in heartbeat)
    const esChannel = supabase
      .channel("es_pulse")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "engine_state", filter: "id=eq.1" },
        (p: any) => {
          // If heartbeat doesn't provide mode, we could get it here. 
          // For now, heartbeats table is the primary source for EngineTelemetry.
        }
      )
      .subscribe()

    return () => {
      clearTimeout(staleTimer)
      supabase.removeChannel(hbChannel)
      supabase.removeChannel(esChannel)
    }
  }, [])

  const mode = hb?.mode ?? "UNKNOWN"
  const cfg  = MODE_CONFIG[mode] ?? MODE_CONFIG["UNKNOWN"]
  const lastPing = hb?.pinged_at
    ? new Date(hb.pinged_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—"

  // ── Compact badge (for use in headers) ────────────────────────────────────
  if (compact) {
    return (
      <div
        className="flex items-center gap-2 rounded-md border px-3 py-1.5"
        style={{ borderColor: `${cfg.color}40`, background: cfg.bg }}
      >
        <span
          className="h-2 w-2 rounded-full animate-pulse"
          style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }}
        />
        <span className="font-mono text-xs font-medium tracking-wider" style={{ color: cfg.color }}>
          ENGINE: {cfg.label}
        </span>
        {hb && (
          <>
            <span style={{ color: `${cfg.color}60` }}>|</span>
            <span className="font-mono text-xs" style={{ color: `${cfg.color}80` }}>
              {formatLatency(hb.latency_ms)}
            </span>
          </>
        )}
        {stale && (
          <span className="font-mono text-xs text-[#EF4444]/80">STALE</span>
        )}
      </div>
    )
  }

  // ── Full panel (for the admin dashboard) ──────────────────────────────────
  return (
    <section className="neu-raised p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-[#0A84FF]/10">
          <Cpu className="h-3.5 w-3.5 text-[#0A84FF]" />
        </div>
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Engine Telemetry
        </h2>
        {stale && (
          <span className="ml-auto rounded bg-[#EF4444]/10 px-2 py-0.5 font-mono text-[10px] text-[#EF4444] uppercase tracking-widest">
            Signal Lost
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {/* Engine Mode */}
        <div
          className="neu-pressed flex flex-col items-start gap-3 p-4 rounded-lg"
          style={{ borderLeft: `2px solid ${cfg.color}` }}
        >
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" style={{ color: cfg.color }} />
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Mode</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full animate-pulse"
              style={{ background: cfg.color, boxShadow: `0 0 8px ${cfg.color}` }}
            />
            <span className="font-mono text-lg font-semibold" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Tick Latency */}
        <div className="neu-pressed flex flex-col items-start gap-3 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#818CF8]" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Tick Latency</span>
          </div>
          <span className="font-mono text-lg font-semibold text-white">
            {hb ? formatLatency(hb.latency_ms) : "—"}
          </span>
        </div>

        {/* Uptime */}
        <div className="neu-pressed flex flex-col items-start gap-3 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#22C55E]" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Uptime</span>
          </div>
          <span className="font-mono text-lg font-semibold text-white">
            {hb ? formatUptime(hb.uptime_seconds) : "—"}
          </span>
        </div>

        {/* Last Ping */}
        <div className="neu-pressed flex flex-col items-start gap-3 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#F59E0B]" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Last Ping</span>
          </div>
          <span className="font-mono text-lg font-semibold text-white">{lastPing}</span>
        </div>

      </div>
    </section>
  )
}
