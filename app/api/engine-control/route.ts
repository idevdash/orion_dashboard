import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ENGINE_COMMANDS_TABLE = 'engine_commands'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    return {
      error: NextResponse.json(
        { error: 'Server misconfiguration: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      ),
      client: null as ReturnType<typeof createClient> | null,
    }
  }

  const client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  return { error: null, client }
}

export async function POST(request: NextRequest) {
  const { error: configError, client: supabaseAdmin } = getSupabaseAdmin()
  if (configError || !supabaseAdmin) {
    return configError!
  }

  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null

  if (!token) {
    return NextResponse.json({ error: 'Missing Authorization Bearer token' }, { status: 401 })
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token)

  if (userError || !user) {
    return NextResponse.json(
      { error: userError?.message ?? 'Invalid or expired session' },
      { status: 401 }
    )
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 403 })
  }

  if (profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: admin role required' }, { status: 403 })
  }

  let body: { action?: string; value?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const action = body.action
  if (action !== 'START' && action !== 'STOP' && action !== 'SET_TARGET') {
    return NextResponse.json(
      { error: 'Invalid action: expected START, STOP, or SET_TARGET' },
      { status: 400 }
    )
  }

  if (action === 'SET_TARGET') {
    if (typeof body.value !== 'number' || Number.isNaN(body.value)) {
      return NextResponse.json(
        { error: 'SET_TARGET requires a numeric value' },
        { status: 400 }
      )
    }
  } else if (body.value !== undefined && typeof body.value !== 'number') {
    return NextResponse.json({ error: 'value must be a number when provided' }, { status: 400 })
  }

  const payload: Record<string, unknown> = {
    source: 'api_engine_control',
    issued_at: new Date().toISOString(),
    user_id: user.id,
  }

  if (action === 'SET_TARGET') {
    payload.value = body.value
    payload.currency = 'USD'
    payload.set_at = new Date().toISOString()
  } else if (body.value !== undefined) {
    payload.value = body.value
  }

  const { error: insertError } = await supabaseAdmin.from(ENGINE_COMMANDS_TABLE).insert({
    type: action,
    payload,
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, success: true, action }, { status: 200 })
}
