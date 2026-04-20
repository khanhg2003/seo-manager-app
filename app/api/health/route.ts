import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const checks = {
    NEXT_PUBLIC_SUPABASE_URL: url ? `✅ Set (${url.slice(0, 30)}...)` : '❌ MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: key ? `✅ Set (${key.slice(0, 20)}...)` : '❌ MISSING',
    NODE_ENV: process.env.NODE_ENV,
  }

  // Test Supabase connectivity
  let supabaseReachable = false
  let supabaseError = null
  if (url && key) {
    try {
      const res = await fetch(`${url}/auth/v1/settings`, {
        headers: { apikey: key },
        signal: AbortSignal.timeout(5000),
      })
      supabaseReachable = res.ok
      if (!res.ok) supabaseError = `HTTP ${res.status}`
    } catch (e: any) {
      supabaseError = e.message
    }
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: checks,
    supabase: {
      reachable: supabaseReachable,
      error: supabaseError,
    },
  })
}
