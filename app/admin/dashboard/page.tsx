"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import Image from "next/image"
import {
  PortfolioPulse,
  DeltaGauge,
  ExecutionFeed,
  ControlPanel,
  EngineTelemetry,
  Observability,
} from "@/components/dashboard"

// ─── SUPABASE ────────────────────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface EngineState {
  live_pnl: number
  total_equity: number
  active_traps: number
  delta_exposure: number
}

const EMPTY_STATE: EngineState = {
  live_pnl: 0,
  total_equity: 0,
  active_traps: 0,
  delta_exposure: 0,
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminDashboardPage() {
  const router = useRouter()

  // ── State ───────────────────────────────────────────────────────────────────
  const [engine, setEngine]           = useState<EngineState>(EMPTY_STATE)
  const [feed, setFeed]               = useState<any[]>([])
  const [isRunning, setIsRunning]     = useState(true)
  const [profitTarget, setProfitTarget] = useState(5.00)
  const [isLoading, setIsLoading]     = useState(true)
  const [userName, setUserName]       = useState("Director")

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push("/admin"); return }

      // Confirm admin role
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role, display_name")
        .eq("id", session.user.id)
        .single()

      if (profile?.role !== "admin") { router.push("/"); return }
      if (profile?.display_name) setUserName(profile.display_name)

      // Fetch current engine_state
      const { data: es } = await supabase
        .from("engine_state")
        .select("*")
        .eq("id", 1)
        .single()
      if (es) setEngine(es)

      // Read current engine_status from engine_config
      const { data: cfg } = await supabase
        .from("engine_config")
        .select("value")
        .eq("key", "engine_status")
        .single()
      if (cfg?.value && cfg.value !== "running") setIsRunning(false)

      // Fetch execution feed
      const { data: feedData } = await supabase
        .from("execution_feed")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)
      if (feedData) setFeed(feedData)

      setIsLoading(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Real-time subscriptions ─────────────────────────────────────────────────
  useEffect(() => {
    const esSub = supabase
      .channel("admin_engine_state")
      .on("postgres_changes", { event: "*", schema: "public", table: "engine_state" },
        (p: any) => {
          if (p.new?.id === 1) setEngine(p.new)
        })
      .subscribe()

    const efSub = supabase
      .channel("admin_exec_feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "execution_feed" },
        (p: any) => setFeed(cur => [p.new, ...cur].slice(0, 100)))
      .subscribe()

    return () => {
      supabase.removeChannel(esSub)
      supabase.removeChannel(efSub)
    }
  }, [])

  // ── Control handlers ────────────────────────────────────────────────────────
  const handleToggleRunning = useCallback(async (running: boolean) => {
    setIsRunning(running)
    // Write to engine_config — this is what main_loop.py polls
    await supabase.from("engine_config").upsert({
      key: "engine_status",
      value: running ? "running" : "stop",
    })
  }, [])

  const handleTargetChange = useCallback(async (target: number) => {
    setProfitTarget(target)
    await supabase.from("engine_config").upsert({
      key: "profit_target",
      value: String(target),
    })
  }, [])

  const handleKill = useCallback(async () => {
    setIsRunning(false)
    // Write "STORM" status — triggers _execute_global_eject() in main_loop.py
    await supabase.from("engine_config").upsert({
      key: "engine_status",
      value: "STORM",
    })
  }, [])

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.push("/admin")
  }, [router])

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1A1C23] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-[#0A84FF] border-t-transparent animate-spin" />
          <p className="font-mono text-xs uppercase tracking-widest text-white/30">
            Establishing Secure Link...
          </p>
        </div>
      </div>
    )
  }

  // ── Dashboard ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#1A1C23] text-white font-sans flex flex-col">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#1A1C23]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6 gap-4">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center neu-pressed rounded-lg border border-white/5">
              <Image src="/orion-icon-mark.svg" alt="ORION" width={20} height={20} />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight uppercase">Orion</span>
              <p className="font-mono text-[9px] tracking-widest text-white/30 uppercase">
                Director Node
              </p>
            </div>
          </div>

          {/* Engine status badge — center */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <EngineTelemetry compact />
          </div>

          {/* Right: user + signout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5 bg-white/3">
              <div className="h-7 w-7 rounded-full bg-[#0A84FF]/20 flex items-center justify-center text-[#0A84FF] font-bold text-xs">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-white/70 font-medium hidden sm:block">{userName}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="neu-button px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-white/40 hover:text-[#EF4444] transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      </header>

      {/* ── BODY ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 mx-auto w-full max-w-[1600px] px-6 py-8 flex flex-col gap-8">

        {/* Page title */}
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/30 mb-1">
              Orion Command Deck · Admin Access
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              Director Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2 neu-pressed px-3 py-1.5 rounded-lg">
            <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse shadow-[0_0_6px_#22C55E]" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">
              Live Feed Active
            </span>
          </div>
        </div>

        {/* 1 — Portfolio Pulse */}
        <section>
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/20 mb-3 flex items-center gap-3 after:flex-1 after:h-px after:bg-white/5">
            Portfolio Pulse
          </p>
          <PortfolioPulse
            totalEquity={engine.total_equity}
            todayProfit={engine.live_pnl}
            activeTraps={engine.active_traps}
          />
        </section>

        {/* 2 — Master Controls */}
        <section>
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/20 mb-3 flex items-center gap-3 after:flex-1 after:h-px after:bg-white/5">
            Master Strategy Controls
          </p>
          <ControlPanel
            isRunning={isRunning}
            onToggleRunning={handleToggleRunning}
            profitTarget={profitTarget}
            onTargetChange={handleTargetChange}
            onKill={handleKill}
          />
        </section>

        {/* 3 — Engine Telemetry */}
        <section>
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/20 mb-3 flex items-center gap-3 after:flex-1 after:h-px after:bg-white/5">
            Engine Telemetry
          </p>
          <EngineTelemetry />
        </section>

        {/* 4 — Observability */}
        <section>
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/20 mb-3 flex items-center gap-3 after:flex-1 after:h-px after:bg-white/5">
            Gatekeeper Observability
          </p>
          <Observability />
        </section>

        {/* 5 — Delta + Feed */}
        <section>
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/20 mb-3 flex items-center gap-3 after:flex-1 after:h-px after:bg-white/5">
            Market Exposure
          </p>
          <div className="grid gap-6 lg:grid-cols-[7fr_5fr] min-h-[360px]">
            <DeltaGauge deltaExposure={engine.delta_exposure} />
            <ExecutionFeed logs={feed} />
          </div>
        </section>

      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 px-6 py-4 flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-widest text-white/15">
          Orion v2.0 · Director Node · Restricted Access
        </span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-white/15">
          {new Date().toUTCString().replace("GMT", "UTC")}
        </span>
      </footer>
    </div>
  )
}
