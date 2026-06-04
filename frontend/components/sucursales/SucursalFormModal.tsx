'use client'

import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import type { CatalogoPermiso, Region, Tienda } from '@/types'
import type { TiendaFormValues } from '@/hooks/useSucursalesAdmin'

const inputClass =
  'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all'

interface SucursalFormModalProps {
  open: boolean
  onClose: () => void
  tienda?: Tienda | null
  permisosIniciales?: number[]
  regiones: Pick<Region, 'id' | 'nombre_region'>[]
  catalogo: CatalogoPermiso[]
  onSubmit: (values: TiendaFormValues) => Promise<{ error: string | null }>
  saving?: boolean
}

function emptyForm(): TiendaFormValues {
  return {
    sucursal: '',
    id_region: null,
    centro: '',
    cc: '',
    gerente_tienda: '',
    celular: '',
    correo: '',
    direccion_sucursal: '',
    permisosSeleccionados: [],
  }
}

function tiendaToForm(tienda: Tienda, permisos: number[]): TiendaFormValues {
  return {
    sucursal: tienda.sucursal,
    id_region: tienda.id_region ?? tienda.region?.id ?? null,
    centro: tienda.centro ?? '',
    cc: tienda.cc ?? '',
    gerente_tienda: tienda.gerente_tienda ?? '',
    celular: tienda.celular ?? '',
    correo: tienda.correo ?? '',
    direccion_sucursal: tienda.direccion_sucursal ?? '',
    permisosSeleccionados: permisos,
  }
}

export default function SucursalFormModal({
  open,
  onClose,
  tienda,
  permisosIniciales = [],
  regiones,
  catalogo,
  onSubmit,
  saving = false,
}: SucursalFormModalProps) {
  const isEdit = Boolean(tienda)
  const [form, setForm] = useState<TiendaFormValues>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setFormError(null)
    if (tienda) {
      setForm(tiendaToForm(tienda, permisosIniciales))
    } else {
      setForm(emptyForm())
    }
  }, [open, tienda, permisosIniciales])

  const togglePermiso = (id: number) => {
    setForm((prev) => {
      const has = prev.permisosSeleccionados.includes(id)
      return {
        ...prev,
        permisosSeleccionados: has
          ? prev.permisosSeleccionados.filter((p) => p !== id)
          : [...prev.permisosSeleccionados, id],
      }
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
      title={isEdit ? 'Editar sucursal' : 'Nueva sucursal'}
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
            form="sucursal-form"
            disabled={saving}
            className="px-4 py-2 text-[13px] font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear sucursal'}
          </button>
        </>
      }
    >
      <form id="sucursal-form" onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {formError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {formError}
          </p>
        )}

        <div className="space-y-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Datos de la sucursal</p>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Sucursal *
            </label>
            <input
              type="text"
              required
              value={form.sucursal}
              onChange={(e) => setForm((p) => ({ ...p, sucursal: e.target.value }))}
              className={inputClass}
              placeholder="Nombre de la sucursal"
            />
          </div>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Gerente de tienda
              </label>
              <input
                type="text"
                value={form.gerente_tienda}
                onChange={(e) => setForm((p) => ({ ...p, gerente_tienda: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Teléfono
              </label>
              <input
                type="text"
                value={form.celular}
                onChange={(e) => setForm((p) => ({ ...p, celular: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Correo
            </label>
            <input
              type="email"
              value={form.correo}
              onChange={(e) => setForm((p) => ({ ...p, correo: e.target.value }))}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Dirección
            </label>
            <input
              type="text"
              value={form.direccion_sucursal}
              onChange={(e) => setForm((p) => ({ ...p, direccion_sucursal: e.target.value }))}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Centro
              </label>
              <input
                type="text"
                value={form.centro}
                onChange={(e) => setForm((p) => ({ ...p, centro: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                CC
              </label>
              <input
                type="text"
                value={form.cc}
                onChange={(e) => setForm((p) => ({ ...p, cc: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Permisos de la sucursal *
          </p>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Selecciona los permisos que aplican a esta sucursal. Al desmarcar uno en edición, se
            eliminan su configuración y los expedientes o solicitudes asociados a ese permiso en
            esta tienda.
          </p>

          {catalogo.length === 0 ? (
            <p className="text-[12px] text-amber-600 italic">No hay permisos en el catálogo.</p>
          ) : (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-100 divide-y divide-gray-50">
              {catalogo.map((perm) => {
                const checked = form.permisosSeleccionados.includes(perm.id)
                return (
                  <label
                    key={perm.id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50/80 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePermiso(perm.id)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500/30"
                    />
                    <span className="text-[13px] text-slate-700">{perm.nombre_permiso}</span>
                  </label>
                )
              })}
            </div>
          )}

          <p className="text-[11px] text-gray-400">
            {form.permisosSeleccionados.length} permiso
            {form.permisosSeleccionados.length !== 1 ? 's' : ''} seleccionado
            {form.permisosSeleccionados.length !== 1 ? 's' : ''}
          </p>
        </div>
      </form>
    </Modal>
  )
}
