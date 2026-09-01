import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { formatErrorMessage } from '@/lib/format-error'

export function adminDbUnavailable() {
  return NextResponse.json(
    { ok: false, message: 'Servidor sin configuración de base de datos.' },
    { status: 500 },
  )
}

export function adminDbError(error: unknown, fallback: string) {
  console.error(`[admin] ${fallback}:`, error)
  return NextResponse.json(
    { ok: false, message: formatErrorMessage(error, fallback) },
    { status: 500 },
  )
}

export function getAdminSupabase() {
  return createSupabaseServerClient()
}
