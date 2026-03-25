'use client'

import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Tabs from '@/components/ui/Tabs'
import Card from '@/components/ui/Card'
import Badge, { statusToBadgeVariant } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { usePermisos } from '@/hooks/usePermisos'
import { useSolicitudes } from '@/hooks/useSolicitudes'
import { useAuth } from '@/contexts/AuthContext'
import { uploadFile } from '@/lib/storage'
import type { ConfiguracionTiendaPermiso } from '@/types'

// ── Component ──────────────────────────────────────────────

export default function PermisosPage() {
  const [activeTab, setActiveTab] = useState('listado')
  const { data: configuraciones, loading, error } = usePermisos()
  const { crearSolicitud } = useSolicitudes()
  const { perfil, isTienda } = useAuth()

  const [showModal, setShowModal] = useState(false)
  const [selectedConfig, setSelectedConfig] = useState<ConfiguracionTiendaPermiso | null>(null)
  const [vigencia, setVigencia] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSolicitud = (config: ConfiguracionTiendaPermiso) => {
    setSelectedConfig(config)
    setVigencia('')
    setArchivo(null)
    setSubmitError(null)
    setShowModal(true)
  }

  const handleSubmitSolicitud = async () => {
    if (!selectedConfig || !vigencia) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      let archivoPath: string | null = null

      // Upload file if provided
      if (archivo && perfil) {
        const { path, error: uploadErr } = await uploadFile(archivo, selectedConfig.id_tienda)
        if (uploadErr) throw new Error(uploadErr)
        archivoPath = path
      }

      const { error: createErr } = await crearSolicitud({
        id_tienda: selectedConfig.id_tienda,
        id_tipo_permiso: selectedConfig.id_tipo_permiso,
        vigencia_propuesta: vigencia,
        archivo_adjunto_path: archivoPath,
      })

      if (createErr) throw new Error(createErr)
      setShowModal(false)
    } catch (e: any) {
      setSubmitError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Permisos" subtitle="Cargando requisitos..." />
        <Card className="animate-pulse shadow-sm"><div className="h-64 bg-gray-50/50 rounded-lg" /></Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Permisos" subtitle="Ocurrió un error" />
        <Card className="text-center py-12 border-red-100 bg-red-50/20">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-700 font-medium">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={() => window.location.reload()}>Reintentar</Button>
        </Card>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Expediente de Permisos"
        subtitle="Cumplimiento reglamentario y requisitos por sucursal"
      />

      <div className="mb-6">
        <Tabs
          tabs={[
            {
              key: 'listado',
              label: 'Requisitos y Estatus',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
            },
            {
              key: 'estadisticas',
              label: 'Dashboard de Cumplimiento',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
            },
          ]}
          defaultTab="listado"
          onChange={setActiveTab}
        />
      </div>

      {activeTab === 'listado' ? (
        <Card className="p-0 overflow-hidden shadow-sm border-gray-100">
          {configuraciones.length === 0 ? (
            <div className="text-center py-20 bg-gray-50/30">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No hay requisitos configurados para esta tienda.</p>
              <p className="text-gray-400 text-sm mt-1">Contacta al administrador para asignar permisos obligatorios.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Sucursal</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Permiso Requerido</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Vencimiento</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Estatus Actual</th>
                    <th className="py-4 px-6 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Gestión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {configuraciones.map((config) => {
                    const vigente = config.permiso_vigente
                    return (
                      <tr key={config.id} className="hover:bg-blue-50/20 transition-colors">
                        <td className="py-4 px-6 align-middle">
                          <span className="font-semibold text-slate-700 text-[13px]">{config.tienda?.sucursal ?? '—'}</span>
                        </td>
                        <td className="py-4 px-6 align-middle">
                          <div className="flex flex-col">
                            <span className="text-[14px] text-slate-800 font-medium">{config.tipo_permiso?.nombre_permiso ?? 'Desconocido'}</span>
                            {config.obligatorio && (
                              <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter mt-0.5">Obligatorio</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 align-middle">
                          {vigente?.fecha_vencimiento ? (
                            <div className="flex flex-col">
                              <span className="text-[13px] text-slate-600 font-mono">
                                {new Date(vigente.fecha_vencimiento).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                              <span className="text-[11px] text-gray-400">Actualizado el {new Date(vigente.ultima_actualizacion).toLocaleDateString()}</span>
                            </div>
                          ) : (
                            <span className="text-gray-300 italic text-[13px]">Sin registro</span>
                          )}
                        </td>
                        <td className="py-4 px-6 align-middle">
                          {vigente ? (
                            <Badge variant={statusToBadgeVariant(vigente.estatus)}>{vigente.estatus}</Badge>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                              No Subido
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 align-middle text-right">
                          <div className="flex items-center justify-end gap-2">
                            {vigente?.archivo_path && (
                              <button 
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" 
                                title="Ver archivo"
                                onClick={() => window.open(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/permisos-bucket/${vigente.archivo_path}`, '_blank')}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            )}
                            {(vigente?.estatus === 'Vencido' || !vigente) && (
                              <Button size="sm" variant="primary" onClick={() => handleSolicitud(config)}>
                                {vigente ? 'Renovar' : 'Subir Documento'}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        <Card className="py-24 text-center border-dashed border-2 border-gray-200 bg-gray-50/30">
          <div className="max-w-md mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-6 font-bold text-xl">
              %
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Resumen Semanal</h3>
            <p className="text-gray-500 text-[14px] mb-8 leading-relaxed">
              Pronto podrás visualizar gráficas detalladas de cumplimiento por categoría y comparativas regionales para optimizar tus renovaciones.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">Histórico</p>
                <div className="h-2 w-full bg-gray-100 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '85%' }} />
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">Tendencia</p>
                <div className="flex items-center gap-1 mt-1 text-green-600 font-bold">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span>+12%</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Modal — Crear Solicitud */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={selectedConfig?.permiso_vigente ? "Renovación de Permiso" : "Nueva Carga de Documento"}
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={submitting}>Cancelar</Button>
            <Button variant="primary" onClick={handleSubmitSolicitud} disabled={submitting || !vigencia}>
              {submitting ? 'Enviando...' : 'Enviar a Revisión'}
            </Button>
          </>
        }
      >
        {selectedConfig && (
          <div className="space-y-5">
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-[13px] flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {submitError}
              </div>
            )}

            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-[15px] font-bold text-slate-800">{selectedConfig.tipo_permiso?.nombre_permiso}</h4>
                <Badge variant={selectedConfig.obligatorio ? 'danger' : 'secondary'}>
                  {selectedConfig.obligatorio ? 'Crítico' : 'Opcional'}
                </Badge>
              </div>
              <p className="text-[12px] text-slate-500">Tienda: <span className="font-semibold text-slate-700">{selectedConfig.tienda?.sucursal}</span></p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  Fecha de Vigencia Propuesta
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={vigencia}
                    onChange={(e) => setVigencia(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  Documento Probatorio (PDF)
                </label>
                <div 
                  className={`
                    border-2 border-dashed rounded-2xl p-6 transition-all duration-200 text-center
                    ${archivo ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-blue-200'}
                  `}
                >
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    {!archivo ? (
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-500 mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="text-[13px] font-semibold text-slate-700">Click para seleccionar</p>
                        <p className="text-[11px] text-gray-400 mt-1">Máximo 10MB • Solo archivos PDF</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-green-500 mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-[13px] font-semibold text-green-700 truncate w-64 px-4">{archivo.name}</p>
                        <p className="text-[11px] text-green-600/70 mt-1">{(archivo.size / 1024 / 1024).toFixed(2)} MB • Listo para subir</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-orange-50/50 rounded-xl border border-orange-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[11px] text-orange-800/80 leading-relaxed">
                Al enviar este documento, entrará en proceso de validación por Mesa de Control. Serás notificado una vez que el estatus cambie.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
