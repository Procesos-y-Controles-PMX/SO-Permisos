import "server-only";

import { createSupabaseServerClient } from "../supabase-server";
import { ACTIVE_STATUSES, firstJoin } from "./helpers";
import type { HistorialPermisoItem } from "./historial.shared";

export type { HistorialPermisoItem } from "./historial.shared";

export async function listHistorial(idTienda: number): Promise<HistorialPermisoItem[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  const { data: configData, error: configErr } = await supabase
    .from("configuracion_tienda_permisos")
    .select(`
      id,
      id_tipo_permiso,
      obligatorio,
      comentarios,
      tipo_permiso:id_tipo_permiso(id, nombre_permiso)
    `)
    .eq("id_tienda", idTienda)
    .order("id_tipo_permiso", { ascending: true });

  if (configErr) throw new Error(configErr.message);

  const { data: solicitudesData, error: solicitudesErr } = await supabase
    .from("solicitudes")
    .select(`
      *,
      tipo_permiso:id_tipo_permiso(id, nombre_permiso)
    `)
    .eq("id_tienda", idTienda)
    .order("fecha_solicitud", { ascending: false });

  if (solicitudesErr) throw new Error(solicitudesErr.message);

  const { data: vigentesData, error: vigentesErr } = await supabase
    .from("permisos_vigentes")
    .select("id_tipo_permiso, estatus, fecha_vencimiento, archivo_path, ultima_actualizacion")
    .eq("id_tienda", idTienda)
    .order("ultima_actualizacion", { ascending: false });

  if (vigentesErr) throw new Error(vigentesErr.message);

  const solicitudesPorPermiso = new Map<number, Record<string, unknown>[]>();
  (solicitudesData || []).forEach((s) => {
    const list = solicitudesPorPermiso.get(s.id_tipo_permiso) || [];
    list.push(s as Record<string, unknown>);
    solicitudesPorPermiso.set(s.id_tipo_permiso, list);
  });

  const vigenteMasRecientePorPermiso = new Map<number, Record<string, unknown>>();
  (vigentesData || []).forEach((v) => {
    if (!vigenteMasRecientePorPermiso.has(v.id_tipo_permiso)) {
      vigenteMasRecientePorPermiso.set(v.id_tipo_permiso, v as Record<string, unknown>);
    }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (configData || []).map((cfg) => {
    const tipo = firstJoin(cfg.tipo_permiso as { nombre_permiso?: string } | { nombre_permiso?: string }[]);
    const idTipoPermiso = cfg.id_tipo_permiso as number;
    const nombrePermiso = tipo?.nombre_permiso || "Permiso desconocido";
    const solicitudes = solicitudesPorPermiso.get(idTipoPermiso) || [];
    const pendiente = solicitudes.find((s) => s.estatus_solicitud === "Pendiente");
    const ultimaSolicitud = solicitudes[0];
    const vigente = vigenteMasRecientePorPermiso.get(idTipoPermiso);
    const isExpired = Boolean(
      vigente?.fecha_vencimiento &&
        new Date(String(vigente.fecha_vencimiento)).setHours(0, 0, 0, 0) < today.getTime(),
    );

    const notasBase = {
      configId: cfg.id as number,
      notasPermiso: (cfg.comentarios as string | null) || null,
    };

    if (pendiente) {
      return {
        ...notasBase,
        idTienda,
        idTipoPermiso,
        nombrePermiso,
        obligatorio: (cfg.obligatorio as boolean) ?? true,
        estado: "En Revisión" as const,
        fechaActualizacion: (pendiente.fecha_solicitud as string) || null,
        vigencia: (pendiente.vigencia_propuesta as string) || null,
        archivoPath: (pendiente.archivo_adjunto_path as string) || null,
        comentariosAdmin: null,
      };
    }

    if (ultimaSolicitud?.estatus_solicitud === "Rechazado") {
      return {
        ...notasBase,
        idTienda,
        idTipoPermiso,
        nombrePermiso,
        obligatorio: (cfg.obligatorio as boolean) ?? true,
        estado: "Rechazado" as const,
        fechaActualizacion: (ultimaSolicitud.fecha_solicitud as string) || null,
        vigencia: (ultimaSolicitud.vigencia_propuesta as string) || null,
        archivoPath: (ultimaSolicitud.archivo_adjunto_path as string) || null,
        comentariosAdmin: (ultimaSolicitud.comentarios_admin as string) || null,
      };
    }

    if (vigente && ACTIVE_STATUSES.has(String(vigente.estatus)) && !isExpired) {
      return {
        ...notasBase,
        idTienda,
        idTipoPermiso,
        nombrePermiso,
        obligatorio: (cfg.obligatorio as boolean) ?? true,
        estado: "Aceptado" as const,
        fechaActualizacion: (vigente.ultima_actualizacion as string) || null,
        vigencia: (vigente.fecha_vencimiento as string) || null,
        archivoPath: (vigente.archivo_path as string) || null,
        comentariosAdmin: null,
      };
    }

    return {
      ...notasBase,
      idTienda,
      idTipoPermiso,
      nombrePermiso,
      obligatorio: (cfg.obligatorio as boolean) ?? true,
      estado: "No Subido" as const,
      fechaActualizacion: null,
      vigencia: null,
      archivoPath: null,
      comentariosAdmin: null,
    };
  });
}
