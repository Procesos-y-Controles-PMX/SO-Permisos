'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Table, { type Column } from '@/components/ui/Table'
import Modal from '@/components/ui/Modal'
import PermisoFormModal from '@/components/permisos/PermisoFormModal'
import { useAuth } from '@/contexts/AuthContext'
import {
  usePermisosAdmin,
  type PermisoAdminRow,
  type PermisoFormValues,
} from '@/hooks/usePermisosAdmin'
import TablePagination, { TABLE_PAGE_SIZE } from '@/components/ui/TablePagination'

const PAGE_SIZE = TABLE_PAGE_SIZE

const searchInputClass =
  'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)]'

const PERMISOS_STORAGE = {
  search: 'permisos_search_text',
  page: 'permisos_page',
} as const

export default function PermisosPage() {
  const router = useRouter()
  const { isAdmin, loading: authLoading } = useAuth()
  const { permisos, loading, error, createPermiso, updatePermiso, deletePermiso } =
    usePermisosAdmin()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<PermisoAdminRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PermisoAdminRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const filtersRestored = useRef(false)

  useEffect(() => {
    try {
      const savedSearch = sessionStorage.getItem(PERMISOS_STORAGE.search)
      const savedPage = sessionStorage.getItem(PERMISOS_STORAGE.page)

      if (savedSearch !== null) setSearchText(savedSearch)
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
      sessionStorage.setItem(PERMISOS_STORAGE.page, '1')
    } catch {
      // ignore
    }
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchText(value)
    try {
      sessionStorage.setItem(PERMISOS_STORAGE.search, value)
    } catch {
      // ignore
    }
    if (filtersRestored.current) resetPageToFirst()
  }

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage)
    try {
      sessionStorage.setItem(PERMISOS_STORAGE.page, String(nextPage))
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
    if (!searchText) return permisos
    const q = searchText.toLowerCase()
    return permisos.filter((p) => p.nombre_permiso.toLowerCase().includes(q))
  }, [permisos, searchText])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  )

  const subtitle = useMemo(() => {
    const total = permisos.length
    if (filtered.length !== total) {
      return `${filtered.length} de ${total} permiso${total !== 1 ? 's' : ''}`
    }
    return `${total} permiso${total !== 1 ? 's' : ''} en catálogo`
  }, [permisos.length, filtered.length])

  const handleOpenCreate = () => {
    setActionError(null)
    setEditing(null)
    setFormOpen(true)
  }

  const handleOpenEdit = (permiso: PermisoAdminRow) => {
    setActionError(null)
    setEditing(permiso)
    setFormOpen(true)
  }

  const handleSubmit = useCallback(
    async (values: PermisoFormValues) => {
      setSaving(true)
      try {
        const result = editing
          ? await updatePermiso(editing.id, values)
          : await createPermiso(values)
        if (result.error) return result
        return { error: null }
      } finally {
        setSaving(false)
      }
    },
    [editing, createPermiso, updatePermiso],
  )

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setActionError(null)

    const result = await deletePermiso(deleteTarget.id)
    setDeleting(false)

    if (result.error) {
      setActionError(result.error)
      return
    }

    setDeleteTarget(null)
  }

  const columns: Column<PermisoAdminRow>[] = [
    {
      key: 'nombre',
      header: 'Permiso',
      render: (p) => <span className="font-medium text-slate-800">{p.nombre_permiso}</span>,
    },
    {
      key: 'ponderacion',
      header: 'Ponderación',
      render: (p) => <span className="text-gray-600 tabular-nums">{p.ponderacion}</span>,
    },
    {
      key: 'tiendas',
      header: 'Sucursales',
      render: (p) => <span className="text-gray-600 tabular-nums">{p.tiendaCount}</span>,
    },
    {
      key: 'vigentes',
      header: 'Vigentes',
      render: (p) => <span className="text-gray-600 tabular-nums">{p.vigenteCount}</span>,
    },
    {
      key: 'solicitudes',
      header: 'Solicitudes',
      render: (p) => <span className="text-gray-600 tabular-nums">{p.solicitudCount}</span>,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      className: 'text-right',
      render: (p) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => handleOpenEdit(p)}
            className="text-[12px] font-medium text-red-600 hover:text-red-700 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => {
              setActionError(null)
              setDeleteTarget(p)
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
        <PageHeader title="Permisos" subtitle="Cargando..." />
        <Card className="animate-pulse">
          <div className="h-64 bg-gray-100 rounded-lg" />
        </Card>
      </>
    )
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Permisos" subtitle="Cargando..." />
        <Card className="animate-pulse">
          <div className="h-64 bg-gray-100 rounded-lg" />
        </Card>
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader title="Permisos" subtitle="Error al cargar" />
        <Card className="text-center py-10">
          <p className="text-red-500 text-sm">{error}</p>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Permisos"
        subtitle={subtitle}
        actions={
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-[13px] font-medium rounded-lg transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo permiso
          </button>
        }
      />

      {actionError && !deleteTarget && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {actionError}
        </p>
      )}

      <div className="mb-5">
        <input
          type="search"
          placeholder="Buscar por nombre de permiso..."
          value={searchText}
          onChange={(e) => handleSearchChange(e.target.value)}
          className={searchInputClass}
        />
      </div>

      <Card>
        <Table
          columns={columns}
          data={paginated}
          keyExtractor={(p) => p.id}
          emptyMessage="No hay permisos que coincidan con la búsqueda."
        />
        <TablePagination
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          page={safePage}
          onPageChange={handlePageChange}
        />
      </Card>

      <PermisoFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        permiso={editing}
        onSubmit={handleSubmit}
        saving={saving}
      />

      <Modal
        open={!!deleteTarget}
        onClose={() => {
          if (!deleting) setDeleteTarget(null)
        }}
        title="Eliminar permiso"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-[13px] text-gray-600">
              ¿Eliminar el permiso{' '}
              <span className="font-semibold text-slate-800">{deleteTarget.nombre_permiso}</span>?
            </p>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 space-y-1">
              <p className="text-[12px] text-gray-600">
                Sucursales con este permiso:{' '}
                <span className="font-semibold tabular-nums">{deleteTarget.tiendaCount}</span>
              </p>
              <p className="text-[12px] text-gray-600">
                Registros vigentes:{' '}
                <span className="font-semibold tabular-nums">{deleteTarget.vigenteCount}</span>
              </p>
              <p className="text-[12px] text-gray-600">
                Solicitudes:{' '}
                <span className="font-semibold tabular-nums">{deleteTarget.solicitudCount}</span>
              </p>
            </div>
            <div className="bg-amber-50/80 border border-amber-100 rounded-lg p-3">
              <p className="text-[12px] text-amber-900 leading-relaxed">
                Se eliminarán en cascada las configuraciones por sucursal, permisos vigentes y
                solicitudes asociadas a este permiso. Los archivos PDF en almacenamiento no se
                borran automáticamente.
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
