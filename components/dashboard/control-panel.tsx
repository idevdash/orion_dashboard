"use client"

import { Pause, Play, AlertOctagon, Target, AlertTriangle } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ControlPanelProps {
  isRunning: boolean;
  onToggleRunning: (running: boolean) => void;
  profitTarget: number;
  onTargetChange: (target: number) => void;
  onKill?: () => void; // Added the missing Kill function
}

export function ControlPanel({ 
  isRunning, 
  onToggleRunning, 
  profitTarget, 
  onTargetChange,
  onKill
}: ControlPanelProps) {

  return (
    <section className="neu-raised p-6">
      <div className="mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-[#0A84FF]/10">
          <Target className="h-3.5 w-3.5 text-[#0A84FF]" />
        </div>
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Master Strategy Controls
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* 1. Engine Status Toggle */}
        <div className="neu-pressed flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {!isRunning ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EF4444]/10 shadow-inner">
                <Pause className="h-5 w-5 text-[#EF4444]" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#22C55E]/10 shadow-inner">
                <Play className="h-5 w-5 text-[#22C55E]" />
              </div>
            )}
            <div>
              <Label htmlFor="pause-toggle" className="text-sm font-medium text-foreground">
                Engine Status
              </Label>
              <p className="text-xs text-muted-foreground">
                {!isRunning ? "Paused - No new traps" : "Active - Looping"}
              </p>
            </div>
          </div>
          <Switch
            id="pause-toggle"
            checked={isRunning}
            onCheckedChange={onToggleRunning}
            className="data-[state=checked]:bg-[#22C55E]"
          />
        </div>

        {/* 2. Live Profit Target Slider */}
        <div className="neu-pressed p-4">
          <div className="mb-4 flex items-center justify-between">
            <Label className="text-sm font-medium text-foreground">
              Target per Loop
            </Label>
            <span className="rounded bg-[#0A84FF]/10 px-2 py-1 font-mono text-sm font-semibold text-[#0A84FF]">
              ${profitTarget.toFixed(2)}
            </span>
          </div>
          <Slider
            value={[profitTarget]}
            onValueChange={(val) => onTargetChange(val[0])}
            min={1}
            max={10000}
            step={100}
            className="w-full accent-[#0A84FF]"
          />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span className="font-mono">$1.00</span>
            <span className="font-mono">$10,000</span>
          </div>
        </div>

        {/* 3. THE MASTER KILL SWITCH */}
        <div className="neu-pressed flex items-center justify-center p-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="neu-button h-full w-full px-4 py-2 hover:opacity-90 flex items-center justify-center gap-3 group">
                <div className="h-3 w-3 rounded-full bg-[#EF4444] group-active:bg-red-700 shadow-[0_0_8px_#EF4444]"></div>
                <span className="font-mono font-bold text-[#EF4444] tracking-[0.2em] text-sm">ARM KILL SWITCH</span>
              </button>
            </AlertDialogTrigger>
            
            <AlertDialogContent className="bg-[#20232A] border border-white/5 text-white neu-raised">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-white">
                  <AlertOctagon className="h-5 w-5 text-[#EF4444]" />
                  Initiate Global Shutdown?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-white/60">
                  This will immediately send a SIGKILL to the Python execution engine. All active grid traps will be abandoned in place. This action is logged and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onKill} className="bg-[#EF4444] hover:bg-[#EF4444]/80 text-white border-0">
                  EXECUTE SHUTDOWN
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Warning Banner */}
      {!isRunning && (
        <div className="mt-6 flex items-center gap-3 rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/5 p-3 neu-pressed">
          <AlertTriangle className="h-4 w-4 shrink-0 text-[#F59E0B]" />
          <p className="text-sm text-[#F59E0B] font-mono">
            SYSTEM PAUSED: No new limit orders are being placed. Active market exposure is currently unhedged.
          </p>
        </div>
      )}
    </section>
  )
}