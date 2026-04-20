"use client"

import Image from 'next/image'
import { ChevronDown, User, Settings, LogOut, Activity, AlertCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface HeaderProps {
  isRunning?: boolean;
}

export function Header({ isRunning = true }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#1A1C23]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6">
        
        {/* Brand Block with New SVG Icon */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center neu-pressed rounded-lg border border-white/5 shadow-inner">
            <Image 
              src="/orion-icon-mark.svg" 
              alt="ORION" 
              width={20} 
              height={20} 
            />
          </div>
          <span className="text-lg font-bold tracking-tight text-white uppercase">Orion</span>
        </div>

        {/* LIVE System Status - Center */}
        <div className="absolute left-1/2 -translate-x-1/2">
          {isRunning ? (
            <Badge variant="outline" className="gap-2 border-[#22C55E]/30 bg-[#22C55E]/5 px-4 py-1.5 text-[#22C55E] rounded-md">
              <Activity className="h-3.5 w-3.5 animate-pulse" />
              <span className="font-mono text-xs font-medium tracking-wide">SYSTEM: RUNNING</span>
              <span className="text-[#22C55E]/60">|</span>
              <span className="font-mono text-xs text-[#22C55E]/80">Delta-Neutral</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-2 border-[#F59E0B]/30 bg-[#F59E0B]/5 px-4 py-1.5 text-[#F59E0B] rounded-md">
              <AlertCircle className="h-3.5 w-3.5" />
              <span className="font-mono text-xs font-medium tracking-wide">SYSTEM: PAUSED</span>
              <span className="text-[#F59E0B]/60">|</span>
              <span className="font-mono text-xs text-[#F59E0B]/80">Awaiting Override</span>
            </Badge>
          )}
        </div>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0A84FF]/20 text-[#0A84FF] group-hover:bg-[#0A84FF]/30">
                <User className="h-4 w-4" />
              </div>
              <span className="hidden text-white/80 sm:inline-block font-medium">Operator</span>
              <ChevronDown className="h-4 w-4 text-white/40 group-hover:text-white/60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-[#20232A] border-white/5 text-white">
            <DropdownMenuItem className="gap-2 hover:bg-white/5 cursor-pointer"><User className="h-4 w-4" />Profile</DropdownMenuItem>
            <DropdownMenuItem className="gap-2 hover:bg-white/5 cursor-pointer"><Settings className="h-4 w-4" />Settings</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem className="gap-2 text-[#EF4444] focus:text-[#EF4444] hover:bg-white/5 cursor-pointer"><LogOut className="h-4 w-4" />Disconnect</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}