import { NextResponse } from 'next/server'
import { adminDbError, adminDbUnavailable, getAdminSupabase } from '@/lib/admin/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = getAdminSupabase()
  if (!supabase) return adminDbUnavailable()

  const idTienda = Number(new URL(request.url).searchParams.get('id_tienda'))
  if (!Number.isFinite(idTienda) || idTienda <= 0) {
    return NextResponse.json({ ok: false, message: 'id_tienda inválido.' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('configuracion_tienda_permisos')
      .select('id_tipo_permiso')
      .eq('id_tienda', idTienda)

    if (error) throw error

    return NextResponse.json({
      ok: true,
      permisos: (data || []).map((row) => row.id_tipo_permiso as number),
    })
  } catch (error) {
    return adminDbError(error, 'Error al cargar permisos de la sucursal')
  }
}
