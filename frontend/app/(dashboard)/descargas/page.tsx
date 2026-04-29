'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase'

type Scope = 'all' | 'region' | 'store'

interface RegionOption {
  id: number
  nombre_region: string
}

interface StoreOption {
  id: number
  sucursal: string | null
  id_region: number | null
}

function getFileNameFromDisposition(value: string | null): string | null {
  if (!value) return null
  const match = value.match(/filename="([^"]+)"/)
  return match?.[1] || null
}

export default function AdminDescargasPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { perfil, isAdmin, loading: authLoading } = useAuth()

  const [scope, setScope] = useState<Scope>('all')
  const [regionId, setRegionId] = useState<string>('')
  const [tiendaId, setTiendaId] = useState<string>('')
  const [regions, setRegions] = useState<RegionOption[]>([])
  const [stores, setStores] = useState<StoreOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/directorio')
    }
  }, [authLoading, isAdmin, router])

  const loadOptions = useCallback(async () => {
    setLoadingOptions(true)
    setError(null)

    try {
      const [regionsRes, storesRes] = await Promise.all([
        supabase.from('regiones').select('id, nombre_region').order('nombre_region'),
        supabase.from('tiendas').select('id, sucursal, id_region').order('sucursal'),
      ])

      if (regionsRes.error) throw new Error(regionsRes.error.message)
      if (storesRes.error) throw new Error(storesRes.error.message)

      setRegions((regionsRes.data || []) as RegionOption[])
      setStores((storesRes.data || []) as StoreOption[])
    } catch (e: any) {
      setError(`No se pudieron cargar regiones/tiendas: ${e.message}`)
    } finally {
      setLoadingOptions(false)
    }
  }, [supabase])

  useEffect(() => {
    if (!authLoading && isAdmin) {
      void loadOptions()
    }
  }, [authLoading, isAdmin, loadOptions])

  useEffect(() => {
    setSuccess(null)
    setError(null)
  }, [scope, regionId, tiendaId])

  const filteredStores = useMemo(() => {
    if (scope === 'store' && regionId) {
      return stores.filter((store) => String(store.id_region) === regionId)
    }
    if (scope === 'region' && regionId) {
      return stores.filter((store) => String(store.id_region) === regionId)
    }
    return stores
  }, [stores, scope, regionId])

  const selectedRegionName = useMemo(
    () => regions.find((r) => String(r.id) === regionId)?.nombre_region || '',
    [regions, regionId]
  )

  const selectedStoreName = useMemo(
    () => stores.find((s) => String(s.id) === tiendaId)?.sucursal || '',
    [stores, tiendaId]
  )

  const canSubmit =
    !submitting &&
    !loadingOptions &&
    isAdmin &&
    !!perfil?.id &&
    (scope === 'all' || (scope === 'region' && !!regionId) || (scope === 'store' && !!tiendaId))

  const handleDownload = async () => {
    if (!canSubmit || !perfil?.id) return
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/admin/permisos-activos-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope,
          regionId: scope === 'region' || (scope === 'store' && regionId) ? Number(regionId) : null,
          tiendaId: scope === 'store' ? Number(tiendaId) : null,
          adminId: perfil.id,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: 'No se pudo generar el archivo.' }))
        throw new Error(payload.error || 'No se pudo generar el archivo.')
      }

      const blob = await response.blob()
      const contentDisposition = response.headers.get('Content-Disposition')
      const headerFiles = Number(response.headers.get('X-Zip-Files') || '0')
      const headerStores = Number(response.headers.get('X-Zip-Stores') || '0')
      const filename =
        getFileNameFromDisposition(contentDisposition) ||
        `permisos_activos_${new Date().toISOString().slice(0, 10)}.zip`

      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)

      setSuccess(`ZIP generado: ${headerFiles} archivo(s) de ${headerStores} tienda(s).`)
    } catch (e: any) {
      setError(e.message || 'Error inesperado al descargar ZIP.')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || !isAdmin) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[40vh]">
        <p className="text-sm text-gray-400">Verificando permisos...</p>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Descarga Masiva de Permisos"
        subtitle="Genera ZIPs de permisos activos por alcance: global, región o tienda."
      />

      <Card className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
              Alcance
            </label>
            <select
              value={scope}
              onChange={(e) => {
                const nextScope = e.target.value as Scope
                setScope(nextScope)
                setTiendaId('')
                if (nextScope === 'all') setRegionId('')
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="all">Todas las regiones</option>
              <option value="region">Una región</option>
              <option value="store">Una tienda</option>
            </select>
          </div>

          {(scope === 'region' || scope === 'store') && (
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                Región
              </label>
              <select
                value={regionId}
                onChange={(e) => {
                  setRegionId(e.target.value)
                  setTiendaId('')
                }}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-700"
              >
                <option value="">Selecciona una región</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.nombre_region}
                  </option>
                ))}
              </select>
            </div>
          )}

          {scope === 'store' && (
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                Tienda
              </label>
              <select
                value={tiendaId}
                onChange={(e) => setTiendaId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-700"
                disabled={!regionId}
              >
                <option value="">Selecciona una tienda</option>
                {filteredStores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.sucursal || `Tienda ${store.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-600">
          <p className="font-semibold text-slate-700 mb-1">Estructura del ZIP</p>
          {scope === 'all' && <p>TodasLasRegiones / Región / Tienda / Archivo</p>}
          {scope === 'region' && <p>{selectedRegionName || 'Región'} / Tienda / Archivo</p>}
          {scope === 'store' && <p>{selectedStoreName || 'Tienda'} / Archivo</p>}
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="primary" onClick={handleDownload} disabled={!canSubmit}>
            {submitting ? 'Generando ZIP...' : 'Generar ZIP'}
          </Button>
        </div>

        {loadingOptions && <p className="text-xs text-gray-400">Cargando catálogo de regiones y tiendas...</p>}
      </Card>
    </>
  )
}
