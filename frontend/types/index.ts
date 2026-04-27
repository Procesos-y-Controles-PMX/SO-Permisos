// ============================================================
// Enums
// ============================================================

export type RolUsuario = 'Admin' | 'Tienda' | 'Regional'

export type EstatusSolicitud = 'Pendiente' | 'Aprobado' | 'Rechazado'

export type EstatusPermiso = 'Pendiente' | 'Activo' | 'Vencido' | 'Aprobado'

export type TipoAlerta = 'vencimiento' | 'solicitud_nueva' | 'solicitud_aprobada' | 'solicitud_rechazada'

// ============================================================
// Models (match SQL schema — custom auth, integer IDs)
// ============================================================

export interface Rol {
  id: number
  nombre_rol: RolUsuario
}

export interface Region {
  id: number
  nombre_region: string
  gerente_regional: string | null
  celular: string | null
  correo: string | null
}

export interface Tienda {
  id: number
  sucursal: string
  centro: string | null
  cc: string | null
  id_region: number
  gerente_tienda: string | null
  celular: string | null
  correo: string | null
  direccion_sucursal: string | null
  // Joined
  region?: Region
}

export interface Perfil {
  id: number // SERIAL integer (no longer UUID)
  email: string
  password?: string // Excluded from selects for security
  nombre_completo: string | null
  id_rol: number
  id_tienda: number | null
  id_region: number | null
  created_at: string
  // Joined
  rol?: Rol
  tienda?: Tienda
  region?: Region
}

export interface CatalogoPermiso {
  id: number
  nombre_permiso: string
  ponderacion: number
}

export interface PermisoVigente {
  id: number
  id_tienda: number
  id_tipo_permiso: number
  fecha_vencimiento: string | null
  estatus: EstatusPermiso
  archivo_path: string | null
  puntaje: number | null
  comentarios: string | null
  ultima_actualizacion: string
  // Joined
  tienda?: Tienda
  tipo_permiso?: CatalogoPermiso
}

export interface ConfiguracionTiendaPermiso {
  id: number
  id_tienda: number
  id_tipo_permiso: number
  obligatorio: boolean
  // Joined
  tienda?: Tienda
  tipo_permiso?: CatalogoPermiso
  permiso_vigente?: PermisoVigente // Merged status from join
}

export interface Solicitud {
  id: number
  id_tienda: number
  id_tipo_permiso: number
  fecha_solicitud: string
  vigencia_propuesta: string | null
  archivo_adjunto_path: string | null
  estatus_solicitud: EstatusSolicitud
  comentarios_admin: string | null
  id_admin_revisor: number | null // Integer reference to perfiles.id
  // Joined
  tienda?: Tienda
  tipo_permiso?: CatalogoPermiso
}

export interface Notificacion {
  id: number
  id_usuario: number // Integer reference to perfiles.id
  mensaje: string
  tipo_alerta: TipoAlerta
  leida: boolean
  fecha_creacion: string
}

// ============================================================
// UI Helpers
// ============================================================

export interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

export type HistorialPermisoEstado = 'No Subido' | 'En Revisión' | 'Aceptado' | 'Rechazado'
