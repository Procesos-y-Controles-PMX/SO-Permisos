'use client'

import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import type { Perfil, PerfilFormValues, Rol, Region, Tienda } from '@/types'
import { ROL_IDS } from '@/types'

const inputClass =
  'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all'

const readOnlyClass =
  'w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-[13px] text-gray-600 cursor-not-allowed'

interface UsuarioFormModalProps {
  open: boolean
  onClose: () => void
  usuario?: Perfil | null
  roles: Rol[]
  tiendas: Pick<Tienda, 'id' | 'sucursal'>[]
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
  return {
    email: usuario.email,
    password: '',
    nombre_completo: usuario.nombre_completo ?? '',
    id_rol: usuario.id_rol,
    id_tienda: usuario.id_tienda,
    id_region: usuario.id_region,
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

  const showTienda = form.id_rol === ROL_IDS.Tienda
  const showRegion = form.id_rol === ROL_IDS.Regional

  const handleRolChange = (idRol: number) => {
    setForm((prev) => ({
      ...prev,
      id_rol: idRol,
      id_tienda: idRol === ROL_IDS.Tienda ? prev.id_tienda : null,
      id_region: idRol === ROL_IDS.Regional ? prev.id_region : null,
    }))
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
            Rol {isEdit ? '' : '*'}
          </label>
          {isEdit ? (
            <>
              <div className={readOnlyClass}>{usuario?.rol?.nombre_rol ?? '—'}</div>
              <p className="text-[11px] text-gray-400 mt-1">El rol no se puede modificar.</p>
            </>
          ) : (
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
          )}
        </div>

        {isEdit ? (
          <>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Tienda
              </label>
              <div className={readOnlyClass}>{usuario?.tienda?.sucursal ?? '—'}</div>
              <p className="text-[11px] text-gray-400 mt-1">La asignación de tienda no se puede modificar.</p>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Región
              </label>
              <div className={readOnlyClass}>{usuario?.region?.nombre_region ?? '—'}</div>
              <p className="text-[11px] text-gray-400 mt-1">La asignación de región no se puede modificar.</p>
            </div>
          </>
        ) : (
          <>
            {showTienda && (
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Tienda *
                </label>
                <select
                  required
                  value={form.id_tienda ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      id_tienda: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  className={`${inputClass} appearance-none cursor-pointer`}
                >
                  <option value="">Seleccionar tienda...</option>
                  {tiendas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.sucursal}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {showRegion && (
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
          </>
        )}
      </form>
    </Modal>
  )
}
