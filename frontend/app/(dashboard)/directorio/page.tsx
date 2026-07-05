'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import TablePagination, { TABLE_PAGE_SIZE } from '@/components/ui/TablePagination'
import {
  EMPTY_STATE,
  FIELD_INPUT,
  FIELD_SELECT,
  MOBILE_LIST_CARD,
  TABLE_BODY_ROW,
  TABLE_HEAD_CELL,
} from '@/components/ui/contentStyles'
import { useTiendas } from '@/hooks/useTiendas'
import { useStoreCompliance } from '@/hooks/useStoreCompliance'
import { useAuth } from '@/contexts/AuthContext'

const PAGE_SIZE = TABLE_PAGE_SIZE

const CHEVRON =
  "bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20width%3d%2212%22%20height%3d%2212%22%20viewBox%3d%220%200%2024%2024%22%20fill%3d%22none%22%20stroke%3d%22%2364748b%22%20stroke-width%3d%222%22%3e%3cpolyline%20points%3d%226%209%2012%2015%2018%209%22%3e%3c%2fpolyline%3e%3c%2fsvg%3e')]"

function complianceBadgeClass(value: number) {
  if (value < 50) return 'border-red-100 text-red-600 bg-red-50'
  if (value < 85) return 'border-amber-100 text-amber-600 bg-amber-50'
  return 'border-emerald-100 text-emerald-600 bg-emerald-50'
}

function getFileNameFromDisposition(value: string | null): string | null {
  if (!value) return null
  const match = value.match(/filename="([^"]+)"/)
  return match?.[1] || null
}

const DIRECTORIO_STORAGE = {
  search: 'directorio_search_text',
  region: 'directorio_filter_region',
  page: 'directorio_page',
} as const

/** Clave anterior del filtro de región (compatibilidad) */
const DIRECTORIO_REGION_LEGACY = 'directorio_region_filter'

