// ============================================================
// Enums
// ============================================================

export type RolUsuario = 'Admin' | 'Tienda' | 'Regional'

export type EstatusSolicitud = 'Pendiente' | 'Aprobado' | 'Rechazado'

export type EstatusPermiso = 'Vigente' | 'Vencido' | 'Por Vencer'

export type TipoAlerta = 'vencimiento' | 'solicitud_nueva' | 'solicitud_aprobada' | 'solicitud_rechazada'

// ============================================================
// Models (match SQL schema exactly)
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
  id: string // UUID from auth.users
  username: string | null
  nombre_completo: string | null
  id_rol: number
  id_tienda: number | null
  id_region: number | null
  updated_at: string
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

export interface Solicitud {
  id: number
  id_tienda: number
  id_tipo_permiso: number
  fecha_solicitud: string
  vigencia_propuesta: string | null
  archivo_adjunto_path: string | null
  estatus_solicitud: EstatusSolicitud
  comentarios_admin: string | null
  id_admin_revisor: string | null
  // Joined
  tienda?: Tienda
  tipo_permiso?: CatalogoPermiso
}

export interface Notificacion {
  id: number
  id_usuario: string
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
