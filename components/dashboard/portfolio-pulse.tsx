"use client"

import { TrendingUp, TrendingDown, Zap } from "lucide-react"

interface PortfolioPulseProps {
  totalEquity: number
  todayProfit: number // We map livePnl to this prop
  activeTraps: number
}

export function PortfolioPulse({
  totalEquity,
  todayProfit,
  activeTraps,
}: PortfolioPulseProps) {
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value)
  }

  const formatProfit = (value: number) => {
    const formatted = formatCurrency(Math.abs(value))
    return value >= 0 ? `+${formatted}` : `-${formatted}`
  }

  return (
    <section className="neu-raised relative overflow-hidden p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo/5 via-transparent to-transparent" />
      
      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Portfolio Pulse</span>
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald" />
        </div>

        <div className="mt-6 grid gap-8 md:grid-cols-3">
          {/* Total Equity */}
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Equity</p>
            <p className="font-mono text-4xl font-semibold tracking-tight text-foreground lg:text-5xl">
              {formatCurrency(totalEquity)}
            </p>
          </div>

          {/* Live Floating P&L */}
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Live Floating P&L</p>
            <div className="flex items-baseline gap-3">
              <p
                className="font-mono text-4xl font-semibold tracking-tight lg:text-5xl"
                style={{ color: todayProfit >= 0 ? "#22C55E" : "#EF4444" }}
              >
                {formatProfit(todayProfit)}
              </p>
              {todayProfit >= 0 ? (
                <TrendingUp className="h-6 w-6" style={{ color: "#22C55E" }} />
              ) : (
                <TrendingDown className="h-6 w-6" style={{ color: "#EF4444" }} />
              )}
            </div>
          </div>

          {/* Active Volatility Traps */}
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active Volatility Traps</p>
            <div className="flex items-baseline gap-3">
              <p className="font-mono text-4xl font-semibold tracking-tight text-foreground lg:text-5xl">
                {activeTraps}
              </p>
              <div className="flex items-center gap-1.5 rounded-full bg-indigo/10 px-3 py-1">
                <Zap className="h-3.5 w-3.5 text-indigo" />
                <span className="font-mono text-xs text-indigo">ARMED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}