'use client'

import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import {
  ALERT_ERROR,
  BTN_PRIMARY,
  BTN_SECONDARY,
  FIELD_INPUT,
  FIELD_LABEL,
} from '@/components/ui/contentStyles'
import type { PermisoAdminRow, PermisoFormValues } from '@/hooks/usePermisosAdmin'

interface PermisoFormModalProps {
  open: boolean
  onClose: () => void
  permiso?: PermisoAdminRow | null
  onSubmit: (values: PermisoFormValues) => Promise<{ error: string | null }>
  saving?: boolean
}

function emptyForm(): PermisoFormValues {
  return {
    nombre_permiso: '',
    ponderacion: 1,
  }
}

function permisoToForm(permiso: PermisoAdminRow): PermisoFormValues {
  return {
    nombre_permiso: permiso.nombre_permiso,
    ponderacion: permiso.ponderacion,
  }
}

export default function PermisoFormModal({
  open,
  onClose,
  permiso,
  onSubmit,
  saving = false,
}: PermisoFormModalProps) {
  const isEdit = Boolean(permiso)
  const [form, setForm] = useState<PermisoFormValues>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setFormError(null)
    setForm(permiso ? permisoToForm(permiso) : emptyForm())
  }, [open, permiso])

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
      title={isEdit ? 'Editar permiso' : 'Nuevo permiso'}
      actions={
        <>
          <button type="button" onClick={onClose} disabled={saving} className={BTN_SECONDARY}>
            Cancelar
          </button>
          <button type="submit" form="permiso-form" disabled={saving} className={BTN_PRIMARY}>
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear permiso'}
          </button>
        </>
      }
    >
      <form id="permiso-form" onSubmit={handleSubmit} className="space-y-4">
        {formError && <p className={ALERT_ERROR}>{formError}</p>}

        <label className={`space-y-1.5 ${FIELD_LABEL}`}>
          Nombre del permiso *
          <input
            type="text"
            required
            value={form.nombre_permiso}
            onChange={(e) => setForm((p) => ({ ...p, nombre_permiso: e.target.value }))}
            className={`${FIELD_INPUT} normal-case`}
            placeholder="Ej. Licencia de funcionamiento..."
          />
        </label>

        <label className={`space-y-1.5 ${FIELD_LABEL}`}>
          Ponderación *
          <input
            type="number"
            required
            min={1}
            step={1}
            value={form.ponderacion}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                ponderacion: e.target.value === '' ? 0 : Number(e.target.value),
              }))
            }
            className={`${FIELD_INPUT} normal-case`}
          />
          <span className="block text-[11px] font-normal normal-case text-fg-faint">
            Peso del permiso en métricas de cumplimiento (entero ≥ 1).
          </span>
        </label>
      </form>
    </Modal>
  )
}
