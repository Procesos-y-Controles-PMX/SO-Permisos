'use client'

import { useEffect, useMemo, useState } from 'react'
import Modal from '@/components/ui/Modal'
import type { Perfil, PerfilFormValues, Rol, Region } from '@/types'
import { ROL_IDS } from '@/types'
import type { TiendaFormOption } from '@/hooks/useUsuarios'

const inputClass =
  'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all'

interface UsuarioFormModalProps {
  open: boolean
  onClose: () => void
  usuario?: Perfil | null
  roles: Rol[]
  tiendas: TiendaFormOption[]
  regiones: Pick<Region, 'id' | 'nombre_region'>[]
  onSubmit: (values: PerfilFormValues) => Promise<{ error: string | null }>
  saving?: boolean
}

function emptyForm(): PerfilFormValues {
  return {
    email: '',
    password: '',
    nombre_completo: '',
    id_rol: ROL_IDS.Admin,
    id_tienda: null,
    id_region: null,
  }
}

function perfilToForm(usuario: Perfil): PerfilFormValues {
  const regionFiltroTienda =
    usuario.tienda?.id_region || usuario.tienda?.region?.id || null

  return {
    email: usuario.email,
    password: '',
    nombre_completo: usuario.nombre_completo ?? '',
    id_rol: usuario.id_rol,
    id_tienda: usuario.id_tienda,
    id_region:
      usuario.id_rol === ROL_IDS.Tienda
        ? regionFiltroTienda
        : usuario.id_rol === ROL_IDS.Regional
          ? usuario.id_region
          : null,
  }
}

export default function UsuarioFormModal({
  open,
  onClose,
  usuario,
  roles,
  tiendas,
  regiones,
  onSubmit,
  saving = false,
}: UsuarioFormModalProps) {
  const isEdit = Boolean(usuario)
  const [form, setForm] = useState<PerfilFormValues>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setFormError(null)
    setForm(usuario ? perfilToForm(usuario) : emptyForm())
  }, [open, usuario])

  const showRegionRegional = form.id_rol === ROL_IDS.Regional
  const showRegionFiltroTienda = form.id_rol === ROL_IDS.Tienda
  const showTienda = form.id_rol === ROL_IDS.Tienda

  const tiendasEnRegion = useMemo(() => {
    if (!form.id_region) return []
    return tiendas.filter((t) => t.id_region === form.id_region)
  }, [tiendas, form.id_region])

  const handleRolChange = (idRol: number) => {
    setForm((prev) => {
      if (idRol === ROL_IDS.Admin) {
        return { ...prev, id_rol: idRol, id_tienda: null, id_region: null }
      }
      if (idRol === ROL_IDS.Regional) {
        return {
          ...prev,
          id_rol: idRol,
          id_tienda: null,
          id_region:
            prev.id_rol === ROL_IDS.Tienda || prev.id_rol === ROL_IDS.Regional
              ? prev.id_region
              : null,
        }
      }
      // Tienda
      const regionFiltro =
        prev.id_rol === ROL_IDS.Regional || prev.id_rol === ROL_IDS.Tienda
          ? prev.id_region
          : null
      const tiendaValida =
        prev.id_tienda &&
        tiendas.find((t) => t.id === prev.id_tienda && t.id_region === regionFiltro)
      return {
        ...prev,
        id_rol: idRol,
        id_region: regionFiltro,
        id_tienda: tiendaValida ? prev.id_tienda : null,
      }
    })
  }

  const handleRegionFiltroChange = (idRegion: number | null) => {
    setForm((prev) => {
      const tienda = prev.id_tienda ? tiendas.find((t) => t.id === prev.id_tienda) : null
      const id_tienda =
        tienda && idRegion && tienda.id_region === idRegion ? prev.id_tienda : null
      return { ...prev, id_region: idRegion, id_tienda }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const result = await onSubmit(form)
    if (result.error) {
      setFormError(result.error)
      return
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar usuario' : 'Nuevo usuario'}
      actions={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="usuario-form"
            disabled={saving}
            className="px-4 py-2 text-[13px] font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
          </button>
        </>
      }
    >
      <form id="usuario-form" onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {formError}
          </p>
        )}

        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Nombre completo
          </label>
          <input
            type="text"
            value={form.nombre_completo}
            onChange={(e) => setForm((p) => ({ ...p, nombre_completo: e.target.value }))}
            className={inputClass}
            placeholder="Ej. Juan Pérez"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Correo electrónico *
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className={inputClass}
            placeholder="usuario@empresa.com"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Contraseña {isEdit ? '' : '*'}
          </label>
          <input
            type="password"
            required={!isEdit}
            value={form.password ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            className={inputClass}
            placeholder={isEdit ? 'Dejar vacío para no cambiar' : 'Contraseña de acceso'}
            autoComplete={isEdit ? 'new-password' : 'new-password'}
          />
          {isEdit && (
            <p className="text-[11px] text-gray-400 mt-1">Dejar vacío para mantener la contraseña actual.</p>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Rol *
          </label>
          <select
            required
            value={form.id_rol}
            onChange={(e) => handleRolChange(Number(e.target.value))}
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre_rol}
              </option>
            ))}
          </select>
        </div>

        {showRegionRegional && (
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Región *
            </label>
            <select
              required
              value={form.id_region ?? ''}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  id_region: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className={`${inputClass} appearance-none cursor-pointer`}
            >
              <option value="">Seleccionar región...</option>
              {regiones.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre_region}
                </option>
              ))}
            </select>
          </div>
        )}

        {showRegionFiltroTienda && (
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Región *
            </label>
            <select
              required
              value={form.id_region ?? ''}
              onChange={(e) =>
                handleRegionFiltroChange(e.target.value ? Number(e.target.value) : null)
              }
              className={`${inputClass} appearance-none cursor-pointer`}
            >
              <option value="">Seleccionar región...</option>
              {regiones.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre_region}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">
              Selecciona la región para elegir la tienda.
            </p>
          </div>
        )}

        {showTienda && (
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Tienda *
            </label>
            <select
              required
              disabled={!form.id_region}
              value={form.id_tienda ?? ''}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  id_tienda: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className={`${inputClass} appearance-none cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed`}
            >
              <option value="">
                {!form.id_region
                  ? 'Primero selecciona una región...'
                  : tiendasEnRegion.length === 0
                    ? 'No hay tiendas en esta región'
                    : 'Seleccionar tienda...'}
              </option>
              {tiendasEnRegion.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.sucursal}
                </option>
              ))}
            </select>
            {form.id_region && tiendasEnRegion.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">No hay tiendas en esta región.</p>
            )}
          </div>
        )}
      </form>
    </Modal>
  )
}
