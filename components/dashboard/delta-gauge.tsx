"use client"

import { Scale } from "lucide-react"

interface DeltaGaugeProps {
  deltaExposure?: number;
}

export function DeltaGauge({ deltaExposure = 0 }: DeltaGaugeProps) {
  
  const indicatorPosition = 50 + Math.max(Math.min(deltaExposure * 50, 48), -48);

  return (
    <div className="neu-raised flex h-full flex-col p-6 min-h-[300px]">
      <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-[#0A84FF]" />
          <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Balance Axis</h3>
        </div>
        <span className="font-mono text-xs text-muted-foreground">Delta Neutrality</span>
      </div>

      {/* Main Gauge */}
      <div className="relative flex-1 py-10">
        {/* Gauge Track */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2">
          <div className="neu-pressed relative h-2">
            {/* Negative zone (Short heavy) */}
            <div className="absolute left-0 top-0 h-full w-1/2 rounded-l-full bg-gradient-to-r from-[#EF4444]/30 to-transparent" />
            {/* Positive zone (Long heavy) */}
            <div className="absolute right-0 top-0 h-full w-1/2 rounded-r-full bg-gradient-to-l from-[#0A84FF]/30 to-transparent" />
            
            {/* Center mark */}
            <div className="absolute left-1/2 top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-[#22C55E]" />
            
            {/* Active Live indicator */}
            <div
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-out z-10"
              style={{ left: `${indicatorPosition}%` }}
            >
              <div className="relative h-full w-full">
                <div className="absolute inset-0 rounded-full bg-[#22C55E] shadow-[0_0_12px_rgba(34,197,94,0.8)]" />
                <div className="absolute inset-1 rounded-full bg-[#22C55E]" />
              </div>
            </div>
          </div>
          
          {/* Scale labels */}
          <div className="mt-6 flex justify-between text-xs">
            <span className="font-mono text-[#EF4444]/70">SHORT HEAVY</span>
            <span className="font-mono text-[#22C55E]">BALANCED</span>
            <span className="font-mono text-[#0A84FF]/70">LONG HEAVY</span>
          </div>
        </div>
      </div>

      {/* Net Delta Display */}
      <div className="mt-auto border-t border-white/5 pt-6 flex flex-col items-center justify-center gap-2">
        <span className="text-xs text-muted-foreground uppercase tracking-widest">Live Net Delta Exposure</span>
        <span
          className={`font-mono text-4xl font-semibold tracking-tight ${
            Math.abs(deltaExposure) < 0.1
              ? "text-[#22C55E]"
              : Math.abs(deltaExposure) < 0.5
              ? "text-[#F59E0B]"
              : "text-[#EF4444]"
          }`}
        >
          {deltaExposure >= 0 ? "+" : ""}
          {deltaExposure.toFixed(4)}
        </span>
      </div>
    </div>
  )
}