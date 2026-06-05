'use client'

import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import type { RegionAdminRow, RegionFormValues } from '@/hooks/useSucursalesAdmin'

const inputClass =
  'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all'

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
            form="region-form"
            disabled={saving}
            className="px-4 py-2 text-[13px] font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear región'}
          </button>
        </>
      }
    >
      <form id="region-form" onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {formError}
          </p>
        )}

        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Nombre de la región *
          </label>
          <input
            type="text"
            required
            value={form.nombre_region}
            onChange={(e) => setForm((p) => ({ ...p, nombre_region: e.target.value }))}
            className={inputClass}
            placeholder="Ej. Metro, Norte, Pacífico..."
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Gerente regional *
          </label>
          <input
            type="text"
            required
            value={form.gerente_regional}
            onChange={(e) => setForm((p) => ({ ...p, gerente_regional: e.target.value }))}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Teléfono (opcional)
            </label>
            <input
              type="text"
              value={form.celular}
              onChange={(e) => setForm((p) => ({ ...p, celular: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Correo *
            </label>
            <input
              type="email"
              required
              value={form.correo}
              onChange={(e) => setForm((p) => ({ ...p, correo: e.target.value }))}
              className={inputClass}
            />
          </div>
        </div>
      </form>
    </Modal>
  )
}
