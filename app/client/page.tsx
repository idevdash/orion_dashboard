"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
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
}

interface UserProfile {
  id:           string
  display_name: string | null
  role:         string
  created_at:   string
}

const DEMO_STATE: EngineState = {
  live_pnl:       347.82,
  total_equity:   124500.00,
  active_traps:   12,
  delta_exposure: 0.218,
}

// ─── HELPERS ───────────────────────────────────────────────────────────────────
function fmt$(n: number, showSign = false) {
  const abs = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (showSign) return n >= 0 ? `+$${abs}` : `-$${abs}`
  return `$${abs}`
}

function calcRoi(equity: number, pnl: number) {
  if (equity === 0) return '0.00'
  return ((pnl / (equity - pnl)) * 100).toFixed(2)
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════════════════════════
interface ToastMsg { id: number; text: string; sub?: string }

function ToastStack({ toasts, onDismiss }: { toasts: ToastMsg[]; onDismiss: (id: number) => void }) {
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className="toast" onClick={() => onDismiss(t.id)}>
          <div className="toast-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="#6366F1" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <p className="toast-text">{t.text}</p>
            {t.sub && <p className="toast-sub">{t.sub}</p>}
          </div>
          <button className="toast-close" aria-label="Dismiss">✕</button>
        </div>
      ))}
    </div>
  )
}

