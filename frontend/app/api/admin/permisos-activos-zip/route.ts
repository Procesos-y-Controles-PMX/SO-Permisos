import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import JSZip from 'jszip'

type Scope = 'all' | 'region' | 'store'

type PermisoActivoRow = {
  fecha_vencimiento: string | null
  estatus: 'Activo' | 'Aprobado' | string
  archivo_path: string | null
  tienda: {
    id: number
    sucursal: string | null
    id_region: number | null
    region: {
      id: number
      nombre_region: string | null
    } | null
  } | null
}

const ACTIVE_STATUSES = new Set(['Activo', 'Aprobado'])

function sanitizePathSegment(value: string | null | undefined, fallback: string): string {
  const base = (value || fallback).trim()
  return base.replace(/[<>:"/\\|?*\u0000-\u001F]/g, ' ').replace(/\s+/g, ' ').trim() || fallback
}

function todayISODate(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function buildZipFileName(scope: Scope, regionName?: string, storeName?: string): string {
  const date = new Date().toISOString().slice(0, 10)
  if (scope === 'all') return `permisos_activos_todas_las_regiones_${date}.zip`
  if (scope === 'region') return `permisos_activos_${sanitizePathSegment(regionName, 'Region')}_${date}.zip`
  return `permisos_activos_${sanitizePathSegment(storeName, 'Tienda')}_${date}.zip`
}

function extractFileName(path: string): string {
  const parts = path.split('/')
  return parts[parts.length - 1] || 'archivo'
}

async function isAdminUser(supabase: ReturnType<typeof createClient>, adminId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('perfiles')
    .select('id, roles:id_rol(nombre_rol)')
    .eq('id', adminId)
    .single()

  if (error || !data) return false
  const rol = Array.isArray(data.roles) ? data.roles[0] : data.roles
  return rol?.nombre_rol === 'Admin'
}

export async function POST(req: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'permisos-bucket'

    if (!url || !key) {
      return NextResponse.json({ error: 'Faltan variables de entorno de Supabase.' }, { status: 500 })
    }

    const supabase = createClient(url, key)
    const body = await req.json()
    const scope = body?.scope as Scope
    const regionId = body?.regionId ? Number(body.regionId) : null
    const tiendaId = body?.tiendaId ? Number(body.tiendaId) : null
    const adminId = body?.adminId ? Number(body.adminId) : null

    if (!adminId || Number.isNaN(adminId)) {
      return NextResponse.json({ error: 'Identificador de administrador inválido.' }, { status: 401 })
    }

    const adminAllowed = await isAdminUser(supabase, adminId)
    if (!adminAllowed) {
      return NextResponse.json({ error: 'No autorizado para generar descargas masivas.' }, { status: 403 })
    }

    if (!scope || !['all', 'region', 'store'].includes(scope)) {
      return NextResponse.json({ error: 'Parámetro de alcance inválido.' }, { status: 400 })
    }
    if (scope === 'region' && (!regionId || Number.isNaN(regionId))) {
      return NextResponse.json({ error: 'Debes seleccionar una región válida.' }, { status: 400 })
    }
    if (scope === 'store' && (!tiendaId || Number.isNaN(tiendaId))) {
      return NextResponse.json({ error: 'Debes seleccionar una tienda válida.' }, { status: 400 })
    }

    let query = supabase
      .from('permisos_vigentes')
      .select(`
        fecha_vencimiento,
        estatus,
        archivo_path,
        tienda:id_tienda!inner(
          id,
          sucursal,
          id_region,
          region:id_region(id, nombre_region)
        )
      `)
      .in('estatus', ['Activo', 'Aprobado'])
      .not('archivo_path', 'is', null)

    if (scope === 'region') {
      query = query.eq('tienda.id_region', regionId)
    }
    if (scope === 'store') {
      query = query.eq('id_tienda', tiendaId)
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: `Error consultando permisos activos: ${error.message}` }, { status: 500 })
    }

    const today = todayISODate()
    const rows = ((data || []) as PermisoActivoRow[]).filter((row) => {
      if (!row.archivo_path || !row.tienda) return false
      if (!ACTIVE_STATUSES.has(row.estatus)) return false
      if (!row.fecha_vencimiento) return false
      return row.fecha_vencimiento >= today
    })

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No se encontraron permisos activos para el filtro seleccionado.' }, { status: 404 })
    }

    const zip = new JSZip()
    const uniqueStores = new Set<number>()
    let firstRegionName = 'Region'
    let firstStoreName = 'Tienda'
    let addedFiles = 0

    for (const row of rows) {
      if (!row.archivo_path || !row.tienda) continue

      const regionName = sanitizePathSegment(row.tienda.region?.nombre_region, 'Region')
      const storeName = sanitizePathSegment(row.tienda.sucursal, `Tienda_${row.tienda.id}`)
      const originalFileName = sanitizePathSegment(extractFileName(row.archivo_path), 'archivo')

      if (addedFiles === 0) {
        firstRegionName = regionName
        firstStoreName = storeName
      }

      const { data: fileBlob, error: fileErr } = await supabase.storage.from(bucket).download(row.archivo_path)
      if (fileErr || !fileBlob) continue

      const arrayBuffer = await fileBlob.arrayBuffer()
      const fileBuffer = Buffer.from(arrayBuffer)

      const relativePath =
        scope === 'all'
          ? `TodasLasRegiones/${regionName}/${storeName}/${originalFileName}`
          : scope === 'region'
            ? `${regionName}/${storeName}/${originalFileName}`
            : `${storeName}/${originalFileName}`

      zip.file(relativePath, fileBuffer)
      uniqueStores.add(row.tienda.id)
      addedFiles++
    }

    if (addedFiles === 0) {
      return NextResponse.json({ error: 'No se pudieron descargar archivos para generar el ZIP.' }, { status: 502 })
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } })
    const filename = buildZipFileName(scope, firstRegionName, firstStoreName)

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Zip-Files': String(addedFiles),
        'X-Zip-Stores': String(uniqueStores.size),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Ocurrió un error inesperado al generar el ZIP.' }, { status: 500 })
  }
}
