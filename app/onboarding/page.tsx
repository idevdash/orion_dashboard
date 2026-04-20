"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    displayName: '',
    pubKey: '',
    secKey: ''
  })

  const handleComplete = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // 1. Update Profile
    await supabase.from('profiles').update({
      display_name: formData.displayName,
      role: 'client' // Promote from onboarding to client
    }).eq('id', session.user.id)

    // 2. Vault API Keys
    await supabase.from('user_keys_public').insert({
      user_id: session.user.id,
      binance_public_key: formData.pubKey,
      binance_secret_key: formData.secKey
    })

    router.push('/client')
  }

  return (
    <div className="onboarding-screen bg-orion-tech">
      <style>{`
        .onboarding-screen {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          font-family: 'Rajdhani', sans-serif; color: white;
        }
        .wizard-card {
          width: 480px; background: rgba(15, 21, 34, 0.8); border: 1px solid rgba(245, 158, 11, 0.3);
          padding: 40px; border-radius: 4px; backdrop-filter: blur(20px);
          box-shadow: 0 0 40px rgba(245, 158, 11, 0.05);
        }
        .step-indicator { font-family: 'JetBrains Mono'; font-size: 10px; color: #F59E0B; letter-spacing: 0.2em; margin-bottom: 10px; }
        .wizard-title { font-size: 24px; font-weight: 700; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.1em; }
        .field { margin-bottom: 20px; }
        .field label { display: block; font-family: 'JetBrains Mono'; font-size: 9px; color: rgba(255,255,255,0.4); margin-bottom: 8px; text-transform: uppercase; }
        .field input { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 12px; color: white; outline: none; }
        .field input:focus { border-color: #F59E0B; }
        .next-btn { 
          width: 100%; padding: 14px; background: rgba(245, 158, 11, 0.1); border: 1px solid #F59E0B; 
          color: #F59E0B; font-weight: 700; letter-spacing: 0.2em; cursor: pointer; text-transform: uppercase;
        }
        .next-btn:hover { background: #F59E0B; color: #000; }
      `}</style>

      <div className="wizard-card">
        <p className="step-indicator">STEP {step} OF 3</p>
        
        {step === 1 && (
          <div className="step-content">
            <h1 className="wizard-title">Identity Link</h1>
            <div className="field">
              <label>Full Name</label>
              <input value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="Operator Name" />
            </div>
            <div className="field">
              <label>Display Name</label>
              <input value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} placeholder="Dashboard Handle" />
            </div>
            <button className="next-btn" onClick={() => setStep(2)}>Next Phase →</button>
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <h1 className="wizard-title">Exchange API Vault</h1>
            <div className="field">
              <label>Binance Public Key</label>
              <input value={formData.pubKey} onChange={e => setFormData({...formData, pubKey: e.target.value})} placeholder="Paste Public Key" />
            </div>
            <div className="field">
              <label>Binance Secret Key</label>
              <input type="password" value={formData.secKey} onChange={e => setFormData({...formData, secKey: e.target.value})} placeholder="••••••••••••" />
            </div>
            <button className="next-btn" onClick={() => setStep(3)}>Secure Vault →</button>
          </div>
        )}

        {step === 3 && (
          <div className="step-content">
            <h1 className="wizard-title">Initialize Node</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '30px', fontSize: '14px', lineHeight: '1.6' }}>
              By clicking initialize, you are authorizing the Orion Execution Plane to manage traps on your linked Binance Testnet account.
            </p>
            <button
              type="button"
              onClick={handleComplete}
              disabled={loading}
              className="w-full border-0 px-5 py-4 font-bold uppercase tracking-[0.2em] transition-opacity disabled:opacity-50 bg-[var(--orion-belt)] text-[#FFFFFF] rounded-full"
            >
              {loading ? 'SYNCHRONIZING...' : 'INITIALIZE UPLINK'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}