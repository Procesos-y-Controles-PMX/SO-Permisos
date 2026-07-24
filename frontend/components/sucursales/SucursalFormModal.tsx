'use client'

import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import {
  ALERT_ERROR,
  BTN_PRIMARY,
  BTN_SECONDARY,
  CHEVRON_SELECT,
  FIELD_INPUT,
  FIELD_LABEL,
  FIELD_SELECT,
  PAGE_EYEBROW,
} from '@/components/ui/contentStyles'
import type { CatalogoPermiso, Region, Tienda } from '@/types'
import type { TiendaFormValues } from '@/hooks/useSucursalesAdmin'

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

  const selectClass = `${FIELD_SELECT} ${CHEVRON_SELECT} cursor-pointer`

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar sucursal' : 'Nueva sucursal'}
      actions={
        <>
          <button type="button" onClick={onClose} disabled={saving} className={BTN_SECONDARY}>
            Cancelar
          </button>
          <button type="submit" form="sucursal-form" disabled={saving} className={BTN_PRIMARY}>
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear sucursal'}
          </button>
        </>
      }
    >
      <form id="sucursal-form" onSubmit={handleSubmit} className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
        {formError && <p className={ALERT_ERROR}>{formError}</p>}

        <div className="space-y-4">
          <p className={PAGE_EYEBROW}>Datos de la sucursal</p>

          <label className={`space-y-1.5 ${FIELD_LABEL}`}>
            Sucursal *
            <input
              type="text"
              required
              value={form.sucursal}
              onChange={(e) => setForm((p) => ({ ...p, sucursal: e.target.value }))}
              className={`${FIELD_INPUT} normal-case`}
              placeholder="Nombre de la sucursal"
            />
          </label>

          <label className={`space-y-1.5 ${FIELD_LABEL}`}>
            Región *
            <select
              required
              value={form.id_region ?? ''}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  id_region: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className={selectClass}
            >
              <option value="">Seleccionar región...</option>
              {regiones.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre_region}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className={`space-y-1.5 ${FIELD_LABEL}`}>
              Gerente de tienda *
              <input
                type="text"
                required
                value={form.gerente_tienda}
                onChange={(e) => setForm((p) => ({ ...p, gerente_tienda: e.target.value }))}
                className={`${FIELD_INPUT} normal-case`}
              />
            </label>
            <label className={`space-y-1.5 ${FIELD_LABEL}`}>
              Teléfono (opcional)
              <input
                type="text"
                value={form.celular}
                onChange={(e) => setForm((p) => ({ ...p, celular: e.target.value }))}
                className={`${FIELD_INPUT} normal-case`}
              />
            </label>
          </div>

          <label className={`space-y-1.5 ${FIELD_LABEL}`}>
            Correo *
            <input
              type="email"
              required
              value={form.correo}
              onChange={(e) => setForm((p) => ({ ...p, correo: e.target.value }))}
              className={`${FIELD_INPUT} normal-case`}
            />
          </label>

          <label className={`space-y-1.5 ${FIELD_LABEL}`}>
            Dirección
            <input
              type="text"
              value={form.direccion_sucursal}
              onChange={(e) => setForm((p) => ({ ...p, direccion_sucursal: e.target.value }))}
              className={`${FIELD_INPUT} normal-case`}
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className={`space-y-1.5 ${FIELD_LABEL}`}>
              Centro
              <input
                type="text"
                value={form.centro}
                onChange={(e) => setForm((p) => ({ ...p, centro: e.target.value }))}
                className={`${FIELD_INPUT} normal-case`}
              />
            </label>
            <label className={`space-y-1.5 ${FIELD_LABEL}`}>
              CC
              <input
                type="text"
                value={form.cc}
                onChange={(e) => setForm((p) => ({ ...p, cc: e.target.value }))}
                className={`${FIELD_INPUT} normal-case`}
              />
            </label>
          </div>
        </div>

        <div className="space-y-2 border-t border-line-subtle pt-2">
          <p className={PAGE_EYEBROW}>Permisos de la sucursal *</p>
          <p className="text-[11px] leading-relaxed text-fg-subtle">
            Selecciona los permisos que aplican a esta sucursal. Al desmarcar uno en edición, se
            eliminan su configuración y los expedientes o solicitudes asociados a ese permiso en
            esta tienda.
          </p>

          {catalogo.length === 0 ? (
            <p className="text-[12px] italic text-amber-600">No hay permisos en el catálogo.</p>
          ) : (
            <div className="max-h-48 divide-y divide-line-subtle overflow-y-auto rounded-sm border border-line">
              {catalogo.map((perm) => {
                const checked = form.permisosSeleccionados.includes(perm.id)
                return (
                  <label
                    key={perm.id}
                    className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted/80"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePermiso(perm.id)}
                      className="rounded-sm border-line-strong text-brand focus:ring-brand/15"
                    />
                    <span className="text-[13px] text-fg-strong">{perm.nombre_permiso}</span>
                  </label>
                )
              })}
            </div>
          )}

          <p className="text-[11px] text-fg-faint">
            {form.permisosSeleccionados.length} permiso
            {form.permisosSeleccionados.length !== 1 ? 's' : ''} seleccionado
            {form.permisosSeleccionados.length !== 1 ? 's' : ''}
          </p>
        </div>
      </form>
    </Modal>
  )
}
