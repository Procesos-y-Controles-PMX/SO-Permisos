'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Table, { type Column } from '@/components/ui/Table'
import Modal from '@/components/ui/Modal'
import SucursalFormModal from '@/components/sucursales/SucursalFormModal'
import RegionFormModal from '@/components/sucursales/RegionFormModal'
import { useAuth } from '@/contexts/AuthContext'
import {
  useSucursalesAdmin,
  type RegionAdminRow,
  type RegionFormValues,
  type TiendaAdminRow,
  type TiendaFormValues,
} from '@/hooks/useSucursalesAdmin'
import TablePagination, { TABLE_PAGE_SIZE } from '@/components/ui/TablePagination'

const PAGE_SIZE = TABLE_PAGE_SIZE

const selectClass =
  'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] appearance-none cursor-pointer'

const searchInputClass =
  'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)]'

const SUCURSALES_STORAGE = {
  search: 'sucursales_search_text',
  region: 'sucursales_filter_region',
  page: 'sucursales_page',
} as const

export default function SucursalesPage() {
  const router = useRouter()
  const { isAdmin, loading: authLoading } = useAuth()
  const {
    tiendas,
    regiones,
    catalogo,
    loading,
    error,
    getPermisosAsignados,
    createRegion,
    updateRegion,
    deleteRegion,
    createTienda,
    updateTienda,
    deleteTienda,
  } = useSucursalesAdmin()

  const [regionFormOpen, setRegionFormOpen] = useState(false)
  const [editingRegion, setEditingRegion] = useState<RegionAdminRow | null>(null)
  const [deleteRegionTarget, setDeleteRegionTarget] = useState<RegionAdminRow | null>(null)
  const [deletingRegion, setDeletingRegion] = useState(false)
  const [savingRegion, setSavingRegion] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TiendaAdminRow | null>(null)
  const [permisosEdit, setPermisosEdit] = useState<number[]>([])
  const [loadingPermisos, setLoadingPermisos] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TiendaAdminRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [filterRegion, setFilterRegion] = useState('')
  const [page, setPage] = useState(1)
  const filtersRestored = useRef(false)

  useEffect(() => {
    try {
      const savedSearch = sessionStorage.getItem(SUCURSALES_STORAGE.search)
      const savedRegion = sessionStorage.getItem(SUCURSALES_STORAGE.region)
      const savedPage = sessionStorage.getItem(SUCURSALES_STORAGE.page)

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
      sessionStorage.setItem(SUCURSALES_STORAGE.page, '1')
    } catch {
      // ignore
    }
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchText(value)
    try {
      sessionStorage.setItem(SUCURSALES_STORAGE.search, value)
    } catch {
      // ignore
    }
    if (filtersRestored.current) resetPageToFirst()
  }

  const handleFilterRegionChange = (value: string) => {
    setFilterRegion(value)
    try {
      sessionStorage.setItem(SUCURSALES_STORAGE.region, value)
    } catch {
      // ignore
    }
    if (filtersRestored.current) resetPageToFirst()
  }

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage)
    try {
      sessionStorage.setItem(SUCURSALES_STORAGE.page, String(nextPage))
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/directorio')
    }
  }, [authLoading, isAdmin, router])

  const filtered = useMemo(() => {
    return tiendas.filter((t) => {
      const matchRegion =
        !filterRegion || t.region?.nombre_region === filterRegion
      const matchSearch =
        !searchText ||
        t.sucursal.toLowerCase().includes(searchText.toLowerCase()) ||
        (t.gerente_tienda?.toLowerCase().includes(searchText.toLowerCase()) ?? false)
      return matchRegion && matchSearch
    })
  }, [tiendas, filterRegion, searchText])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  )

  const subtitle = useMemo(() => {
    const total = tiendas.length
    if (filtered.length !== total) {
      return `${filtered.length} de ${total} sucursal${total !== 1 ? 'es' : ''}`
    }
    return `${total} sucursal${total !== 1 ? 'es' : ''} registrada${total !== 1 ? 's' : ''}`
  }, [tiendas.length, filtered.length])

  const handleOpenCreateRegion = () => {
    setActionError(null)
    setEditingRegion(null)
    setRegionFormOpen(true)
  }

  const handleOpenEditRegion = (region: RegionAdminRow) => {
    setActionError(null)
    setEditingRegion(region)
    setRegionFormOpen(true)
  }

  const handleFilterByRegion = (nombreRegion: string) => {
    handleFilterRegionChange(nombreRegion)
    document.getElementById('sucursales-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleOpenCreate = () => {
    setEditing(null)
    setPermisosEdit([])
    setActionError(null)
    setFormOpen(true)
  }

  const handleSubmitRegion = useCallback(
    async (values: RegionFormValues) => {
      setSavingRegion(true)
      try {
        const result = editingRegion
          ? await updateRegion(editingRegion.id, values)
          : await createRegion(values)
        if (result.error) return result
        return { error: null }
      } finally {
        setSavingRegion(false)
      }
    },
    [editingRegion, createRegion, updateRegion],
  )

  const handleConfirmDeleteRegion = async () => {
    if (!deleteRegionTarget) return
    setDeletingRegion(true)
    setActionError(null)

    const result = await deleteRegion(deleteRegionTarget.id)
    setDeletingRegion(false)

    if (result.error) {
      setActionError(result.error)
      return
    }

    setDeleteRegionTarget(null)
  }

  const handleOpenEdit = useCallback(
    async (tienda: TiendaAdminRow) => {
      setActionError(null)
      setEditing(tienda)
      setLoadingPermisos(true)
      setFormOpen(true)
      const ids = await getPermisosAsignados(tienda.id)
      setPermisosEdit(ids)
      setLoadingPermisos(false)
    },
    [getPermisosAsignados],
  )

  const handleSubmit = useCallback(
    async (values: TiendaFormValues) => {
      setSaving(true)
      try {
        const result = editing
          ? await updateTienda(editing.id, values)
          : await createTienda(values)
        if (result.error) return result
        return { error: null }
      } finally {
        setSaving(false)
      }
    },
    [editing, createTienda, updateTienda],
  )

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setActionError(null)

    const result = await deleteTienda(deleteTarget.id)
    setDeleting(false)

    if (result.error) {
      setActionError(result.error)
      return
    }

    setDeleteTarget(null)
  }

  const regionColumns: Column<RegionAdminRow>[] = [
    {
      key: 'nombre_region',
      header: 'Región',
      render: (r) => <span className="font-medium text-slate-800">{r.nombre_region}</span>,
    },
    {
      key: 'gerente',
      header: 'Gerente regional',
      render: (r) => <span className="text-gray-600">{r.gerente_regional ?? '—'}</span>,
    },
    {
      key: 'contacto',
      header: 'Contacto',
      render: (r) => (
        <span className="text-gray-600 text-[12px]">
          {[r.celular, r.correo].filter(Boolean).join(' · ') || '—'}
        </span>
      ),
    },
    {
      key: 'tiendas',
      header: 'Sucursales',
      render: (r) =>
        r.tiendaCount > 0 ? (
          <button
            type="button"
            onClick={() => handleFilterByRegion(r.nombre_region)}
            className="text-red-600 hover:text-red-700 tabular-nums font-medium hover:underline"
            title="Ver sucursales de esta región"
          >
            {r.tiendaCount}
          </button>
        ) : (
          <span className="text-gray-400 tabular-nums">0</span>
        ),
    },
    {
      key: 'usuarios',
      header: 'Usuarios Regional',
      render: (r) => <span className="text-gray-600 tabular-nums">{r.usuarioCount}</span>,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => handleOpenEditRegion(r)}
            className="text-[12px] font-medium text-red-600 hover:text-red-700 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => {
              setActionError(null)
              setDeleteRegionTarget(r)
            }}
            className="text-[12px] font-medium text-gray-500 hover:text-red-600 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
          >
            Eliminar
          </button>
        </div>
      ),
    },
  ]

  const columns: Column<TiendaAdminRow>[] = [
    {
      key: 'sucursal',
      header: 'Sucursal',
      render: (t) => <span className="font-medium text-slate-800">{t.sucursal}</span>,
    },
    {
      key: 'region',
      header: 'Región',
      render: (t) => <span className="text-gray-600">{t.region?.nombre_region ?? '—'}</span>,
    },
    {
      key: 'gerente',
      header: 'Gerente',
      render: (t) => <span className="text-gray-600">{t.gerente_tienda ?? '—'}</span>,
    },
    {
      key: 'contacto',
      header: 'Contacto',
      render: (t) => (
        <span className="text-gray-600 text-[12px]">
          {[t.celular, t.correo].filter(Boolean).join(' · ') || '—'}
        </span>
      ),
    },
    {
      key: 'centro',
      header: 'Centro / CC',
      render: (t) => (
        <span className="text-gray-500 text-[12px] font-mono">
          {[t.centro, t.cc].filter(Boolean).join(' / ') || '—'}
        </span>
      ),
    },
    {
      key: 'permisos',
      header: 'Permisos',
      render: (t) => (
        <span className="text-gray-600 tabular-nums">{t.permisoCount}</span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      className: 'text-right',
      render: (t) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => handleOpenEdit(t)}
            className="text-[12px] font-medium text-red-600 hover:text-red-700 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => {
              setActionError(null)
              setDeleteTarget(t)
            }}
            className="text-[12px] font-medium text-gray-500 hover:text-red-600 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
          >
            Eliminar
          </button>
        </div>
      ),
    },
  ]

  if (authLoading || !isAdmin) {
    return (
      <>
        <PageHeader title="Sucursales" subtitle="Cargando..." />
        <Card className="animate-pulse">
          <div className="h-64 bg-gray-100 rounded-lg" />
        </Card>
      </>
    )
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Sucursales" subtitle="Cargando..." />
        <Card className="animate-pulse">
          <div className="h-64 bg-gray-100 rounded-lg" />
        </Card>
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader title="Sucursales" subtitle="Error al cargar" />
        <Card className="text-center py-10">
          <p className="text-red-500 text-sm">{error}</p>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Sucursales"
        subtitle={subtitle}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleOpenCreateRegion}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 text-[13px] font-medium rounded-lg transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nueva región
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-[13px] font-medium rounded-lg transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nueva sucursal
            </button>
          </div>
        }
      />

      {actionError && !deleteTarget && !deleteRegionTarget && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {actionError}
        </p>
      )}

      <Card className="mb-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-[15px] font-bold text-slate-800">Regiones</h2>
            <p className="text-[11px] text-gray-400">
              {regiones.length} región{regiones.length !== 1 ? 'es' : ''} registrada
              {regiones.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Table
          columns={regionColumns}
          data={regiones}
          keyExtractor={(r) => r.id}
          emptyMessage="No hay regiones. Crea una para asignarla a las sucursales."
        />
      </Card>

      <div id="sucursales-list" className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="w-full sm:w-52">
          <select
            value={filterRegion}
            onChange={(e) => handleFilterRegionChange(e.target.value)}
            className={selectClass}
          >
            <option value="">Todas las regiones</option>
            {regiones.map((r) => (
              <option key={r.id} value={r.nombre_region}>
                {r.nombre_region}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <input
            type="search"
            placeholder="Buscar por sucursal o gerente..."
            value={searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            className={searchInputClass}
          />
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          data={paginated}
          keyExtractor={(t) => t.id}
          emptyMessage="No hay sucursales que coincidan con los filtros."
        />
        <TablePagination
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          page={safePage}
          onPageChange={handlePageChange}
        />
      </Card>

      <RegionFormModal
        open={regionFormOpen}
        onClose={() => {
          setRegionFormOpen(false)
          setEditingRegion(null)
        }}
        region={editingRegion}
        onSubmit={handleSubmitRegion}
        saving={savingRegion}
      />

      <SucursalFormModal
        open={formOpen && !loadingPermisos}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
          setPermisosEdit([])
        }}
        tienda={editing}
        permisosIniciales={permisosEdit}
        regiones={regiones}
        catalogo={catalogo}
        onSubmit={handleSubmit}
        saving={saving}
      />

      {formOpen && loadingPermisos && (
        <Card className="fixed inset-0 z-50 m-auto max-w-sm h-fit text-center py-8 shadow-xl">
          <p className="text-sm text-gray-500">Cargando permisos...</p>
        </Card>
      )}

      <Modal
        open={!!deleteRegionTarget}
        onClose={() => {
          if (!deletingRegion) setDeleteRegionTarget(null)
        }}
        title="Eliminar región"
      >
        {deleteRegionTarget && (
          <div className="space-y-4">
            <p className="text-[13px] text-gray-600">
              ¿Eliminar la región{' '}
              <span className="font-semibold text-slate-800">{deleteRegionTarget.nombre_region}</span>?
            </p>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 space-y-1">
              <p className="text-[12px] text-gray-600">
                Sucursales vinculadas:{' '}
                <span className="font-semibold tabular-nums">{deleteRegionTarget.tiendaCount}</span>
              </p>
              <p className="text-[12px] text-gray-600">
                Usuarios Regional vinculados:{' '}
                <span className="font-semibold tabular-nums">{deleteRegionTarget.usuarioCount}</span>
              </p>
            </div>
            {(deleteRegionTarget.tiendaCount > 0 || deleteRegionTarget.usuarioCount > 0) && (
              <div className="bg-amber-50/80 border border-amber-100 rounded-lg p-3">
                <p className="text-[12px] text-amber-900 leading-relaxed">
                  No se puede eliminar hasta reasignar o quitar todas las sucursales y usuarios
                  Regional vinculados a esta región.
                </p>
              </div>
            )}
            {deleteRegionTarget.tiendaCount === 0 && deleteRegionTarget.usuarioCount === 0 && (
              <div className="bg-amber-50/80 border border-amber-100 rounded-lg p-3">
                <p className="text-[12px] text-amber-900 leading-relaxed">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            )}
            {actionError && deleteRegionTarget && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {actionError}
              </p>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteRegionTarget(null)}
                disabled={deletingRegion}
                className="px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRegion}
                disabled={
                  deletingRegion ||
                  deleteRegionTarget.tiendaCount > 0 ||
                  deleteRegionTarget.usuarioCount > 0
                }
                className="px-4 py-2 text-[13px] font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {deletingRegion ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => {
          if (!deleting) setDeleteTarget(null)
        }}
        title="Eliminar sucursal"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-[13px] text-gray-600">
              ¿Eliminar la sucursal{' '}
              <span className="font-semibold text-slate-800">{deleteTarget.sucursal}</span>?
            </p>
            <div className="bg-amber-50/80 border border-amber-100 rounded-lg p-3">
              <p className="text-[12px] text-amber-900 leading-relaxed">
                Se eliminarán en cascada la configuración de permisos ({deleteTarget.permisoCount}{' '}
                asignados), permisos vigentes y solicitudes de esta sucursal. Los archivos en
                almacenamiento no se borran automáticamente.
              </p>
            </div>
            {actionError && deleteTarget && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {actionError}
              </p>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-[13px] font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