function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const counter = useRef(0)

  const push = useCallback((text: string, sub?: string) => {
    const id = ++counter.current
    setToasts(t => [...t, { id, text, sub }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  return { toasts, push, dismiss }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════════════════════
function StatCard({
  label, value, sub, accent, icon, flash,
}: {
  label: string; value: string; sub?: string
  accent: string; icon: React.ReactNode; flash?: boolean
}) {
  return (
    <div className={`stat-card ${flash ? 'stat-flash' : ''}`}
         style={{ '--accent': accent } as React.CSSProperties}>
      <div className="stat-icon-wrap">{icon}</div>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVESTOR ACTION BUTTON
// ═══════════════════════════════════════════════════════════════════════════════
function ActionButton({
  label, sublabel, icon, onClick, variant = 'default',
}: {
  label: string; sublabel: string
  icon: React.ReactNode; onClick: () => void
  variant?: 'default' | 'accent'
}) {
  return (
    <button
      className={`action-btn ${variant === 'accent' ? 'action-btn-accent' : ''}`}
      onClick={onClick}
    >
      <div className="action-btn-left">
        <div className="action-icon">{icon}</div>
        <div>
          <p className="action-label">{label}</p>
          <p className="action-sub">{sublabel}</p>
        </div>
      </div>
      <span className="action-arrow">→</span>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION BANNER
// ═══════════════════════════════════════════════════════════════════════════════
function SessionBanner({ isDemo, userName }: { isDemo: boolean; userName: string }) {
  if (!isDemo) return null
  return (
    <div className="session-banner">
      <div className="sb-left">
        <div className="sb-icon">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="#6366F1" strokeWidth="2" strokeLinecap="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <p className="sb-text">
          <span className="sb-tag">Private Demo Session</span>
          Displaying global Project Eden reference data — your personal positions will
          appear once your account is linked to a live strategy allocation.
        </p>
      </div>
      <span className="sb-user">{userName}</span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT NAV
// ═══════════════════════════════════════════════════════════════════════════════
function ClientNav({
  userName, onSignOut,
}: {
  userName: string; onSignOut: () => void
}) {
  return (
    <header className="client-nav">
      {/* Brand */}
      <div className="cn-brand">
        <div className="cn-icon shadow-orion-indigo-glow">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            <path d="M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
          </svg>
        </div>
        <div>
          <p className="cn-name">ORION</p>
          <p className="cn-role">Investor Portal</p>
        </div>
      </div>

      {/* Node label */}
      <div className="cn-node">
        <span className="cn-node-dot" />
        CLIENT NODE
      </div>

      {/* Right */}
      <div className="cn-right">
        <div className="cn-user">
          <div className="cn-avatar">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="cn-user-text">
            <p className="cn-user-name">{userName}</p>
            <p className="cn-user-role">Verified Investor</p>
          </div>
        </div>
        <button className="cn-signout" onClick={onSignOut} aria-label="Sign out">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button>
      </div>
    </header>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function ClientPage() {
  const router   = useRouter()
  const { toasts, push: pushToast, dismiss } = useToast()

  // Auth + profile
  const [userId,   setUserId]   = useState<string | null>(null)
  const [profile,  setProfile]  = useState<UserProfile | null>(null)
  const [isDemo,   setIsDemo]   = useState(false)

  // Engine data
  const [engine,   setEngine]   = useState<EngineState>(DEMO_STATE)
  const [feed,     setFeed]     = useState<any[]>([])
  const [flash,    setFlash]    = useState(0)

  // ── Auth check ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/'); return }

      const uid = session.user.id
      setUserId(uid)

      // Fetch profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single()
      if (prof) setProfile(prof)

      // Try user-scoped engine state first
      const { data: userState } = await supabase
        .from('engine_state')
        .select('*')
        .eq('user_id', uid)
        .single()

      if (userState) {
        setEngine(userState)
        setIsDemo(false)
      } else {
        // Fall back to global row (id = 1) as demo
        const { data: globalState } = await supabase
          .from('engine_state')
          .select('*')
          .eq('id', 1)
          .single()
        if (globalState) setEngine(globalState)
        setIsDemo(true)
      }

      // Execution feed — user-scoped, else global
      const { data: userFeed } = await supabase
        .from('execution_feed')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(30)

      if (userFeed && userFeed.length > 0) {
        setFeed(userFeed)
      } else {
        const { data: globalFeed } = await supabase
          .from('execution_feed')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30)
        if (globalFeed) setFeed(globalFeed)
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Real-time subscriptions (scoped to userId once available) ────────────────
  useEffect(() => {
    if (!userId) return

    const esSub = supabase
      .channel('client_engine_state')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'engine_state' },
        (p: any) => {
          // Accept if user-scoped match OR global fallback in demo mode
          if (p.new?.user_id === userId || (isDemo && p.new?.id === 1)) {
            setEngine(p.new)
            setFlash(f => f + 1)
          }
        })
      .subscribe()

    const efSub = supabase
      .channel('client_exec_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'execution_feed' },
        (p: any) => {
          if (p.new?.user_id === userId || isDemo) {
            setFeed(cur => [p.new, ...cur].slice(0, 50))
          }
        })
      .subscribe()

    return () => {
      supabase.removeChannel(esSub)
      supabase.removeChannel(efSub)
    }
  }, [userId, isDemo])

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleWithdrawal = () =>
    pushToast('Withdrawal Requests — Coming Soon', 'This feature is currently in development and will be available in a future release.')

  const handleStatement = () =>
    pushToast('Statement Downloads — Coming Soon', 'PDF generation is being finalized. You will receive an email notification when available.')

  // Derived
  const roi          = calcRoi(engine.total_equity, engine.live_pnl)
  const roiPositive  = parseFloat(roi) >= 0
  const displayName  = profile?.display_name ?? profile?.id?.slice(0, 8) ?? 'Investor'
  const memberSince  = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—'

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500&family=Rajdhani:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:      #08091200;
          --bg-s:    #080912;
          --surf:    #0D1121;
          --surf2:   #101628;
          --bd:      rgba(255,255,255,0.06);
          --bd-hi:   rgba(99,102,241,0.45);
          --indigo:  #6366F1;
          --indigo2: #818CF8;
          --green:   #10B981;
          --red:     #EF4444;
          --amber:   #F59E0B;
          --text:    rgba(255,255,255,0.88);
          --muted:   rgba(255,255,255,0.32);
          --mono:    'JetBrains Mono', monospace;
          --disp:    'Rajdhani', sans-serif;
        }

        html, body { height: 100%; background: var(--bg-s); }

        /* ── PAGE SHELL ── */
        .client-page {
          min-height: 100vh;
          background: var(--bg-s);
          color: var(--text);
          font-family: var(--disp);
          display: flex; flex-direction: column;
          position: relative; overflow-x: hidden;
        }

        /* ── ATMOSPHERE ── */
        .atm-blob-tl {
          position: fixed; top: -160px; left: -120px;
          width: 700px; height: 700px; border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 65%);
          pointer-events: none; z-index: 0;
        }
        .atm-blob-br {
          position: fixed; bottom: -140px; right: -80px;
          width: 580px; height: 580px; border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 65%);
          pointer-events: none; z-index: 0;
        }
        .atm-grid {
          position: fixed; inset: 0;
          background-image:
            linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px);
          background-size: 64px 64px;
          pointer-events: none; z-index: 0;
        }
        /* Diagonal accent line */
        .atm-line {
          position: fixed; top: 0; right: 240px;
          width: 1px; height: 100vh;
          background: linear-gradient(180deg,
            transparent 0%,
            rgba(99,102,241,0.15) 30%,
            rgba(99,102,241,0.15) 70%,
            transparent 100%);
          pointer-events: none; z-index: 0;
        }

        /* ── CLIENT NAV ── */
        .client-nav {
          position: sticky; top: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 32px; height: 66px;
          background: rgba(8, 9, 18, 0.88);
          border-bottom: 1px solid var(--bd);
          backdrop-filter: blur(16px);
        }
        .cn-brand { display: flex; align-items: center; gap: 12px; }
        .cn-icon {
          width: 36px; height: 36px;
          border: 1px solid rgba(99,102,241,0.35);
          border-radius: 2px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(99,102,241,0.1);
          box-shadow: 0 0 16px rgba(99,102,241,0.12);
        }
        .cn-name {
          font-family: var(--disp); font-size: 17px;
          font-weight: 700; letter-spacing: 0.2em; line-height: 1;
        }
        .cn-role {
          font-family: var(--mono); font-size: 9px;
          letter-spacing: 0.2em; color: rgba(99,102,241,0.7);
          text-transform: uppercase; margin-top: 3px;
        }

        .cn-node {
          display: flex; align-items: center; gap: 8px;
          font-family: var(--mono); font-size: 10px;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(99,102,241,0.6);
          border: 1px solid rgba(99,102,241,0.18);
          background: rgba(99,102,241,0.05);
          padding: 6px 14px; border-radius: 2px;
        }
        .cn-node-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--indigo);
          box-shadow: 0 0 8px var(--indigo);
          animation: nd-pulse 2.2s ease-in-out infinite;
        }
        @keyframes nd-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }

        .cn-right { display: flex; align-items: center; gap: 16px; }
        .cn-user  { display: flex; align-items: center; gap: 10px; }
        .cn-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          border: 1px solid rgba(99,102,241,0.4);
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.05));
          display: flex; align-items: center; justify-content: center;
          font-family: var(--disp); font-size: 14px; font-weight: 700;
          color: var(--indigo2);
          box-shadow: 0 0 12px rgba(99,102,241,0.15);
        }
        .cn-user-name {
          font-family: var(--disp); font-size: 13px;
          font-weight: 600; letter-spacing: 0.05em; line-height: 1;
        }
        .cn-user-role {
          font-family: var(--mono); font-size: 8px;
          letter-spacing: 0.15em; text-transform: uppercase;
          color: rgba(99,102,241,0.6); margin-top: 3px;
        }
        .cn-signout {
          display: flex; align-items: center; gap: 7px;
          padding: 7px 14px; border-radius: 2px;
          border: 1px solid var(--bd);
          background: rgba(255,255,255,0.02);
          color: var(--muted);
          font-family: var(--mono); font-size: 10px;
          letter-spacing: 0.12em; text-transform: uppercase;
          cursor: pointer; transition: all 0.18s;
        }
        .cn-signout:hover {
          color: var(--red); border-color: rgba(239,68,68,0.3);
          background: rgba(239,68,68,0.05);
        }

        /* ── SESSION BANNER ── */
        .session-banner {
          position: relative; z-index: 10;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px;
          padding: 12px 32px;
          background: rgba(99,102,241,0.07);
          border-bottom: 1px solid rgba(99,102,241,0.18);
        }
        .sb-left { display: flex; align-items: flex-start; gap: 10px; }
        .sb-icon {
          width: 24px; height: 24px; flex-shrink: 0;
          border: 1px solid rgba(99,102,241,0.3);
          border-radius: 2px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(99,102,241,0.1); margin-top: 1px;
        }
        .sb-text {
          font-family: var(--mono); font-size: 10px;
          line-height: 1.65; letter-spacing: 0.04em;
          color: rgba(255,255,255,0.4);
        }
        .sb-tag {
          display: inline-block;
          color: var(--indigo2); font-weight: 500;
          margin-right: 8px;
        }
        .sb-user {
          font-family: var(--mono); font-size: 9px;
          letter-spacing: 0.15em; text-transform: uppercase;
          color: rgba(99,102,241,0.5);
          white-space: nowrap;
        }

        /* ── BODY ── */
        .client-body {
          position: relative; z-index: 1;
          max-width: 1480px; width: 100%;
          margin: 0 auto;
          padding: 32px 32px 64px;
          display: flex; flex-direction: column; gap: 32px;
        }

        /* ── GREETING ── */
        .greeting {
          display: flex; align-items: flex-end; justify-content: space-between;
          gap: 16px; flex-wrap: wrap;
        }
        .greeting-left {}
        .greeting-eyebrow {
          font-family: var(--mono); font-size: 9px;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(99,102,241,0.6); margin-bottom: 8px;
        }
        .greeting-title {
          font-family: var(--disp); font-size: 28px;
          font-weight: 700; letter-spacing: 0.06em; line-height: 1;
        }
        .greeting-title span { color: var(--indigo2); }
        .greeting-sub {
          font-family: var(--mono); font-size: 10px;
          letter-spacing: 0.1em; color: var(--muted);
          text-transform: uppercase; margin-top: 8px;
        }
        .greeting-meta {
          display: flex; gap: 20px;
        }
        .meta-chip {
          display: flex; flex-direction: column; align-items: flex-end; gap: 3px;
        }
        .meta-chip-val {
          font-family: var(--disp); font-size: 22px;
          font-weight: 700; letter-spacing: 0.05em;
        }
        .meta-chip-label {
          font-family: var(--mono); font-size: 9px;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--muted);
        }

        /* ── SECTION LABELS ── */
        .sec {
          font-family: var(--mono); font-size: 9px;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(255,255,255,0.2);
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 14px;
        }
        .sec::after { content:''; flex:1; height:1px; background: var(--bd); }

        /* ── STAT CARDS ── */
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        .stat-card {
          background: var(--surf);
          border: 1px solid var(--bd);
          border-top: 2px solid var(--accent, var(--indigo));
          border-radius: 2px;
          padding: 20px 22px;
          position: relative; overflow: hidden;
          transition: box-shadow 0.3s, transform 0.2s;
        }
        .stat-card::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at top left,
            color-mix(in srgb, var(--accent, var(--indigo)) 10%, transparent),
            transparent 58%);
          pointer-events: none;
        }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(99,102,241,0.08); }
        .stat-flash { animation: sflash 0.45s ease-out; }
        @keyframes sflash {
          0%   { box-shadow: 0 0 0 1px var(--accent, var(--indigo)); }
          100% { box-shadow: none; }
        }
        .stat-icon-wrap {
          width: 32px; height: 32px;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 2px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.03);
          margin-bottom: 14px;
        }
        .stat-label {
          font-family: var(--mono); font-size: 9px;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--muted); margin-bottom: 8px;
        }
        .stat-value {
          font-family: var(--disp); font-size: 28px;
          font-weight: 700; line-height: 1; color: var(--text);
        }
        .stat-sub {
          font-family: var(--mono); font-size: 9px;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(255,255,255,0.2); margin-top: 7px;
        }

        /* ── GAUGES GRID ── */
        .gauges-grid {
          display: grid;
          grid-template-columns: 7fr 5fr;
          gap: 20px; min-height: 360px;
        }

        /* ── INVESTOR ACTIONS ── */
        .action-panel {
          background: var(--surf);
          border: 1px solid var(--bd);
          border-radius: 2px;
          padding: 26px 28px;
          position: relative; overflow: hidden;
        }
        .action-panel::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, var(--indigo) 40%, var(--indigo2) 60%, transparent);
          opacity: 0.5;
        }
        .action-panel-head {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 24px;
        }
        .action-panel-title {
          font-family: var(--disp); font-size: 18px;
          font-weight: 700; letter-spacing: 0.08em;
        }
        .action-panel-sub {
          font-family: var(--mono); font-size: 9px;
          letter-spacing: 0.15em; text-transform: uppercase;
          color: rgba(99,102,241,0.6); margin-top: 4px;
        }
        .action-compliance {
          display: flex; align-items: center; gap: 7px;
          font-family: var(--mono); font-size: 9px;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(255,255,255,0.22);
          border: 1px solid var(--bd);
          padding: 5px 10px; border-radius: 2px;
          background: rgba(255,255,255,0.02);
        }
        .action-compliance-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--green); box-shadow: 0 0 5px var(--green);
        }
        .action-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
        }
        .action-btn {
          display: flex; align-items: center; justify-content: space-between;
          gap: 14px; padding: 16px 18px;
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--bd);
          border-radius: 2px;
          cursor: pointer; transition: all 0.2s;
          text-align: left;
        }
        .action-btn:hover {
          background: rgba(99,102,241,0.07);
          border-color: rgba(99,102,241,0.3);
          box-shadow: 0 0 20px rgba(99,102,241,0.07);
        }
        .action-btn-accent {
          border-color: rgba(99,102,241,0.25);
          background: rgba(99,102,241,0.06);
        }
        .action-btn-accent:hover {
          border-color: rgba(99,102,241,0.5);
          box-shadow: 0 0 24px rgba(99,102,241,0.12);
        }
        .action-btn-left { display: flex; align-items: center; gap: 14px; }
        .action-icon {
          width: 36px; height: 36px; flex-shrink: 0;
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 2px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(99,102,241,0.08);
        }
        .action-label {
          font-family: var(--disp); font-size: 14px;
          font-weight: 600; letter-spacing: 0.07em; color: var(--text);
          line-height: 1;
        }
        .action-sub {
          font-family: var(--mono); font-size: 9px;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--muted); margin-top: 4px;
        }
        .action-arrow {
          font-size: 18px; color: rgba(99,102,241,0.5);
          transition: transform 0.2s, color 0.2s;
        }
        .action-btn:hover .action-arrow { transform: translateX(4px); color: var(--indigo2); }

        /* ── DIVIDER ── */
        .action-divider {
          grid-column: 1 / -1;
          height: 1px; background: var(--bd); margin: 4px 0;
        }

        /* ── READ-ONLY NOTICE ── */
        .readonly-notice {
          grid-column: 1 / -1;
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px;
          background: rgba(255,255,255,0.015);
          border: 1px solid var(--bd); border-radius: 2px;
          font-family: var(--mono); font-size: 9px;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(255,255,255,0.2);
          margin-top: 4px;
        }
        .readonly-notice svg { flex-shrink: 0; opacity: 0.4; }

        /* ── TOAST ── */
        .toast-stack {
          position: fixed; bottom: 28px; right: 28px;
          z-index: 9999;
          display: flex; flex-direction: column; gap: 10px;
          max-width: 420px;
        }
        .toast {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px 16px;
          background: var(--surf2);
          border: 1px solid rgba(99,102,241,0.3);
          border-left: 3px solid var(--indigo);
          border-radius: 2px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          cursor: pointer;
          animation: toast-in 0.3s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .toast-icon {
          width: 28px; height: 28px; flex-shrink: 0;
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 2px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(99,102,241,0.08);
        }
        .toast-text {
          font-family: var(--disp); font-size: 13px;
          font-weight: 600; letter-spacing: 0.05em; color: var(--text);
          line-height: 1.2;
        }
        .toast-sub {
          font-family: var(--mono); font-size: 9px;
          letter-spacing: 0.06em; color: var(--muted);
          margin-top: 5px; line-height: 1.55;
        }
        .toast-close {
          margin-left: auto; flex-shrink: 0;
          background: none; border: none;
          color: var(--muted); font-size: 11px;
          cursor: pointer; padding: 2px;
          transition: color 0.15s;
        }
        .toast-close:hover { color: var(--text); }

        /* ── FOOTER ── */
        .client-footer {
          position: relative; z-index: 1;
          margin-top: auto;
          border-top: 1px solid var(--bd);
          padding: 18px 32px;
          display: flex; justify-content: space-between; align-items: center;
          background: rgba(8,9,18,0.6); backdrop-filter: blur(10px);
        }
        .cf-left {
          font-family: var(--mono); font-size: 9px;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: rgba(255,255,255,0.16);
        }
        .cf-right {
          display: flex; align-items: center; gap: 8px;
          font-family: var(--mono); font-size: 9px;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: rgba(99,102,241,0.5);
        }
        .cf-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--indigo); box-shadow: 0 0 6px var(--indigo);
          animation: nd-pulse 2.2s ease-in-out infinite;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1100px) {
          .stat-grid   { grid-template-columns: repeat(2, 1fr); }
          .gauges-grid { grid-template-columns: 1fr; }
          .action-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .client-body { padding: 20px 16px 48px; }
          .client-nav  { padding: 0 16px; }
          .cn-node, .cn-user-text { display: none; }
          .stat-grid { grid-template-columns: 1fr; }
          .greeting-meta { display: none; }
        }
      `}</style>

      <div className="client-page bg-orion-tech">
        <div className="atm-blob-tl" /><div className="atm-blob-br" />
        <div className="atm-grid" /><div className="atm-line" />

        {/* ── NAV ── */}
        <ClientNav userName={displayName} onSignOut={handleSignOut} />

        {/* ── DEMO BANNER ── */}
        <SessionBanner isDemo={isDemo} userName={displayName} />

        {/* ── BODY ── */}
        <main className="client-body">

          {/* GREETING */}
          <div className="greeting">
            <div className="greeting-left">
              <p className="greeting-eyebrow">Investor Dashboard · Read-Only View</p>
              <h1 className="greeting-title">
                Welcome back, <span>{displayName}</span>
              </h1>
              <p className="greeting-sub">Member since {memberSince} · Verified Investor</p>
            </div>
            <div className="greeting-meta">
              <div className="meta-chip">
                <p className="meta-chip-val" style={{ color: roiPositive ? 'var(--green)' : 'var(--red)' }}>
                  {roiPositive ? '+' : ''}{roi}%
                </p>
                <p className="meta-chip-label">Session ROI</p>
              </div>
              <div className="meta-chip">
                <p className="meta-chip-val" style={{ color: engine.live_pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {fmt$(engine.live_pnl, true)}
                </p>
                <p className="meta-chip-label">Live PnL</p>
              </div>
            </div>
          </div>

          {/* 1 — STAT CARDS */}
          <section>
            <p className="sec">Account Telemetry</p>
            <div className="stat-grid">
              <StatCard
                label="Portfolio Equity"
                value={fmt$(engine.total_equity)}
                sub="Net asset value"
                accent="#6366F1"
                flash={flash > 0}
                icon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                       stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                }
              />
              <StatCard
                label="Live PnL"
                value={fmt$(engine.live_pnl, true)}
                sub="Realised + unrealised"
                accent={engine.live_pnl >= 0 ? '#10B981' : '#EF4444'}
                flash={flash > 0}
                icon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                       stroke={engine.live_pnl >= 0 ? '#10B981' : '#EF4444'}
                       strokeWidth="1.5" strokeLinecap="round">
                    <polyline points={engine.live_pnl >= 0 ? '23 6 13.5 15.5 8.5 10.5 1 18' : '23 18 13.5 8.5 8.5 13.5 1 6'} />
                    <polyline points={engine.live_pnl >= 0 ? '17 6 23 6 23 12' : '17 18 23 18 23 12'} />
                  </svg>
                }
              />
              <StatCard
                label="Session ROI"
                value={`${roiPositive ? '+' : ''}${roi}%`}
                sub="Since session open"
                accent={roiPositive ? '#6366F1' : '#EF4444'}
                flash={flash > 0}
                icon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                       stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                }
              />
              <StatCard
                label="Active Traps"
                value={String(engine.active_traps)}
                sub="Open grid positions"
                accent="#818CF8"
                flash={flash > 0}
                icon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                       stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                }
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
            <p className="sec">Market Exposure</p>
            <div className="gauges-grid">
              <DeltaGauge deltaExposure={engine.delta_exposure} />
              <ExecutionFeed logs={feed} />
            </div>
          </section>

          {/* 4 — INVESTOR ACTIONS */}
          <section>
            <p className="sec">Investor Actions</p>
            <div className="action-panel">
              <div className="action-panel-head">
                <div>
                  <p className="action-panel-title">Account Services</p>
                  <p className="action-panel-sub">Managed by Orion Operations Team</p>
                </div>
                <div className="action-compliance">
                  <span className="action-compliance-dot" />
                  KYC Verified
                </div>
              </div>
              <div className="action-grid">
                <ActionButton
                  label="Request Withdrawal"
                  sublabel="Initiate capital return"
                  variant="accent"
                  onClick={handleWithdrawal}
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                         stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  }
                />
                <ActionButton
                  label="Download Statement"
                  sublabel="PDF account report"
                  onClick={handleStatement}
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                         stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  }
                />

                <div className="action-divider" />

                <ActionButton
                  label="Contact Advisor"
                  sublabel="Speak with your account manager"
                  onClick={() => pushToast('Advisor Scheduling — Coming Soon', 'Direct advisor messaging will be available in the next platform update.')}
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                         stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  }
                />
                <ActionButton
                  label="View Tax Documents"
                  sublabel="Annual reporting package"
                  onClick={() => pushToast('Tax Documents — Coming Soon', 'Your annual tax reporting package is being prepared by our compliance team.')}
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                         stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M9 11l3 3L22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  }
                />

                <div className="readonly-notice">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Read-only portal — engine controls are restricted to Admin operators.
                  Kill Switch and Target PnL parameters are not accessible from this node.
                </div>
              </div>
            </div>
          </section>

        </main>

        {/* ── FOOTER ── */}
        <footer className="client-footer">
          <span className="cf-left">ORION · Project Eden · Investor Portal · Read-Only</span>
          <span className="cf-right">
            <span className="cf-dot" />
            Client Node Active
          </span>
        </footer>

        {/* ── TOASTS ── */}
        <ToastStack toasts={toasts} onDismiss={dismiss} />
      </div>
    </>
  )
}
