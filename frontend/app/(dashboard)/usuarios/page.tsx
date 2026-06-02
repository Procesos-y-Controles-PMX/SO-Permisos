'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Table, { type Column } from '@/components/ui/Table'
import Modal from '@/components/ui/Modal'
import UsuarioFormModal from '@/components/usuarios/UsuarioFormModal'
import { useAuth } from '@/contexts/AuthContext'
import { useUsuarios } from '@/hooks/useUsuarios'
import TablePagination, { TABLE_PAGE_SIZE } from '@/components/ui/TablePagination'
import type { Perfil, PerfilFormValues, RolUsuario } from '@/types'

const PAGE_SIZE = TABLE_PAGE_SIZE

const selectClass =
  'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] appearance-none cursor-pointer'

const searchInputClass =
  'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)]'

const ROL_SORT_ORDER: Record<RolUsuario, number> = {
  Admin: 0,
  Regional: 1,
  Tienda: 2,
}

const USUARIOS_STORAGE = {
  search: 'usuarios_search_text',
  rol: 'usuarios_filter_rol',
  region: 'usuarios_filter_region',
  page: 'usuarios_page',
} as const

function rolBadgeVariant(nombre: string | undefined): 'info' | 'warning' | 'neutral' {
  switch (nombre) {
    case 'Admin':
      return 'info'
    case 'Tienda':
      return 'warning'
    default:
      return 'neutral'
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

function getUsuarioSearchHaystack(u: Perfil): string {
  const parts = [
    u.nombre_completo,
    u.email,
    u.rol?.nombre_rol,
    u.tienda?.sucursal,
    u.region?.nombre_region,
    u.tienda?.region?.nombre_region,
  ]
  return parts.filter(Boolean).join(' ').toLowerCase()
}

function getUsuarioRegionNombre(u: Perfil): string | null {
  return u.region?.nombre_region ?? u.tienda?.region?.nombre_region ?? null
}

function sortUsuariosByRol(list: Perfil[]): Perfil[] {
  return [...list].sort((a, b) => {
    const orderA = a.rol?.nombre_rol ? ROL_SORT_ORDER[a.rol.nombre_rol] : 99
    const orderB = b.rol?.nombre_rol ? ROL_SORT_ORDER[b.rol.nombre_rol] : 99
    if (orderA !== orderB) return orderA - orderB
    return (a.nombre_completo || a.email).localeCompare(b.nombre_completo || b.email, 'es')
  })
}

export default function UsuariosPage() {
  const router = useRouter()
  const { perfil, isAdmin, loading: authLoading } = useAuth()
  const {
    usuarios,
    roles,
    tiendas,
    regiones,
    loading,
    error,
    createUsuario,
    updateUsuario,
    deleteUsuario,
  } = useUsuarios()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Perfil | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Perfil | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [filterRol, setFilterRol] = useState('')
  const [filterRegion, setFilterRegion] = useState('')
  const [page, setPage] = useState(1)
  const filtersRestored = useRef(false)

  useEffect(() => {
    try {
      const savedSearch = sessionStorage.getItem(USUARIOS_STORAGE.search)
      const savedRol = sessionStorage.getItem(USUARIOS_STORAGE.rol)
      const savedRegion = sessionStorage.getItem(USUARIOS_STORAGE.region)
      const savedPage = sessionStorage.getItem(USUARIOS_STORAGE.page)

      if (savedSearch !== null) setSearchText(savedSearch)
      if (savedRol !== null) setFilterRol(savedRol)
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
      sessionStorage.setItem(USUARIOS_STORAGE.page, '1')
    } catch {
      // ignore
    }
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchText(value)
    try {
      sessionStorage.setItem(USUARIOS_STORAGE.search, value)
    } catch {
      // ignore
    }
    if (filtersRestored.current) resetPageToFirst()
  }

  const handleFilterRolChange = (value: string) => {
    setFilterRol(value)
    try {
      sessionStorage.setItem(USUARIOS_STORAGE.rol, value)
    } catch {
      // ignore
    }
    if (filtersRestored.current) resetPageToFirst()
  }

  const handleFilterRegionChange = (value: string) => {
    setFilterRegion(value)
    try {
      sessionStorage.setItem(USUARIOS_STORAGE.region, value)
    } catch {
      // ignore
    }
    if (filtersRestored.current) resetPageToFirst()
  }

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage)
    try {
      sessionStorage.setItem(USUARIOS_STORAGE.page, String(nextPage))
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/directorio')
    }
  }, [authLoading, isAdmin, router])

  const hasActiveFilters = Boolean(searchText.trim() || filterRol || filterRegion)

  const filteredUsuarios = useMemo(() => {
    let list = usuarios

    if (filterRol) {
      list = list.filter((u) => u.id_rol === Number(filterRol))
    }

    if (filterRegion) {
      list = list.filter((u) => getUsuarioRegionNombre(u) === filterRegion)
    }

    const q = searchText.trim().toLowerCase()
    if (q) {
      list = list.filter((u) => getUsuarioSearchHaystack(u).includes(q))
    }

    return sortUsuariosByRol(list)
  }, [usuarios, searchText, filterRol, filterRegion])

  const totalPages = Math.max(1, Math.ceil(filteredUsuarios.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const paginatedUsuarios = useMemo(
    () =>
      filteredUsuarios.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredUsuarios, safePage],
  )

  const subtitle = useMemo(() => {
    const total = usuarios.length
    const filtered = filteredUsuarios.length
    if (hasActiveFilters && filtered !== total) {
      return `${filtered} de ${total} cuenta${total !== 1 ? 's' : ''}`
    }
    return `${total} cuenta${total !== 1 ? 's' : ''} registrada${total !== 1 ? 's' : ''}`
  }, [usuarios.length, filteredUsuarios.length, hasActiveFilters])

  const emptyMessage = hasActiveFilters
    ? 'No se encontraron usuarios con los filtros aplicados.'
    : 'No hay usuarios registrados.'

  const handleOpenCreate = () => {
    setEditing(null)
    setFormOpen(true)
    setActionError(null)
  }

  const handleOpenEdit = (usuario: Perfil) => {
    if (usuario.id === perfil?.id) return
    setEditing(usuario)
    setFormOpen(true)
    setActionError(null)
  }

  const handleSubmit = useCallback(
    async (values: PerfilFormValues) => {
      setSaving(true)
      try {
        const result = editing
          ? await updateUsuario(editing.id, values)
          : await createUsuario(values)

        if (result.error) return result
        return { error: null }
      } finally {
        setSaving(false)
      }
    },
    [editing, createUsuario, updateUsuario],
  )

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setActionError(null)

    const result = await deleteUsuario(deleteTarget.id)
    setDeleting(false)

    if (result.error) {
      setActionError(result.error)
      return
    }

    if (deleteTarget.id === perfil?.id) {
      router.push('/login')
      return
    }

    setDeleteTarget(null)
  }

  const columns: Column<Perfil>[] = [
    {
      key: 'nombre_completo',
      header: 'Nombre',
      render: (u) => {
        const isSelf = perfil?.id === u.id
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-800">{u.nombre_completo || '—'}</span>
            {isSelf && (
              <Badge variant="neutral" className="text-[10px]">
                Tu cuenta
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      key: 'email',
      header: 'Correo',
      render: (u) => <span className="text-gray-600">{u.email}</span>,
    },
    {
      key: 'rol',
      header: 'Rol',
      render: (u) => (
        <Badge variant={rolBadgeVariant(u.rol?.nombre_rol)}>{u.rol?.nombre_rol ?? '—'}</Badge>
      ),
    },
    {
      key: 'tienda',
      header: 'Tienda',
      render: (u) => (
        <span className="text-gray-600">{u.tienda?.sucursal ?? '—'}</span>
      ),
    },
    {
      key: 'region',
      header: 'Región',
      render: (u) => (
        <span className="text-gray-600">{getUsuarioRegionNombre(u) ?? '—'}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Alta',
      render: (u) => <span className="text-gray-500 text-[12px]">{formatDate(u.created_at)}</span>,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      className: 'text-right',
      render: (u) => {
        const isSelf = perfil?.id === u.id
        return (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={isSelf}
              title={isSelf ? 'No puedes editar tu propia cuenta' : undefined}
              onClick={() => handleOpenEdit(u)}
              className="text-[12px] font-medium text-red-600 hover:text-red-700 px-2 py-1 rounded-md hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-red-600"
            >
              Editar
            </button>
            <button
              type="button"
              disabled={isSelf}
              title={isSelf ? 'No puedes eliminar tu propia cuenta' : undefined}
              onClick={() => {
                setActionError(null)
                setDeleteTarget(u)
              }}
              className="text-[12px] font-medium text-gray-500 hover:text-red-600 px-2 py-1 rounded-md hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Eliminar
            </button>
          </div>
        )
      },
    },
  ]

  if (authLoading || !isAdmin) {
    return (
      <>
        <PageHeader title="Usuarios" subtitle="Cargando..." />
        <Card className="animate-pulse">
          <div className="h-64 bg-gray-100 rounded-lg" />
        </Card>
      </>
    )
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Usuarios" subtitle="Cargando..." />
        <Card className="animate-pulse">
          <div className="h-64 bg-gray-100 rounded-lg" />
        </Card>
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader title="Usuarios" subtitle="Error al cargar" />
        <Card className="text-center py-10">
          <p className="text-red-500 text-sm">{error}</p>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Usuarios"
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
            Nuevo usuario
          </button>
        }
      />

      {actionError && !deleteTarget && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {actionError}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="w-full sm:w-40">
          <select
            value={filterRol}
            onChange={(e) => handleFilterRolChange(e.target.value)}
            className={selectClass}
          >
            <option value="">Todos los roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre_rol}
              </option>
            ))}
          </select>
        </div>
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
            type="text"
            placeholder="Buscar por nombre, correo, rol, tienda o región..."
            value={searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            className={searchInputClass}
          />
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          data={paginatedUsuarios}
          keyExtractor={(u) => u.id}
          emptyMessage={emptyMessage}
        />

        <TablePagination
          totalItems={filteredUsuarios.length}
          pageSize={PAGE_SIZE}
          page={page}
          onPageChange={handlePageChange}
        />
      </Card>

      <UsuarioFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        usuario={editing}
        roles={roles}
        tiendas={tiendas}
        regiones={regiones}
        onSubmit={handleSubmit}
        saving={saving}
      />

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Eliminar usuario"
        actions={
          <>
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
          </>
        }
      >
        {deleteTarget && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              ¿Eliminar a{' '}
              <strong>{deleteTarget.nombre_completo || deleteTarget.email}</strong>? Las
              notificaciones asociadas se eliminarán. Las solicitudes que haya revisado
              conservarán el historial sin revisor asignado.
            </p>
            {actionError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {actionError}
              </p>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
