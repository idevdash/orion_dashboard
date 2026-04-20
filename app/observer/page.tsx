"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

import { PortfolioPulse, DeltaGauge, ExecutionFeed } from "@/components/dashboard"

// ─── SUPABASE ──────────────────────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// ─── TYPES ─────────────────────────────────────────────────────────────────────
interface EngineState {
  live_pnl:       number
  total_equity:   number
  active_traps:   number
  delta_exposure: number
  updated_at?:    string
}

// ─── HELPERS ───────────────────────────────────────────────────────────────────
function fmt$(n: number, sign = false) {
  const abs = Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })
  if (sign) return n >= 0 ? `+$${abs}` : `-$${abs}`
  return `$${abs}`
}

function useNow() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH GATE — shown while session is being verified
// ═══════════════════════════════════════════════════════════════════════════════
function AuthGate() {
  return (
    <div className="gate">
      <div className="gate-reticle">
        <div className="gate-ring gate-r1" />
        <div className="gate-ring gate-r2" />
        <div className="gate-ring gate-r3" />
        <div className="gate-core" />
      </div>
      <p className="gate-label">VERIFYING OBSERVER CREDENTIALS</p>
      <style>{`
        .gate {
          position: fixed; inset: 0;
          background: #090C12;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 32px;
        }
        .gate-reticle {
          position: relative; width: 80px; height: 80px;
          display: flex; align-items: center; justify-content: center;
        }
        .gate-ring {
          position: absolute; inset: 0; border-radius: 50%;
          border: 1px solid rgba(148,163,184,0.35);
          animation: gr 2.6s ease-out infinite;
        }
        .gate-r2 { animation-delay: .65s; }
        .gate-r3 { animation-delay: 1.3s; }
        @keyframes gr {
          0%   { opacity: .8; transform: scale(.6); }
          100% { opacity:  0; transform: scale(1.8); }
        }
        .gate-core {
          width: 18px; height: 18px; border-radius: 50%;
          background: rgba(148,163,184,0.2);
          border: 1px solid rgba(148,163,184,0.5);
          box-shadow: 0 0 14px rgba(148,163,184,0.3);
          animation: gc 1.8s ease-in-out infinite;
        }
        @keyframes gc { 0%,100%{opacity:.5} 50%{opacity:1} }
        .gate-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; letter-spacing: .22em;
          color: rgba(148,163,184,0.4);
          text-transform: uppercase;
          animation: gc 1.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TELEMETRY TILE
// ═══════════════════════════════════════════════════════════════════════════════
function ObsTile({
  label, value, sub, accent, dim, flash,
}: {
  label: string; value: string; sub?: string
  accent: string; dim?: boolean; flash?: boolean
}) {
  return (
    <div
      className={`obs-tile ${flash ? 'obs-tile-flash' : ''} ${dim ? 'obs-tile-dim' : ''}`}
      style={{ '--accent': accent } as React.CSSProperties}
    >
      <div className="obs-tile-scanner" />
      <p className="obs-tile-label">{label}</p>
      <p className="obs-tile-value">{value}</p>
      {sub && <p className="obs-tile-sub">{sub}</p>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// OBSERVER NAV
// ═══════════════════════════════════════════════════════════════════════════════
function ObsNav({
  lastUpdate, onSignOut,
}: {
  lastUpdate: string; onSignOut: () => void
}) {
  const now = useNow()
  const ts  = now.toLocaleTimeString('en-US', {
    hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  return (
    <header className="obs-nav">
      <div className="on-brand">
        <div className="on-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="rgba(148,163,184,0.7)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        <div>
          <p className="on-name">ORION</p>
          <p className="on-role">Observer Node</p>
        </div>
      </div>

      <div className="on-ticker">
        <span className="on-ticker-dot" />
        GLOBAL TELEMETRY · LIVE · READ-ONLY
        <span className="on-sep">|</span>
        <span className="on-clock">{ts}</span>
      </div>

      <div className="on-right">
        <div className="on-sync">
          <span className="on-sync-label">LAST SYNC</span>
          <span className="on-sync-val">{lastUpdate}</span>
        </div>
        <button className="on-signout" onClick={onSignOut}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Disconnect
        </button>
      </div>
    </header>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCROLLING WATERMARK TICKER
// ═══════════════════════════════════════════════════════════════════════════════
function WatermarkTicker() {
  const SEGMENT = 'OBSERVER NODE // CONFIDENTIAL GLOBAL TELEMETRY // READ-ONLY // PROJECT EDEN //'
  const REPEAT  = 12
  return (
    <div className="wm-ticker" aria-hidden="true">
      <div className="wm-track">
        {Array.from({ length: REPEAT }).map((_, i) => (
          <span key={i} className="wm-seg">{SEGMENT}&nbsp;&nbsp;</span>
        ))}
      </div>
      <style>{`
        .wm-ticker {
          overflow: hidden; white-space: nowrap;
          border-top: 1px solid rgba(148,163,184,0.06);
          border-bottom: 1px solid rgba(148,163,184,0.06);
          background: rgba(148,163,184,0.015);
          padding: 7px 0;
          pointer-events: none; user-select: none;
        }
        .wm-track {
          display: inline-flex;
          animation: wm-scroll 60s linear infinite;
        }
        @keyframes wm-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .wm-seg {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; letter-spacing: .22em;
          text-transform: uppercase;
          color: rgba(148,163,184,0.18);
        }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLEARANCE BADGE
// ═══════════════════════════════════════════════════════════════════════════════
function ClearanceBadge() {
  return (
    <div className="clearance">
      <div className="cl-icon">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
             stroke="rgba(148,163,184,0.6)" strokeWidth="1.5" strokeLinecap="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <span className="cl-text">
        CLEARANCE LEVEL: OBSERVER · No write access · Telemetry source: <code>engine_state.id = 1</code>
      </span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function ObserverPage() {
  const router = useRouter()

  const [checking,   setChecking]   = useState(true)
  const [engine,     setEngine]     = useState<EngineState>({
    live_pnl: 0, total_equity: 0, active_traps: 0, delta_exposure: 0,
  })
  const [feed,       setFeed]       = useState<any[]>([])
  const [lastUpdate, setLastUpdate] = useState('—')
  const [flash,      setFlash]      = useState(0)

  // ── Auth guard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const guard = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.replace('/'); return }
      setChecking(false)
    }
    guard()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Data boot + real-time (only after auth confirmed) ────────────────────────
  useEffect(() => {
    if (checking) return

    const boot = async () => {
      const { data: es } = await supabase
        .from('engine_state')
        .select('*')
        .eq('id', 1)
        .single()

      if (es) {
        setEngine(es)
        setLastUpdate(
          new Date().toLocaleTimeString('en-US', { hour12: false })
        )
      }

      const { data: ef } = await supabase
        .from('execution_feed')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(40)

      if (ef) setFeed(ef)
    }
    boot()

    const esSub = supabase
      .channel('obs_engine_state')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'engine_state', filter: 'id=eq.1' },
        (p: any) => {
          setEngine(p.new)
          setFlash(f => f + 1)
          setLastUpdate(
            new Date().toLocaleTimeString('en-US', { hour12: false })
          )
        }
      )
      .subscribe()

    const efSub = supabase
      .channel('obs_exec_feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'execution_feed' },
        (p: any) => setFeed(cur => [p.new, ...cur].slice(0, 60))
      )
      .subscribe()

    return () => {
      supabase.removeChannel(esSub)
      supabase.removeChannel(efSub)
    }
  }, [checking])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (checking) return <AuthGate />

  const pnlPositive = engine.live_pnl >= 0
  const roiRaw      = engine.total_equity > 0
    ? ((engine.live_pnl / (engine.total_equity - engine.live_pnl)) * 100)
    : 0
  const roi = (roiRaw >= 0 ? '+' : '') + roiRaw.toFixed(3) + '%'

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500&family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          /* Slate / Cyber-Grey palette — distinct from Emerald Admin + Indigo Client */
          --bg:       #090C12;
          --bg2:      #0C0F18;
          --surf:     #0F1320;
          --surf2:    #131825;
          --bd:       rgba(148,163,184,0.07);
          --bd-hi:    rgba(148,163,184,0.18);
          --slate:    #94A3B8;
          --slate2:   #64748B;
          --slate3:   #334155;
          --cyan:     #67E8F9;          /* single pop accent for key values   */
          --red:      #EF4444;
          --green:    #10B981;
          --text:     rgba(226,232,240,0.85);
          --muted:    rgba(148,163,184,0.38);
          --mono:     'JetBrains Mono', 'Share Tech Mono', monospace;
          --disp:     'Rajdhani', sans-serif;
        }

        html, body { height: 100%; background: var(--bg); }

        /* ── PAGE SHELL ── */
        .obs-page {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          font-family: var(--disp);
          display: flex; flex-direction: column;
          position: relative; overflow-x: hidden;
        }

        /* ── ATMOSPHERE ── */
        .atm-noise {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          opacity: .018;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px 200px;
        }
        .atm-scan {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(148,163,184,0.013) 2px,
            rgba(148,163,184,0.013) 4px
          );
        }
        .atm-grid {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(148,163,184,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.025) 1px, transparent 1px);
          background-size: 64px 64px;
        }
        /* Vignette */
        .atm-vignette {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background: radial-gradient(ellipse at center,
            transparent 50%,
            rgba(0,0,0,0.55) 100%);
        }
        /* Faint horizontal beacon line */
        .atm-beacon {
          position: fixed; top: 50%; left: 0; right: 0;
          height: 1px; z-index: 0; pointer-events: none;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(103,232,249,0.04) 20%,
            rgba(103,232,249,0.09) 50%,
            rgba(103,232,249,0.04) 80%,
            transparent 100%);
          animation: beacon 8s ease-in-out infinite;
        }
        @keyframes beacon {
          0%,100% { opacity: 0; top: 30%; }
          50%     { opacity: 1; top: 70%; }
        }

        /* ── OBSERVER NAV ── */
        .obs-nav {
          position: sticky; top: 0; z-index: 100;
          height: 62px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 32px;
          background: rgba(9,12,18,0.92);
          border-bottom: 1px solid var(--bd);
          backdrop-filter: blur(16px);
        }
        .on-brand { display: flex; align-items: center; gap: 12px; }
        .on-icon {
          width: 34px; height: 34px;
          border: 1px solid var(--bd-hi);
          border-radius: 2px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(148,163,184,0.05);
        }
        .on-name {
          font-family: var(--disp); font-size: 16px;
          font-weight: 700; letter-spacing: .22em;
          color: rgba(226,232,240,0.7); line-height: 1;
        }
        .on-role {
          font-family: var(--mono); font-size: 8px;
          letter-spacing: .2em; text-transform: uppercase;
          color: rgba(148,163,184,0.45); margin-top: 3px;
        }

        .on-ticker {
          display: flex; align-items: center; gap: 10px;
          font-family: var(--mono); font-size: 9px;
          letter-spacing: .18em; text-transform: uppercase;
          color: rgba(148,163,184,0.35);
          border: 1px solid var(--bd);
          background: rgba(148,163,184,0.03);
          padding: 6px 14px; border-radius: 2px;
        }
        .on-ticker-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--slate2);
          box-shadow: 0 0 6px var(--slate2);
          animation: td 2.4s ease-in-out infinite;
        }
        @keyframes td { 0%,100%{opacity:1} 50%{opacity:.2} }
        .on-sep   { opacity: .3; }
        .on-clock { color: rgba(148,163,184,0.55); font-size: 10px; }

        .on-right { display: flex; align-items: center; gap: 16px; }
        .on-sync  { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
        .on-sync-label {
          font-family: var(--mono); font-size: 8px;
          letter-spacing: .2em; text-transform: uppercase;
          color: rgba(148,163,184,0.28);
        }
        .on-sync-val {
          font-family: var(--mono); font-size: 10px;
          letter-spacing: .08em; color: rgba(148,163,184,0.55);
        }
        .on-signout {
          display: flex; align-items: center; gap: 7px;
          padding: 7px 14px; border-radius: 2px;
          border: 1px solid var(--bd);
          background: rgba(148,163,184,0.03);
          color: var(--muted);
          font-family: var(--mono); font-size: 10px;
          letter-spacing: .12em; text-transform: uppercase;
          cursor: pointer; transition: all .18s;
        }
        .on-signout:hover {
          color: var(--red); border-color: rgba(239,68,68,.3);
          background: rgba(239,68,68,.04);
        }

        /* ── SECTION LABEL ── */
        .sec {
          font-family: var(--mono); font-size: 9px;
          letter-spacing: .22em; text-transform: uppercase;
          color: rgba(148,163,184,0.22);
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 14px;
        }
        .sec::after { content:''; flex:1; height:1px; background: var(--bd); }

        /* ── BODY ── */
        .obs-body {
          position: relative; z-index: 1;
          max-width: 1480px; width: 100%;
          margin: 0 auto;
          padding: 28px 32px 72px;
          display: flex; flex-direction: column; gap: 28px;
        }

        /* ── CLASSIFICATION HEADER ── */
        .classif {
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; flex-wrap: wrap;
        }
        .classif-left {}
        .classif-eyebrow {
          font-family: var(--mono); font-size: 9px;
          letter-spacing: .22em; text-transform: uppercase;
          color: rgba(148,163,184,0.3); margin-bottom: 8px;
        }
        .classif-title {
          font-family: var(--disp); font-size: 26px;
          font-weight: 700; letter-spacing: .07em;
          color: rgba(226,232,240,0.75); line-height: 1;
        }
        .classif-title span {
          color: var(--cyan);
          text-shadow: 0 0 24px rgba(103,232,249,0.3);
        }
        .classif-sub {
          font-family: var(--mono); font-size: 9px;
          letter-spacing: .15em; text-transform: uppercase;
          color: var(--muted); margin-top: 8px;
        }
        .classif-badges { display: flex; gap: 10px; flex-wrap: wrap; }
        .cbadge {
          display: flex; align-items: center; gap: 7px;
          padding: 6px 12px; border-radius: 2px;
          border: 1px solid var(--bd);
          font-family: var(--mono); font-size: 9px;
          letter-spacing: .16em; text-transform: uppercase;
          background: rgba(148,163,184,0.03);
          color: rgba(148,163,184,0.4);
        }
        .cbadge-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--slate2);
          box-shadow: 0 0 5px var(--slate2);
        }
        .cbadge-live .cbadge-dot {
          background: var(--cyan);
          box-shadow: 0 0 7px var(--cyan);
          animation: td 2s ease-in-out infinite;
        }

        /* ── TELEMETRY TILES ── */
        .tile-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        .obs-tile {
          background: var(--surf);
          border: 1px solid var(--bd);
          border-top: 2px solid var(--accent, var(--slate3));
          border-radius: 2px;
          padding: 20px 22px;
          position: relative; overflow: hidden;
          transition: border-color .25s, box-shadow .25s;
        }
        /* Moving scanner line on hover */
        .obs-tile-scanner {
          position: absolute; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg,
            transparent, rgba(148,163,184,.12), transparent);
          top: -1px;
          transition: top 0s;
        }
        .obs-tile:hover .obs-tile-scanner {
          animation: scan-line 1.2s linear infinite;
        }
        @keyframes scan-line {
          0%   { top: 0%; }
          100% { top: 100%; }
        }
        .obs-tile::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at top left,
            color-mix(in srgb, var(--accent, var(--slate3)) 10%, transparent),
            transparent 58%);
          pointer-events: none;
        }
        .obs-tile-flash { animation: oflash .4s ease-out; }
        @keyframes oflash {
          0%   { box-shadow: 0 0 0 1px rgba(103,232,249,.35); }
          100% { box-shadow: none; }
        }
        .obs-tile-dim { opacity: .6; }
        .obs-tile-label {
          font-family: var(--mono); font-size: 9px;
          letter-spacing: .2em; text-transform: uppercase;
          color: var(--muted); margin-bottom: 10px;
        }
        .obs-tile-value {
          font-family: var(--disp); font-size: 30px;
          font-weight: 700; line-height: 1; color: var(--text);
        }
        .obs-tile-sub {
          font-family: var(--mono); font-size: 9px;
          letter-spacing: .1em; text-transform: uppercase;
          color: rgba(148,163,184,0.22); margin-top: 8px;
        }

        /* ── GAUGES ROW ── */
        .gauges-row {
          display: grid;
          grid-template-columns: 7fr 5fr;
          gap: 20px; min-height: 360px;
        }

        /* ── CLEARANCE BADGE ── */
        .clearance {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 16px;
          background: rgba(148,163,184,0.025);
          border: 1px solid var(--bd);
          border-left: 2px solid rgba(148,163,184,0.2);
          border-radius: 2px;
        }
        .cl-icon {
          width: 26px; height: 26px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid var(--bd);
          border-radius: 2px; background: rgba(148,163,184,0.04);
        }
        .cl-text {
          font-family: var(--mono); font-size: 9px;
          letter-spacing: .12em; text-transform: uppercase;
          color: rgba(148,163,184,0.3); line-height: 1.6;
        }
        .cl-text code {
          color: rgba(148,163,184,0.5);
          background: rgba(148,163,184,0.07);
          padding: 1px 5px; border-radius: 2px;
        }

        /* ── FOOTER ── */
        .obs-footer {
          position: relative; z-index: 1;
          margin-top: auto;
          border-top: 1px solid var(--bd);
          background: rgba(9,12,18,0.7); backdrop-filter: blur(12px);
        }
        /* Persistent classified watermark bar */
        .obs-footer-wm {
          padding: 10px 32px;
          background: rgba(148,163,184,0.02);
          border-bottom: 1px solid var(--bd);
          display: flex; align-items: center; justify-content: center;
          gap: 20px; overflow: hidden;
        }
        .wm-static {
          font-family: var(--mono); font-size: 9px;
          letter-spacing: .3em; text-transform: uppercase;
          color: rgba(148,163,184,0.16);
          white-space: nowrap; flex-shrink: 0;
        }
        .wm-divider {
          height: 1px; flex: 1;
          background: linear-gradient(90deg,
            transparent, rgba(148,163,184,0.1), transparent);
        }
        .obs-footer-meta {
          padding: 14px 32px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .ofm-left {
          font-family: var(--mono); font-size: 9px;
          letter-spacing: .16em; text-transform: uppercase;
          color: rgba(148,163,184,0.18);
        }
        .ofm-right {
          display: flex; align-items: center; gap: 8px;
          font-family: var(--mono); font-size: 9px;
          letter-spacing: .16em; text-transform: uppercase;
          color: rgba(103,232,249,0.4);
        }
        .ofm-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--cyan); box-shadow: 0 0 6px var(--cyan);
          animation: td 2s ease-in-out infinite;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1100px) {
          .tile-grid   { grid-template-columns: repeat(2, 1fr); }
          .gauges-row  { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .tile-grid   { grid-template-columns: 1fr; }
          .obs-body    { padding: 20px 16px 56px; }
          .obs-nav     { padding: 0 16px; }
          .on-ticker   { display: none; }
          .classif-badges { display: none; }
          .obs-footer-wm  { display: none; }
        }
      `}</style>

      <div className="obs-page">
        {/* ── Atmosphere layers ── */}
        <div className="atm-noise"   aria-hidden="true" />
        <div className="atm-scan"    aria-hidden="true" />
        <div className="atm-grid"    aria-hidden="true" />
        <div className="atm-vignette" aria-hidden="true" />
        <div className="atm-beacon"  aria-hidden="true" />

        {/* ── NAV ── */}
        <ObsNav lastUpdate={lastUpdate} onSignOut={handleSignOut} />

        {/* ── SCROLLING TICKER ── */}
        <WatermarkTicker />

        {/* ── BODY ── */}
        <main className="obs-body">

          {/* CLASSIFICATION HEADER */}
          <div className="classif">
            <div className="classif-left">
              <p className="classif-eyebrow">Global Aggregate · engine_state.id = 1</p>
              <h1 className="classif-title">
                Project Eden <span>Observer</span> Node
              </h1>
              <p className="classif-sub">
                Read-only · No write access · Telemetry refreshes in real-time
              </p>
            </div>
            <div className="classif-badges">
              <div className="cbadge cbadge-live">
                <span className="cbadge-dot" />Live Feed
              </div>
              <div className="cbadge">
                <span className="cbadge-dot" />Confidential
              </div>
              <div className="cbadge">
                <span className="cbadge-dot" />Observer Clearance
              </div>
            </div>
          </div>

          {/* 1 — TILES */}
          <section>
            <p className="sec">Global Telemetry</p>
            <div className="tile-grid">
              <ObsTile
                label="Total Equity"
                value={fmt$(engine.total_equity)}
                sub="Global NAV"
                accent="rgba(148,163,184,0.4)"
                flash={flash > 0}
              />
              <ObsTile
                label="Live PnL"
                value={fmt$(engine.live_pnl, true)}
                sub="Realised + unrealised"
                accent={pnlPositive ? 'rgba(16,185,129,0.55)' : 'rgba(239,68,68,0.55)'}
                flash={flash > 0}
              />
              <ObsTile
                label="Session ROI"
                value={roi}
                sub="Since open"
                accent="rgba(103,232,249,0.35)"
                flash={flash > 0}
              />
              <ObsTile
                label="Active Traps"
                value={String(engine.active_traps)}
                sub="Open grid positions"
                accent="rgba(100,116,139,0.6)"
                flash={flash > 0}
              />
            </div>
          </section>

          {/* 2 — PORTFOLIO PULSE */}
          <section>
            <p className="sec">Portfolio Pulse</p>
            <PortfolioPulse
              totalEquity={engine.total_equity}
              todayProfit={engine.live_pnl}
              activeTraps={engine.active_traps}
            />
          </section>

          {/* 3 — DELTA + FEED */}
          <section>
            <p className="sec">Market Exposure & Execution Log</p>
            <div className="gauges-row">
              <DeltaGauge deltaExposure={engine.delta_exposure} />
              <ExecutionFeed logs={feed} />
            </div>
          </section>

          {/* 4 — CLEARANCE NOTICE */}
          <ClearanceBadge />

        </main>

        {/* ── FOOTER ── */}
        <footer className="obs-footer">
          <div className="obs-footer-wm" aria-hidden="true">
            <div className="wm-divider" />
            <span className="wm-static">
              OBSERVER NODE // CONFIDENTIAL GLOBAL TELEMETRY // READ-ONLY // PROJECT EDEN
            </span>
            <div className="wm-divider" />
          </div>
          <div className="obs-footer-meta">
            <span className="ofm-left">
              ORION · Project Eden · Observer Node · engine_state id=1
            </span>
            <span className="ofm-right">
              <span className="ofm-dot" />
              STREAM ACTIVE
            </span>
          </div>
        </footer>
      </div>
    </>
  )
}
