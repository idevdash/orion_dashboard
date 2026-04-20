"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const ROLE_ROUTES: Record<string, string> = {
  admin: '/admin',
  client: '/client',
  observer: '/observer',
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (authError || !data.user) {
      setError(authError?.message || 'Authentication failed')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role) {
      router.push(ROLE_ROUTES[profile.role] || '/')
    } else {
      setLoading(false)
      setError('Clearance profile not found.')
    }
  }

  return (
    <div className="min-h-screen bg-[#1A1C23] flex items-center justify-center p-4 font-sans text-white">
      <div className="neu-raised w-full max-w-[400px] p-10 flex flex-col gap-8 border border-white/5">
        
        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 neu-pressed flex items-center justify-center rounded-lg border border-white/5">
             <Image src="/orion-icon-mark.svg" alt="ORION" width={32} height={32} />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold tracking-[0.2em] uppercase">Orion</h1>
            <p className="text-[9px] font-mono tracking-[0.2em] text-white/40 uppercase">
              “Can you loosen Orion’s belt?” — Job 38:31
            </p>
          </div>
        </div>

        {error && (
          <div className="neu-pressed p-4 border border-red-500/20 text-red-500 text-[10px] font-mono uppercase tracking-tight">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignIn} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest">Operator ID</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="neu-pressed w-full p-4 bg-transparent outline-none text-sm font-mono focus:border-[#0A84FF]/50 transition-colors" 
              placeholder="id@institution.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest">Access Key</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="neu-pressed w-full p-4 bg-transparent outline-none text-sm font-mono focus:border-[#0A84FF]/50 transition-colors" 
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="neu-button w-full py-4 font-mono text-sm font-bold tracking-[0.2em] uppercase hover:text-[#22C55E] transition-all disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Initiate Secure Access →'}
          </button>
        </form>

        <div className="pt-6 border-t border-white/5 flex justify-between items-center opacity-30">
          <span className="text-[9px] font-mono uppercase tracking-widest">Orion v2.0</span>
          <span className="text-[9px] font-mono uppercase tracking-widest">Systems Online</span>
        </div>
      </div>
    </div>
  )
}