export default function DirectorioPage() {
  const router = useRouter()
  const { data: tiendas, loading, error } = useTiendas()
  const { storeComplianceMap, loading: loadingCompliance } = useStoreCompliance()
  const { perfil, isAdmin, isTienda, isRegional } = useAuth()
  const [searchText, setSearchText] = useState('')
  const [filterRegion, setFilterRegion] = useState('')
  const [page, setPage] = useState(1)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const filtersRestored = useRef(false)

  const handleDownloadStoreZip = useCallback(
    async (tiendaId: number) => {
      if (!isAdmin || !perfil?.id || downloadingId !== null) return

      setDownloadingId(tiendaId)
      setDownloadError(null)
      try {
        const response = await fetch('/api/admin/permisos-activos-zip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scope: 'store',
            tiendaId,
            adminId: perfil.id,
          }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => ({ error: 'No se pudo generar el ZIP.' }))
          throw new Error(payload.error || 'No se pudo generar el ZIP.')
        }

        const blob = await response.blob()
        const filename =
          getFileNameFromDisposition(response.headers.get('Content-Disposition')) ||
          `permisos_activos_tienda_${tiendaId}_${new Date().toISOString().slice(0, 10)}.zip`

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
      } catch (e: any) {
        setDownloadError(e.message || 'Error al descargar permisos vigentes de la tienda.')
      } finally {
        setDownloadingId(null)
      }
    },
    [isAdmin, perfil, downloadingId],
  )

  useEffect(() => {
    try {
      const savedSearch = sessionStorage.getItem(DIRECTORIO_STORAGE.search)
      const savedRegion =
        sessionStorage.getItem(DIRECTORIO_STORAGE.region) ??
        sessionStorage.getItem(DIRECTORIO_REGION_LEGACY)
      const savedPage = sessionStorage.getItem(DIRECTORIO_STORAGE.page)

      if (savedSearch !== null) setSearchText(savedSearch)
      if (savedRegion !== null) setFilterRegion(savedRegion)
      if (savedPage) {
        const p = parseInt(savedPage, 10)
        if (!Number.isNaN(p) && p >= 1) setPage(p)
      }
    } catch {
      // sessionStorage no disponible
    }
    filtersRestored.current = true
  }, [])

  const resetPageToFirst = useCallback(() => {
    setPage(1)
    try {
      sessionStorage.setItem(DIRECTORIO_STORAGE.page, '1')
    } catch {
      // ignore
    }
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchText(value)
    try {
      sessionStorage.setItem(DIRECTORIO_STORAGE.search, value)
    } catch {
      // ignore
    }
    if (filtersRestored.current) resetPageToFirst()
  }

  const handleFilterRegionChange = (value: string) => {
    setFilterRegion(value)
    try {
      sessionStorage.setItem(DIRECTORIO_STORAGE.region, value)
      sessionStorage.removeItem(DIRECTORIO_REGION_LEGACY)
    } catch {
      // ignore
    }
    if (filtersRestored.current) resetPageToFirst()
  }

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage)
    try {
      sessionStorage.setItem(DIRECTORIO_STORAGE.page, String(nextPage))
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!loading && isTienda && perfil?.id_tienda) {
      router.replace(`/directorio/${perfil.id_tienda}`)
    }
  }, [loading, isTienda, perfil, router])

  const regionOptions = useMemo(
    () => [
      { value: '', label: 'Todas las regiones' },
      ...Array.from(new Set(tiendas.map((t) => t.region?.nombre_region).filter(Boolean))).map(
        (r) => ({ value: r!, label: r! }),
      ),
    ],
    [tiendas],
  )

  const filtered = useMemo(() => {
    return tiendas.filter((t) => {
      const matchRegion = isRegional || !filterRegion || t.region?.nombre_region === filterRegion
      const matchSearch =
        !searchText || t.sucursal.toLowerCase().includes(searchText.toLowerCase())
      return matchRegion && matchSearch
    })
  }, [tiendas, filterRegion, searchText, isRegional])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const paginatedTiendas = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  )

  if (isTienda) {
    return (
      <>
        <PageHeader title="Mi tienda" subtitle="Redirigiendo a tu sucursal..." />
        <Card className="animate-pulse">
          <div className="h-64 rounded-lg bg-slate-100" />
        </Card>
      </>
    )
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Mi tienda" subtitle="Cargando sucursales..." />
        <Card className="animate-pulse">
          <div className="h-64 rounded-lg bg-slate-100" />
        </Card>
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader title="Mi tienda" subtitle="Error al cargar datos" />
        <Card className="text-center py-10">
          <p className="text-red-500 text-sm">{error}</p>
        </Card>
      </>
    )
  }

  const subtitle =
    filtered.length !== tiendas.length
      ? `${filtered.length} de ${tiendas.length} sucursales`
      : 'Consulta de sucursales — haz clic para ver detalle'

  return (
    <>
      <PageHeader eyebrow="Permisos" title="Mi tienda" subtitle={subtitle} />

      {downloadError ? (
        <div className="mb-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {downloadError}
        </div>
      ) : null}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        {!isRegional && (
          <div className="w-full sm:w-52">
            <select
              value={filterRegion}
              onChange={(e) => handleFilterRegionChange(e.target.value)}
              className={`${FIELD_SELECT} ${CHEVRON}`}
            >
              {regionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar sucursal..."
            value={searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            className={FIELD_INPUT}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={EMPTY_STATE}>
          <p>No se encontraron sucursales con los filtros aplicados.</p>
        </div>
      ) : (
        <>
          {/* Mobile — cards */}
          <div className="space-y-3 md:hidden">
            {paginatedTiendas.map((t) => {
              const compliance = storeComplianceMap[t.id] ?? 0
              return (
                <article
                  key={t.id}
                  className={`${MOBILE_LIST_CARD} cursor-pointer active:bg-slate-50`}
                  onClick={() => router.push(`/directorio/${t.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      router.push(`/directorio/${t.id}`)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{t.sucursal}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{t.region?.nombre_region ?? '—'}</p>
                    </div>
                    {loadingCompliance ? (
                      <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-slate-100" />
                    ) : (
                      <div
                        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold ${complianceBadgeClass(compliance)}`}
                      >
                        {`${compliance.toFixed(0)}%`}
                      </div>
                    )}
                  </div>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Gte. Tienda</dt>
                      <dd className="text-slate-700">{t.gerente_tienda ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Contacto</dt>
                      <dd className="text-slate-700">{t.celular ?? '—'}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/directorio/${t.id}`)
                      }}
                      className="flex-1 rounded-sm border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 transition-colors active:bg-slate-50"
                    >
                      Ver tienda
                    </button>
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          void handleDownloadStoreZip(t.id)
                        }}
                        disabled={downloadingId !== null}
                        className="flex-1 rounded-sm border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 transition-colors active:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {downloadingId === t.id ? 'Generando...' : 'Descargar permisos vigentes'}
                      </button>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>

          {/* Desktop — table */}
          <Card className="hidden overflow-hidden p-0 md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className={`${TABLE_HEAD_CELL} text-center`}>Cumplimiento</th>
                    <th className={TABLE_HEAD_CELL}>Sucursal</th>
                    <th className={TABLE_HEAD_CELL}>Región</th>
                    <th className={TABLE_HEAD_CELL}>Gte. Tienda</th>
                    <th className={TABLE_HEAD_CELL}>Contacto</th>
                    <th className={`${TABLE_HEAD_CELL} text-right`}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTiendas.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => router.push(`/directorio/${t.id}`)}
                      className={`${TABLE_BODY_ROW} group cursor-pointer`}
                    >
                      <td className="px-4 py-3 text-center">
                        {loadingCompliance ? (
                          <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-slate-100" />
                        ) : (
                          <div
                            className={`mx-auto inline-flex h-8 w-8 items-center justify-center rounded-full border-2 text-[9px] font-bold ${complianceBadgeClass(storeComplianceMap[t.id] ?? 0)}`}
                          >
                            {storeComplianceMap[t.id] !== undefined
                              ? `${storeComplianceMap[t.id].toFixed(0)}%`
                              : '0%'}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{t.sucursal}</td>
                      <td className="px-4 py-3 text-slate-500">{t.region?.nombre_region ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{t.gerente_tienda ?? '—'}</td>
                      <td className="px-4 py-3">
                        <p className="text-slate-500">{t.celular ?? '—'}</p>
                        <p className="text-[10px] text-slate-400">{t.correo ?? ''}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/directorio/${t.id}`)
                            }}
                            className="rounded-sm border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                          >
                            Ver tienda
                          </button>
                          {isAdmin ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                void handleDownloadStoreZip(t.id)
                              }}
                              disabled={downloadingId !== null}
                              className="inline-flex items-center gap-1.5 rounded-sm border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v11m0 0l-4-4m4 4l4-4m3 8v2a1 1 0 01-1 1H6a1 1 0 01-1-1v-2" />
                              </svg>
                              {downloadingId === t.id ? 'Generando...' : 'Descargar permisos vigentes'}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              page={safePage}
              onPageChange={handlePageChange}
            />
          </Card>

          <div className="md:hidden">
            <TablePagination
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              page={safePage}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}
    </>
  )
}
