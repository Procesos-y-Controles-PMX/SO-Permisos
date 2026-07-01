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
import type { RegionAdminRow, RegionFormValues } from '@/hooks/useSucursalesAdmin'

interface RegionFormModalProps {
  open: boolean
  onClose: () => void
  region?: RegionAdminRow | null
  onSubmit: (values: RegionFormValues) => Promise<{ error: string | null }>
  saving?: boolean
}

function emptyForm(): RegionFormValues {
  return {
    nombre_region: '',
    gerente_regional: '',
    celular: '',
    correo: '',
  }
}

function regionToForm(region: RegionAdminRow): RegionFormValues {
  return {
    nombre_region: region.nombre_region,
    gerente_regional: region.gerente_regional ?? '',
    celular: region.celular ?? '',
    correo: region.correo ?? '',
  }
}

export default function RegionFormModal({
  open,
  onClose,
  region,
  onSubmit,
  saving = false,
}: RegionFormModalProps) {
  const isEdit = Boolean(region)
  const [form, setForm] = useState<RegionFormValues>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setFormError(null)
    setForm(region ? regionToForm(region) : emptyForm())
  }, [open, region])

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
      title={isEdit ? 'Editar región' : 'Nueva región'}
      actions={
        <>
          <button type="button" onClick={onClose} disabled={saving} className={BTN_SECONDARY}>
            Cancelar
          </button>
          <button type="submit" form="region-form" disabled={saving} className={BTN_PRIMARY}>
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear región'}
          </button>
        </>
      }
    >
      <form id="region-form" onSubmit={handleSubmit} className="space-y-4">
        {formError && <p className={ALERT_ERROR}>{formError}</p>}

        <label className={`space-y-1.5 ${FIELD_LABEL}`}>
          Nombre de la región *
          <input
            type="text"
            required
            value={form.nombre_region}
            onChange={(e) => setForm((p) => ({ ...p, nombre_region: e.target.value }))}
            className={`${FIELD_INPUT} normal-case`}
            placeholder="Ej. Metro, Norte, Pacífico..."
          />
        </label>

        <label className={`space-y-1.5 ${FIELD_LABEL}`}>
          Gerente regional *
          <input
            type="text"
            required
            value={form.gerente_regional}
            onChange={(e) => setForm((p) => ({ ...p, gerente_regional: e.target.value }))}
            className={`${FIELD_INPUT} normal-case`}
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className={`space-y-1.5 ${FIELD_LABEL}`}>
            Teléfono (opcional)
            <input
              type="text"
              value={form.celular}
              onChange={(e) => setForm((p) => ({ ...p, celular: e.target.value }))}
              className={`${FIELD_INPUT} normal-case`}
            />
          </label>
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
        </div>
      </form>
    </Modal>
  )
}
