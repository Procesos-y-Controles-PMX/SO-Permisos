'use client'

import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import type { PermisoAdminRow, PermisoFormValues } from '@/hooks/usePermisosAdmin'

const inputClass =
  'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all'

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
            form="permiso-form"
            disabled={saving}
            className="px-4 py-2 text-[13px] font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear permiso'}
          </button>
        </>
      }
    >
      <form id="permiso-form" onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {formError}
          </p>
        )}

        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Nombre del permiso *
          </label>
          <input
            type="text"
            required
            value={form.nombre_permiso}
            onChange={(e) => setForm((p) => ({ ...p, nombre_permiso: e.target.value }))}
            className={inputClass}
            placeholder="Ej. Licencia de funcionamiento..."
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Ponderación *
          </label>
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
            className={inputClass}
          />
          <p className="mt-1.5 text-[11px] text-gray-400">
            Peso del permiso en métricas de cumplimiento (entero ≥ 1).
          </p>
        </div>
      </form>
    </Modal>
  )
}
